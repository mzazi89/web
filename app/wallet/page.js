'use client';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fmtKes } from '@/lib/currency';

// ─── Payment method metadata (icons are inline SVGs — no extra deps) ────────
const METHODS = {
  card: {
    name: 'Card',
    desc: 'Visa & Mastercard',
    hint: 'Secure checkout via Paystack.',
    color: '#4C7DFC',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="6" y1="15" x2="10" y2="15" />
      </svg>
    ),
  },
  mpesa: {
    name: 'M-PESA',
    desc: 'Pay from your phone',
    hint: 'Approve with your M-PESA PIN.',
    color: '#3ECF8E',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="7" y="2" width="10" height="20" rx="2.5" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </svg>
    ),
  },
  airtel: {
    name: 'Airtel Money',
    desc: 'Airtel wallet',
    hint: 'Approve with your Airtel PIN.',
    color: '#E5484D',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="7" y="2" width="10" height="20" rx="2.5" />
        <path d="M11 18h2" />
        <circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  mptill: {
    name: 'M-PESA Till',
    desc: 'Pay from your till',
    hint: 'The prompt goes to the phone registered to the till.',
    color: '#F2A93B',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
        <path d="M10 11h.01M14 11h.01" />
      </svg>
    ),
  },
};

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000];

// ─── Receipt printer (no library needed) ────────────────────────────────────
function downloadReceipt(t, userEmail, balance) {
  const date = new Date(t.created_at);
  const dateStr = date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const isDebit = t.type !== 'deposit';
  const sign = isDebit ? '-' : '+';
  const color = isDebit ? '#e5484d' : '#3ecf8e';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Mzazi Tech Receipt #${t.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#f5f4f2; display:flex; justify-content:center; align-items:flex-start; padding:clamp(12px, 4vw, 30px); font-family:'Space Grotesk',sans-serif; }
    .receipt {
      background:#fff;
      width:100%;
      max-width:380px;
      border-radius:4px;
      box-shadow:0 4px 24px rgba(0,0,0,0.12);
      overflow:hidden;
      position:relative;
    }
    .receipt::before {
      content:'';
      display:block;
      height:14px;
      background: radial-gradient(circle at 10px 14px, #f5f4f2 10px, transparent 0) repeat-x, #fff;
      background-size:20px 14px, 100% 100%;
    }
    .receipt::after {
      content:'';
      display:block;
      height:14px;
      background: radial-gradient(circle at 10px 0px, #f5f4f2 10px, transparent 0) repeat-x, #fff;
      background-size:20px 14px, 100% 100%;
      transform:rotate(180deg);
    }
    .header {
      background:#0B0D0F;
      color:#fff;
      text-align:center;
      padding:28px 24px 20px;
    }
    .logo { font-size:20px; font-weight:700; letter-spacing:0.5px; margin-bottom:4px; }
    .logo span { color:#F2A93B; }
    .tagline { font-family:'IBM Plex Mono',monospace; font-size:9px; color:#79818A; letter-spacing:2px; text-transform:uppercase; }
    .status-badge {
      display:inline-block;
      margin-top:14px;
      padding:4px 16px;
      border-radius:2px;
      font-family:'IBM Plex Mono',monospace;
      font-size:10px;
      font-weight:600;
      letter-spacing:1px;
      text-transform:uppercase;
      background:${t.status === 'success' ? 'rgba(62,207,142,0.15)' : 'rgba(242,169,59,0.15)'};
      color:${t.status === 'success' ? '#3ecf8e' : '#f2a93b'};
      border:1px solid ${t.status === 'success' ? 'rgba(62,207,142,0.4)' : 'rgba(242,169,59,0.4)'};
    }
    .body { padding:24px; }
    .amount-section { text-align:center; padding:20px 0 24px; border-bottom:1px dashed #e0dedb; }
    .amount-label { font-family:'IBM Plex Mono',monospace; font-size:9px; color:#94908a; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px; }
    .amount { font-size:38px; font-weight:700; color:${color}; letter-spacing:-1px; }
    .currency { font-size:16px; font-weight:500; }
    .rows { padding:20px 0; border-bottom:1px dashed #e0dedb; }
    .row { display:flex; justify-content:space-between; align-items:flex-start; padding:7px 0; font-size:13px; }
    .row-label { color:#8a8680; font-size:11px; font-family:'IBM Plex Mono',monospace; text-transform:uppercase; letter-spacing:0.6px; }
    .row-value { color:#1c1e20; font-weight:600; text-align:right; max-width:200px; word-break:break-all; }
    .ref { font-family:'IBM Plex Mono',monospace; font-size:11px; color:#4c7dfc; }
    .warranty {
      margin:16px 0 0;
      padding:12px 14px;
      background:#faf6ef;
      border-radius:2px;
      border-left:3px solid #F2A93B;
      font-size:11px;
      color:#7a6a4f;
      line-height:1.6;
    }
    .warranty strong { display:block; margin-bottom:2px; font-size:12px; color:#0B0D0F; }
    .footer { text-align:center; padding:16px 24px 20px; }
    .footer p { font-size:10px; color:#94908a; line-height:1.7; }
    .footer a { color:#4c7dfc; text-decoration:none; }
    .barcode {
      font-family:'IBM Plex Mono',monospace;
      font-size:9px;
      color:#cfccc6;
      letter-spacing:4px;
      margin-top:8px;
      word-break:break-all;
    }
    @media print {
      body { background:#fff; padding:0; }
      .receipt { box-shadow:none; }
    }
  </style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div class="logo">MZAZI<span>.</span>TECH</div>
    <div class="tagline">Official Transaction Receipt</div>
    <div class="status-badge">${t.status}</div>
  </div>
  <div class="body">
    <div class="amount-section">
      <div class="amount-label">Transaction Amount</div>
      <div class="amount"><span class="currency">KES </span>${sign}${Number(t.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="rows">
      <div class="row"><span class="row-label">Receipt No.</span><span class="row-value ref">#MZAZI-${String(t.id).padStart(6,'0')}</span></div>
      <div class="row"><span class="row-label">Date</span><span class="row-value">${dateStr}</span></div>
      <div class="row"><span class="row-label">Time</span><span class="row-value">${timeStr}</span></div>
      <div class="row"><span class="row-label">Description</span><span class="row-value">${t.description || t.type}</span></div>
      <div class="row"><span class="row-label">Transaction Type</span><span class="row-value" style="text-transform:capitalize">${t.type}</span></div>
      <div class="row"><span class="row-label">Account</span><span class="row-value">${userEmail || '—'}</span></div>
      ${t.reference ? `<div class="row"><span class="row-label">Reference</span><span class="row-value ref">${t.reference}</span></div>` : ''}
      <div class="row"><span class="row-label">Wallet Balance After</span><span class="row-value">KES ${Number(balance).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span></div>
    </div>
    <div class="warranty">
      <strong>Panel Warranty Policy</strong>
      Pterodactyl panel replacement warranty is valid for <strong>2 weeks</strong> from the date of purchase. Contact support within this period for a free replacement.
    </div>
  </div>
  <div class="footer">
    <p>Thank you for using Mzazi Tech Inc.<br/>
    Support: <a href="https://t.me/mzazitech">t.me/mzazitech</a> &nbsp;|&nbsp; <a href="https://official.mzazi.shop">official.mzazi.shop</a></p>
    <div class="barcode">||||| ${t.reference || `TX${t.id}`} |||||</div>
  </div>
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'width=480,height=720,scrollbars=yes');
  if (!win) {
    // fallback: direct download
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mzazi-Receipt-${t.id}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) return phone || '';
  const tail = digits.slice(-4);
  return `+254 7••• ••${tail}`;
}

// ─── Main wallet component ───────────────────────────────────────────────────
function WalletInner() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Multi-payment deposit flow
  const [step, setStep] = useState('method'); // method | details | processing | success | failed
  const [method, setMethod] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [till, setTill] = useState('');
  const [reference, setReference] = useState('');
  const [sending, setSending] = useState(false);
  const [waitingSec, setWaitingSec] = useState(0);
  const [pollExpired, setPollExpired] = useState(false);
  const [pollNonce, setPollNonce] = useState(0); // re-triggers polling after "Check again"
  const [error, setError] = useState(null);
  const [successAmount, setSuccessAmount] = useState(null);

  const [voucherCode, setVoucherCode] = useState('');
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [message, setMessage] = useState(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pollRef = useRef(null);

  // ── Initial load + card-callback query params ─────────────────────────────
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const amount = searchParams.get('amount');
    if (success === 'credited') {
      setMessage({ type: 'success', text: `${fmtKes(amount)} has been added to your wallet!` });
    } else if (success === 'already_credited') {
      setMessage({ type: 'info', text: 'Payment already credited to your wallet.' });
    } else if (error) {
      setMessage({ type: 'error', text: 'Payment failed or was cancelled. Please try again.' });
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) { router.push('/login'); return; }
      const data = await res.json();
      setUser(data.user);
      await fetchWallet();
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchWallet = async () => {
    const res = await fetch('/api/wallet/balance');
    if (res.ok) {
      const data = await res.json();
      setBalance(data.balance || 0);
      setTransactions(data.transactions || []);
    }
  };

  // ── Status polling while waiting for Paystack confirmation ────────────────
  const checkStatus = async () => {
    if (!reference) return null;
    try {
      const res = await fetch(`/api/wallet/deposit/status?reference=${encodeURIComponent(reference)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessAmount(data.amount);
        setStep('success');
        fetchWallet();
        return 'done';
      }
      if (data.status === 'failed' || data.status === 'abandoned') {
        setStep('failed');
        return 'done';
      }
    } catch { /* keep waiting */ }
    return null;
  };

  useEffect(() => {
    if (step !== 'processing' || !reference) return;

    const startedAt = Date.now();
    const attempts = { n: 0 };

    const tick = setInterval(() => setWaitingSec(Math.floor((Date.now() - startedAt) / 1000)), 1000);

    pollRef.current = setInterval(async () => {
      attempts.n += 1;
      const done = await checkStatus();
      if (done) {
        clearInterval(pollRef.current);
        clearInterval(tick);
      } else if (attempts.n >= 45) {
        // Paystack's authorization window is 180s — stop auto-polling.
        clearInterval(pollRef.current);
        clearInterval(tick);
        setPollExpired(true);
      }
    }, 4000);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(tick);
    };
  }, [step, reference, pollNonce]);

  // ── Deposit: create transaction + start payment ───────────────────────────
  const handlePayNow = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 10) { setError('Minimum deposit is KES 10'); return; }
    if ((method === 'mpesa' || method === 'airtel') && phone.replace(/\D/g, '').length < 9) {
      setError('Enter a valid Kenyan phone number, e.g. 0712345678.');
      return;
    }
    if (method === 'mptill' && !/^\d{5,7}$/.test(String(till).replace(/[^\d]/g, ''))) {
      setError('Enter a valid M-PESA Till number (5–7 digits), e.g. 522533.');
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method,
          phone: method === 'mptill' ? undefined : phone.trim(),
          till: method === 'mptill' ? till : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to initialize payment. Please try again.');
        setSending(false);
        return;
      }
      if (data.type === 'redirect') {
        // Card → official Paystack checkout (browser redirect, PCI-safe)
        window.location.href = data.authorization_url;
        return;
      }
      // Mobile money → prompt sent to the phone, start waiting screen
      setReference(data.reference);
      setSending(false);
      setPollExpired(false);
      setWaitingSec(0);
      setStep('processing');
    } catch {
      setError('Network error. Please try again.');
      setSending(false);
    }
  };

  const handleRecheck = async () => {
    setPollExpired(false);
    const done = await checkStatus();
    if (!done) setPollNonce(n => n + 1); // restart the polling loop
  };

  const resetFlow = () => {
    setStep('method');
    setMethod(null);
    setReference('');
    setError(null);
    setSuccessAmount(null);
    setPollExpired(false);
    setWaitingSec(0);
  };

  const handleRedeemVoucher = async (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    setRedeemingVoucher(true);
    setMessage(null);
    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setVoucherCode('');
        setShowVoucherForm(false);
        setBalance(data.newBalance);
        await fetchWallet();
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid voucher code' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setRedeemingVoucher(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const selected = method ? METHODS[method] : null;
  const isMobileMoney = method === 'mpesa' || method === 'airtel';

  // ── Render: deposit flow screens ──────────────────────────────────────────
  const renderDepositFlow = () => {
    // STEP 1 — Payment method selection
    if (step === 'method') {
      return (
        <div className="wm-step-fade">
          <p className="mono text-[10px] uppercase tracking-[0.18em] mb-4" style={{ color: '#4C535B' }}>
            Step 1 · Choose payment method
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(METHODS).map(([key, m]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setMethod(key); setError(null); setStep('details'); }}
                className="wm-method-card"
                style={{
                  background: '#0F1215',
                  border: '1px solid #262C33',
                  borderRadius: 4,
                  padding: '16px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color .2s, transform .15s, background .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.background = '#14181D'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#262C33'; e.currentTarget.style.background = '#0F1215'; }}
              >
                <span className="flex items-center justify-center w-11 h-11 flex-shrink-0"
                  style={{ background: `${m.color}14`, border: `1px solid ${m.color}33`, borderRadius: 4, color: m.color }}>
                  {m.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold" style={{ color: '#E9E7E2' }}>{m.name}</span>
                  <span className="block text-xs mt-0.5" style={{ color: '#79818A' }}>{m.desc}</span>
                </span>
                <span className="ml-auto flex-shrink-0 w-4 h-4 rounded-full" style={{ border: '1.5px solid #4C535B' }} />
              </button>
            ))}
          </div>
        </div>
      );
    }

    // STEP 2 — Amount + details form
    if (step === 'details' && selected) {
      return (
        <form onSubmit={handlePayNow} className="wm-step-fade">
          <button type="button" onClick={() => { setStep('method'); setError(null); }}
            className="mono text-[10px] uppercase tracking-[0.14em] mb-4 flex items-center gap-1.5"
            style={{ color: '#79818A', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
            ← Back to methods
          </button>

          <div className="flex items-center gap-3 mb-5">
            <span className="flex items-center justify-center w-10 h-10" style={{ background: `${selected.color}14`, border: `1px solid ${selected.color}33`, borderRadius: 4, color: selected.color }}>
              {selected.icon}
            </span>
            <div>
              <p className="text-sm font-bold" style={{ color: '#E9E7E2' }}>{selected.name}</p>
              <p className="text-xs" style={{ color: '#79818A' }}>{selected.hint}</p>
            </div>
          </div>

          <div className="mb-3">
            <label className="label">Amount (KES)</label>
            <input
              type="number"
              min="10"
              value={depositAmount}
              onChange={e => { setDepositAmount(e.target.value); setError(null); }}
              placeholder="Enter amount…"
              className="input"
              required
              style={{ fontSize: '1.05rem' }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_AMOUNTS.map(amt => (
              <button key={amt} type="button" onClick={() => setDepositAmount(String(amt))}
                className="mono text-[11px] px-3 py-1.5 transition-colors"
                style={{
                  background: depositAmount === String(amt) ? `${selected.color}1F` : '#0F1215',
                  color: depositAmount === String(amt) ? selected.color : '#79818A',
                  border: `1px solid ${depositAmount === String(amt) ? `${selected.color}73` : '#262C33'}`,
                  cursor: 'pointer',
                }}>
                {fmtKes(amt)}
              </button>
            ))}
          </div>

          {isMobileMoney && (
            <div className="mb-3">
              <label className="label">{selected.name} phone number</label>
              <div className="flex" style={{ border: '1px solid #262C33', borderRadius: 2, background: '#0F1215', overflow: 'hidden' }}>
                <span className="mono flex items-center px-3 text-sm" style={{ color: '#79818A', background: '#14181D', borderRight: '1px solid #262C33' }}>+254</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 9)); setError(null); }}
                  placeholder="712 345 678"
                  className="input"
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}
                  required
                />
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: '#4C535B' }}>
                The payment prompt is sent to this number via {selected.name}.
              </p>
            </div>
          )}

          {method === 'mptill' && (
            <div className="mb-3">
              <label className="label">M-PESA Till number</label>
              <input
                type="text"
                inputMode="numeric"
                value={till}
                onChange={e => { setTill(e.target.value.replace(/[^\d]/g, '').slice(0, 7)); setError(null); }}
                placeholder="e.g. 522533"
                className="input font-mono tracking-[0.2em]"
                required
              />
              <p className="text-[11px] mt-1.5" style={{ color: '#4C535B' }}>
                Enter the till number paying for the deposit — the authorization prompt goes to the phone registered to that till, not your personal number.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 px-3 py-2.5 text-xs" style={{ background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.3)', color: '#E5484D', borderRadius: 2 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={sending} className="btn w-full" style={{
            background: selected.color === '#F2A93B' ? '#F2A93B' : 'linear-gradient(135deg, #F2A93B, #FFB84A)',
            color: '#14100A',
            opacity: sending ? 0.65 : 1,
            boxShadow: '0 8px 24px rgba(242,169,59,0.22)',
          }}>
            {sending
              ? 'Sending payment request…'
              : method === 'card'
                ? 'Continue to Paystack'
                : `PAY ${fmtKes(depositAmount || 0)}`}
          </button>
        </form>
      );
    }

    // STEP 3 — Processing / waiting for confirmation
    if (step === 'processing') {
      const showCheck = waitingSec >= 2;
      const showWait = waitingSec >= 7;
      return (
        <div className="wm-step-fade text-center py-4">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 wm-phone-ring"
            style={{ background: `${selected.color}14`, border: `1px solid ${selected.color}40`, color: selected.color }}>
            {selected.icon}
          </div>

          <p className="text-lg font-bold" style={{ color: '#E9E7E2' }}>Payment request sent to your phone.</p>
          <p className="text-sm mt-1 mb-6" style={{ color: '#79818A' }}>
            {isMobileMoney && <>Check your <span style={{ color: selected.color }}>{selected.name}</span> phone ({maskPhone(phone)}) and enter your PIN to approve.</>}
            {method === 'mptill' && <>The prompt was sent to the phone registered to till <span className="mono" style={{ color: selected.color }}>{till}</span>.</>}
            {method === 'card' && <>Complete the payment in the Paystack window.</>}
          </p>

          <div className="max-w-sm mx-auto text-left mb-7">
            {[
              { label: 'Payment request sent to your phone.', done: true },
              { label: 'Complete the authorization on your phone.', done: showCheck },
              { label: 'Waiting for payment confirmation…', active: showWait },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                {s.done ? (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0" style={{ background: 'rgba(62,207,142,0.15)', color: '#3ECF8E', border: '1px solid rgba(62,207,142,0.4)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                ) : s.active ? (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0" style={{ border: '1px solid rgba(242,169,59,0.5)' }}>
                    <span className="wm-dot w-2 h-2 rounded-full" style={{ background: '#F2A93B' }} />
                  </span>
                ) : (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0" style={{ border: '1px solid #262C33' }} />
                )}
                <span className="text-xs" style={{ color: s.done ? '#AEB5BD' : s.active ? '#E9E7E2' : '#4C535B' }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="max-w-sm mx-auto px-4 py-3 mb-5" style={{ background: '#0F1215', border: '1px solid #1B2026', borderRadius: 4 }}>
            <div className="flex items-center justify-between">
              <span className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: '#4C535B' }}>Reference</span>
              <span className="mono text-[11px]" style={{ color: '#79818A' }}>{reference}</span>
            </div>
          </div>

          {pollExpired ? (
            <div>
              <p className="text-xs mb-4" style={{ color: '#79818A' }}>
                Still waiting? The request expires after 3 minutes. Your money is only deducted if you approve the prompt.
              </p>
              <button onClick={handleRecheck} className="btn btn-primary" style={{ padding: '12px 22px', fontSize: 12 }}>
                Check again
              </button>
            </div>
          ) : (
            <p className="text-xs mb-4" style={{ color: '#4C535B' }}>
              Keep this page open — your wallet updates automatically once confirmed.
            </p>
          )}

          <button onClick={() => { setStep('details'); setError(null); }}
            className="mono text-[10px] uppercase tracking-[0.14em] underline underline-offset-4"
            style={{ color: '#4C535B', cursor: 'pointer', background: 'none', border: 'none' }}>
            Cancel this payment
          </button>
        </div>
      );
    }

    // STEP 4 — Success
    if (step === 'success') {
      return (
        <div className="wm-step-fade text-center py-6">
          <svg viewBox="0 0 52 52" className="wm-check w-20 h-20 mx-auto mb-5">
            <circle cx="26" cy="26" r="24" fill="none" stroke="#3ECF8E" strokeWidth="2" />
            <path fill="none" stroke="#3ECF8E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" d="M14 27l8 8 16-16" />
          </svg>
          <p className="text-lg font-bold" style={{ color: '#E9E7E2' }}>Payment successful!</p>
          <p className="text-3xl font-bold mt-2" style={{ color: '#3ECF8E' }}>+{fmtKes(successAmount ?? depositAmount)}</p>
          <p className="text-sm mt-2 mb-6" style={{ color: '#79818A' }}>
            Your wallet has been credited and the transaction added to your history.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={resetFlow} className="btn btn-primary" style={{ padding: '12px 22px', fontSize: 12 }}>
              Make another deposit
            </button>
            <button onClick={() => { resetFlow(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn btn-ghost" style={{ padding: '12px 22px', fontSize: 12 }}>
              Back to wallet
            </button>
          </div>
        </div>
      );
    }

    // STEP 5 — Failed
    if (step === 'failed') {
      return (
        <div className="wm-step-fade text-center py-6">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: 'rgba(229,72,77,0.1)', border: '1px solid rgba(229,72,77,0.4)', color: '#E5484D' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-8 h-8">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-lg font-bold" style={{ color: '#E9E7E2' }}>Payment not completed</p>
          <p className="text-sm mt-1 mb-6 max-w-sm mx-auto" style={{ color: '#79818A' }}>
            {error || 'The payment was not completed, so your wallet was not charged. Please try again or use another method.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => { setStep('details'); setError(null); }} className="btn btn-primary" style={{ padding: '12px 22px', fontSize: 12 }}>
              Try again
            </button>
            <button onClick={resetFlow} className="btn btn-ghost" style={{ padding: '12px 22px', fontSize: 12 }}>
              Choose another method
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="py-10 sm:py-14">
      <div className="container-site max-w-4xl">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
          <div>
            <p className="eyebrow">Wallet</p>
            <h1 className="headline mt-3" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)' }}>
              My wallet<span className="accent">.</span>
            </h1>
            <p className="text-sm mt-2" style={{ color: '#79818A' }}>
              Deposit funds and use them to deploy panels instantly.
            </p>
          </div>
          <a
            href="https://t.me/mzazitech"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ padding: '11px 18px', fontSize: 11 }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Telegram support
          </a>
        </div>

        {/* ── Alert ── */}
        {message && (
          <div className="mb-6 px-4 py-3 text-sm" style={{
            background: message.type === 'success' ? 'rgba(62,207,142,0.08)' : message.type === 'error' ? 'rgba(229,72,77,0.08)' : 'rgba(76,125,252,0.08)',
            border: `1px solid ${message.type === 'success' ? 'rgba(62,207,142,0.3)' : message.type === 'error' ? 'rgba(229,72,77,0.3)' : 'rgba(76,125,252,0.3)'}`,
            color: message.type === 'success' ? '#3ECF8E' : message.type === 'error' ? '#E5484D' : '#AEB5BD',
          }}>
            {message.text}
          </div>
        )}

        {/* ── Warranty Notice ── */}
        <div className="mb-8 flex items-start gap-3 px-4 py-3 text-xs"
          style={{ background: 'rgba(242,169,59,0.05)', border: '1px solid rgba(242,169,59,0.2)' }}>
          <span className="mono flex-shrink-0" style={{ color: '#F2A93B' }}>WRN</span>
          <p style={{ color: '#79818A', lineHeight: 1.7 }}>
            <span className="font-semibold" style={{ color: '#F2A93B' }}>Panel warranty: </span>
            Pterodactyl panel replacement warranty is valid for <strong style={{ color: '#E9E7E2' }}>2 weeks</strong> from purchase date.
            Contact <a href="https://t.me/mzazitech" target="_blank" rel="noopener noreferrer" className="link" style={{ fontSize: 12 }}>support</a> within this period for a free replacement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── Balance Card ── */}
          <div className="card p-6 flex flex-col justify-between">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.18em] mb-3" style={{ color: '#4C535B' }}>Available balance</p>
              <p className="stat-num" style={{ color: '#F2A93B', fontSize: 'clamp(2.2rem, 5vw, 3rem)' }}>
                {fmtKes(balance)}
              </p>
              {user && (
                <p className="mono text-[11px] mt-4" style={{ color: '#4C535B' }}>
                  Account: <span style={{ color: '#AEB5BD' }}>{user.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* ── Deposit Panel (multi-payment) ── */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: '#4C535B' }}>Deposit funds</p>
              {(step === 'details' || step === 'processing') && (
                <span className="tag" style={{ color: selected.color, borderColor: `${selected.color}40` }}>
                  {selected.name}
                </span>
              )}
            </div>
            {renderDepositFlow()}
          </div>
        </div>

        {/* ── Voucher Top-Up ── */}
        <div className="card p-6 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: '#4C535B' }}>Top up with voucher</p>
              <p className="text-xs mt-1" style={{ color: '#79818A' }}>Enter a 6-character code given by admin to credit your wallet instantly.</p>
            </div>
            <button
              onClick={() => { setShowVoucherForm(v => !v); setMessage(null); setVoucherCode(''); }}
              className="btn btn-ghost"
              style={{ padding: '10px 16px', fontSize: 11 }}>
              {showVoucherForm ? 'Cancel' : 'Top up with voucher'}
            </button>
          </div>
          {showVoucherForm && (
            <form onSubmit={handleRedeemVoucher} className="mt-5 flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="label">Voucher code</label>
                <input
                  type="text"
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="Enter 6-character code…"
                  maxLength={6}
                  className="input font-mono tracking-[0.3em]"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={redeemingVoucher || voucherCode.length !== 6}
                className="btn btn-primary"
                style={{ opacity: (redeemingVoucher || voucherCode.length !== 6) ? 0.5 : 1, cursor: (redeemingVoucher || voucherCode.length !== 6) ? 'not-allowed' : 'pointer' }}>
                {redeemingVoucher ? 'Activating…' : 'Activate'}
              </button>
            </form>
          )}
        </div>

        {/* ── Transaction History ── */}
        <div className="card mt-8 overflow-hidden">
          <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1B2026' }}>
            <div>
              <h2 className="display text-base font-bold" style={{ color: '#E9E7E2' }}>Transaction history</h2>
              <p className="mono text-[10px] uppercase tracking-[0.14em] mt-0.5" style={{ color: '#4C535B' }}>
                {transactions.length} record{transactions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </header>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="mono text-[11px] uppercase tracking-[0.16em]" style={{ color: '#4C535B' }}>No transactions yet</p>
            </div>
          ) : (
            <div className="scroll-x">
              <table className="table-plain">
                <thead>
                  <tr>
                    {['Date', 'Description', 'Type', 'Amount', 'Status', 'Receipt'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td data-label="Date" className="mono text-[11px] whitespace-nowrap" style={{ color: '#79818A' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td data-label="Description" style={{ color: '#AEB5BD' }}>{t.description || t.type}</td>
                      <td data-label="Type">
                        <span className="tag" style={{ color: t.type === 'deposit' ? '#3ECF8E' : '#E5484D', borderColor: t.type === 'deposit' ? 'rgba(62,207,142,0.3)' : 'rgba(229,72,77,0.3)' }}>
                          {t.type}
                        </span>
                      </td>
                      <td data-label="Amount" className="mono font-semibold whitespace-nowrap" style={{ color: t.type === 'deposit' ? '#3ECF8E' : '#E5484D' }}>
                        {t.type === 'deposit' ? '+' : '−'}{fmtKes(t.amount)}
                      </td>
                      <td data-label="Status">
                        <span className="tag" style={{ color: t.status === 'success' ? '#3ECF8E' : '#F2A93B', borderColor: t.status === 'success' ? 'rgba(62,207,142,0.3)' : 'rgba(242,169,59,0.3)' }}>
                          {t.status}
                        </span>
                      </td>
                      <td data-label="Receipt">
                        <button
                          onClick={() => downloadReceipt(t, user?.email, balance)}
                          title="Download receipt"
                          className="btn btn-dark"
                          style={{ padding: '6px 12px', fontSize: 10 }}>
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Bottom support strip ── */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4"
          style={{ border: '1px solid #262C33', borderRadius: 4, background: '#0F1215' }}>
          <p className="text-xs" style={{ color: '#79818A' }}>
            Need help with a transaction or a panel issue?
          </p>
          <a
            href="https://t.me/mzazitech"
            target="_blank"
            rel="noopener noreferrer"
            className="mono text-[11px] uppercase tracking-[0.12em] flex items-center gap-2"
            style={{ color: '#F2A93B', textDecoration: 'none' }}>
            Contact support on Telegram →
          </a>
        </div>

      </div>
    </div>
  );
}

// Outer page wraps WalletInner in Suspense (required for useSearchParams in Next.js 14)
export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    }>
      <WalletInner />
    </Suspense>
  );
}
