'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fmtKes } from '@/lib/currency';

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

// ─── Deposit UI helpers ──────────────────────────────────────────────────────

const METHOD_LABELS = {
  card: 'Card',
  mpesa: 'M-PESA',
  airtel: 'Airtel Money',
  mpesa_till: 'M-PESA Till',
};

// Mirrors lib/kenya-phone.js on the server — instant feedback while typing.
function normalizePhoneClient(input) {
  if (typeof input !== 'string' || !input.trim()) return { ok: false, error: '' };
  let d = input.replace(/[\s\-().]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (!/^\d{9,12}$/.test(d)) return { ok: false, error: 'Invalid Kenyan number' };
  if (d.length === 10 && (d.startsWith('07') || d.startsWith('01'))) return { ok: true, phone: `+254${d.slice(1)}` };
  if (d.length === 9 && (d.startsWith('7') || d.startsWith('1'))) return { ok: true, phone: `+254${d}` };
  if (d.length === 12 && d.startsWith('254')) return { ok: true, phone: `+254${d.slice(3)}` };
  return { ok: false, error: 'Invalid Kenyan number' };
}

function maskPhone(phone) {
  if (!phone) return '';
  return `${phone.slice(0, 5)}••••${phone.slice(-2)}`;
}

const PAYMENT_METHODS = [
  {
    id: 'card',
    name: 'Card',
    desc: 'Visa, Mastercard & more — secure Paystack checkout',
    color: '#4C7DFC',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M2.5 9.5h19" />
        <path d="M6 14.5h4" />
      </svg>
    ),
  },
  {
    id: 'mpesa',
    name: 'M-PESA',
    desc: 'Instant STK push to your M-PESA phone',
    color: '#3ECF8E',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M11 18.5h2" />
        <path d="M11 5.5h2" />
      </svg>
    ),
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    desc: 'Pay from your Airtel Money wallet',
    color: '#E5484D',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M11 18.5h2" />
        <path d="M12 6.5l-2 3.2 2 1.3 2-1.3-2-3.2z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'mpesa_till',
    name: 'M-PESA Till',
    desc: 'Pay from a registered M-PESA Till',
    color: '#F2A93B',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3.5 9.5 12 3l8.5 6.5" />
        <path d="M5.5 9v11h13V9" />
        <path d="M10 20v-5.5h4V20" />
      </svg>
    ),
  },
];

function MethodIcon({ m, selected }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 rounded-lg"
      style={{
        width: 46,
        height: 46,
        background: `${m.color}14`,
        color: m.color,
        border: `1px solid ${selected ? m.color : `${m.color}33`}`,
      }}
    >
      {m.icon}
    </div>
  );
}

// ─── Status glyphs ───────────────────────────────────────────────────────────
function CheckGlyph() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3ECF8E', animation: 'mz-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12.5 2.8 2.8 5.4-6.4" style={{ animation: 'mz-draw 0.5s 0.15s ease both' }} />
    </svg>
  );
}

function CrossGlyph() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#E5484D', animation: 'mz-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 9 6 6M15 9l-6 6" style={{ animation: 'mz-draw 0.5s 0.15s ease both' }} />
    </svg>
  );
}

function PhonePulseGlyph({ color }) {
  return (
    <div style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${color}55`, animation: 'mz-ping 1.8s ease-out infinite' }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${color}33`, animation: 'mz-ping 1.8s 0.6s ease-out infinite' }} />
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 56, height: 56, background: `${color}14`, border: `1px solid ${color}44`, color }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
          <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
          <path d="M11 18.5h2" />
        </svg>
      </div>
    </div>
  );
}

// ─── Main wallet component ───────────────────────────────────────────────────
function WalletInner() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [message, setMessage] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Deposit flow state
  const [step, setStep] = useState('method'); // method → form → processing | redirecting → success | failed
  const [method, setMethod] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [till, setTill] = useState('');
  const [reference, setReference] = useState(null);
  const [depositing, setDepositing] = useState(false);
  const [failureMsg, setFailureMsg] = useState('');
  const [creditedAmount, setCreditedAmount] = useState(0);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ── Poll payment status while the user authorizes on their phone ──
  useEffect(() => {
    if (step !== 'processing' || !reference) return;
    let active = true;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/wallet/status?reference=${encodeURIComponent(reference)}`);
        if (!active) return;
        const data = await res.json();
        if (data.status === 'success') {
          clearInterval(timer);
          setCreditedAmount(data.amount || parseFloat(depositAmount) || 0);
          setStep('success');
          await fetchWallet();
        } else if (data.status === 'failed' || data.status === 'abandoned') {
          clearInterval(timer);
          setFailureMsg('Payment was not completed. Please try again.');
          setStep('failed');
        }
      } catch { /* transient network error — keep polling */ }
    }, 4000);
    return () => { active = false; clearInterval(timer); };
  }, [step, reference, depositAmount]);

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

  // ── Deposit handlers ────────────────────────────────────────────────────────
  const selectMethod = (id) => {
    setMethod(id);
    setPhone('');
    setTill('');
    setFailureMsg('');
    setStep('form');
  };

  const backToMethods = () => {
    setFailureMsg('');
    setDepositing(false);
    setStep('method');
  };

  const handlePayNow = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 10) { setFailureMsg('Minimum deposit is KES 10'); setStep('failed'); return; }
    if (amount > 150000) { setFailureMsg('Maximum deposit is KES 150,000'); setStep('failed'); return; }
    if (method === 'mpesa' || method === 'airtel') {
      const norm = normalizePhoneClient(phone);
      if (!norm.ok) {
        setFailureMsg('Please enter a valid Kenyan phone number (e.g. 0712345678).');
        setStep('failed');
        return;
      }
    }
    if (method === 'mpesa_till' && !/^\d{5,8}$/.test(till.trim())) {
      setFailureMsg('Please enter a valid M-PESA Till number (5–8 digits).');
      setStep('failed');
      return;
    }

    setFailureMsg('');
    setDepositing(true);
    setStep('processing'); // flips to 'redirecting' below for card
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod: method,
          ...((method === 'mpesa' || method === 'airtel') ? { phoneNumber: phone } : {}),
          ...(method === 'mpesa_till' ? { tillNumber: till } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok && data.flow === 'redirect' && data.authorization_url) {
        setStep('redirecting');
        window.location.href = data.authorization_url; // Paystack secure checkout
        return;
      }
      if (res.ok && data.flow === 'mobile_money') {
        setReference(data.reference);
        setStep('processing');
        return;
      }
      setFailureMsg(data.error || 'Payment could not be started. Please try again.');
      setStep('failed');
    } catch {
      setFailureMsg('Network error. Please try again.');
      setStep('failed');
    } finally {
      setDepositing(false);
    }
  };

  const resetDeposit = () => {
    setDepositAmount('');
    setPhone('');
    setTill('');
    setReference(null);
    setCreditedAmount(0);
    setFailureMsg('');
    setStep('method');
  };

  // ── Derived helpers ──
  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === method) || null;
  const phoneNorm = (method === 'mpesa' || method === 'airtel') ? normalizePhoneClient(phone) : null;
  const quickAmounts = [100, 200, 500, 1000, 2000];
  const amountLabel = depositAmount ? fmtKes(parseFloat(depositAmount) || 0) : '';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

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

          {/* ── Deposit Card (multi-step) ── */}
          <div className="card p-6">
            <p className="mono text-[10px] uppercase tracking-[0.18em] mb-4" style={{ color: '#4C535B' }}>
              {step === 'method' ? 'Deposit funds' : step === 'form' ? `Deposit · ${METHOD_LABELS[method] || ''}` : step === 'processing' ? 'Payment in progress' : step === 'redirecting' ? 'Secure checkout' : step === 'success' ? 'Payment complete' : 'Payment failed'}
            </p>

            {/* STEP 1 — method selection */}
            {step === 'method' && (
              <div>
                <div className="grid grid-cols-1 gap-2.5">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectMethod(m.id)}
                      className="flex items-center gap-3.5 w-full text-left px-4 py-3.5 transition-all"
                      style={{
                        background: '#0F1215',
                        border: '1px solid #262C33',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${m.color}88`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#262C33'; }}
                    >
                      <MethodIcon m={m} selected={false} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#E9E7E2' }}>{m.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#79818A' }}>{m.desc}</p>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0" style={{ color: m.color }}>
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] mt-4" style={{ color: '#4C535B', lineHeight: 1.6 }}>
                  Deposits are processed securely by Paystack. Your wallet is credited only after Paystack confirms the payment.
                </p>
              </div>
            )}

            {/* STEP 2 — amount + details */}
            {step === 'form' && selectedMethod && (
              <div>
                <div className="mb-3">
                  <label className="label">Amount (KES)</label>
                  <input
                    type="number"
                    min="10"
                    max="150000"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="Enter amount…"
                    className="input"
                    required
                  />
                </div>

                {method === 'mpesa' || method === 'airtel' ? (
                  <div className="mb-3">
                    <label className="label">{method === 'mpesa' ? 'M-PESA phone number' : 'Airtel Money phone number'}</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 0712345678"
                      className="input"
                      required
                    />
                    {phone.length >= 9 && (
                      <p className="mono text-[11px] mt-1.5" style={{ color: phoneNorm?.ok ? '#3ECF8E' : '#E5484D' }}>
                        {phoneNorm?.ok ? `Will send to → ${phoneNorm.phone}` : phoneNorm?.error || ''}
                      </p>
                    )}
                  </div>
                ) : method === 'mpesa_till' ? (
                  <div className="mb-3">
                    <label className="label">M-PESA Till number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={till}
                      onChange={e => setTill(e.target.value.replace(/[^\d]/g, '').slice(0, 8))}
                      placeholder="e.g. 522533"
                      className="input"
                      required
                    />
                    <p className="text-[11px] mt-1.5" style={{ color: '#4C535B' }}>
                      Enter the <strong style={{ color: '#AEB5BD' }}>Till number</strong> (5–8 digits) — not your personal M-PESA number.
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 mb-4">
                  {quickAmounts.map(amt => (
                    <button key={amt} type="button" onClick={() => setDepositAmount(String(amt))}
                      className="mono text-[11px] px-3 py-1.5 transition-colors"
                      style={{
                        background: depositAmount === String(amt) ? 'rgba(242,169,59,0.12)' : '#0F1215',
                        color: depositAmount === String(amt) ? '#F2A93B' : '#79818A',
                        border: `1px solid ${depositAmount === String(amt) ? 'rgba(242,169,59,0.45)' : '#262C33'}`,
                        cursor: 'pointer',
                      }}>
                      {fmtKes(amt)}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={handlePayNow} disabled={depositing} className="btn btn-primary w-full" style={{ opacity: depositing ? 0.7 : 1, cursor: depositing ? 'wait' : 'pointer' }}>
                  {depositing ? 'Contacting Paystack…' : `Pay ${amountLabel || '—'}`}
                </button>
                <button type="button" onClick={backToMethods} className="w-full mt-2.5 text-[11px] mono uppercase tracking-[0.12em]" style={{ color: '#79818A', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  ← Choose another payment method
                </button>
              </div>
            )}

            {/* STEP 3a — mobile money processing */}
            {step === 'processing' && selectedMethod && (
              <div className="text-center py-4">
                <div className="flex justify-center mb-6"><PhonePulseGlyph color={selectedMethod.color} /></div>
                <h3 className="text-base font-bold" style={{ color: '#E9E7E2' }}>Payment request sent to your phone.</h3>
                <p className="text-sm mt-2" style={{ color: '#AEB5BD', lineHeight: 1.7 }}>
                  Check your {METHOD_LABELS[method]} phone and complete the authorization.
                </p>
                <p className="mono text-[11px] uppercase tracking-[0.16em] mt-4" style={{ color: '#4C535B' }}>
                  Waiting for payment confirmation…
                </p>

                <div className="mt-6 rounded-lg px-4 py-3.5 text-left" style={{ background: '#0F1215', border: '1px solid #262C33' }}>
                  {[
                    ['Amount', amountLabel],
                    ['Method', METHOD_LABELS[method]],
                    ...(phone ? [['Phone', maskPhone(phoneNorm?.phone || phone)]] : []),
                    ...(till ? [['Till', till]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-1.5">
                      <span className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: '#4C535B' }}>{k}</span>
                      <span className="mono text-xs font-semibold" style={{ color: '#E9E7E2' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] mt-4" style={{ color: '#4C535B', lineHeight: 1.7 }}>
                  You'll receive an authorization prompt on your phone. This request expires in 3 minutes.
                  Your wallet is credited automatically once Paystack confirms the payment.
                </p>
                <button type="button" onClick={resetDeposit} className="mt-4 text-[11px] mono uppercase tracking-[0.12em]" style={{ color: '#79818A', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  Cancel deposit
                </button>
              </div>
            )}

            {/* STEP 3b — card redirect */}
            {step === 'redirecting' && (
              <div className="text-center py-8">
                <div className="flex justify-center mb-6"><div className="spinner" /></div>
                <h3 className="text-base font-bold" style={{ color: '#E9E7E2' }}>Redirecting to Paystack secure checkout…</h3>
                <p className="text-sm mt-2" style={{ color: '#79818A', lineHeight: 1.7 }}>
                  Complete the payment on Paystack's secure page. You'll be brought back here automatically.
                </p>
              </div>
            )}

            {/* STEP 4a — success */}
            {step === 'success' && (
              <div className="text-center py-4">
                <div className="flex justify-center mb-5"><CheckGlyph /></div>
                <h3 className="text-lg font-bold" style={{ color: '#E9E7E2' }}>Payment successful.</h3>
                <p className="stat-num mt-3" style={{ color: '#3ECF8E', fontSize: 'clamp(1.7rem, 4vw, 2.3rem)' }}>
                  {fmtKes(creditedAmount)}
                </p>
                <p className="text-sm mt-3" style={{ color: '#79818A', lineHeight: 1.7 }}>
                  Your wallet has been credited. New balance: <strong style={{ color: '#F2A93B' }}>{fmtKes(balance)}</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button type="button" onClick={resetDeposit} className="btn btn-primary flex-1" style={{ cursor: 'pointer' }}>
                    Make another deposit
                  </button>
                  <a
                    href="#history"
                    className="btn btn-ghost flex-1"
                    style={{ cursor: 'pointer', textAlign: 'center' }}
                    onClick={(e) => { e.preventDefault(); document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' }); }}
                  >
                    View transactions
                  </a>
                </div>
              </div>
            )}

            {/* STEP 4b — failed */}
            {step === 'failed' && (
              <div className="text-center py-4">
                <div className="flex justify-center mb-5"><CrossGlyph /></div>
                <h3 className="text-base font-bold" style={{ color: '#E9E7E2' }}>Payment not completed.</h3>
                <p className="text-sm mt-2" style={{ color: '#AEB5BD', lineHeight: 1.7 }}>{failureMsg}</p>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button type="button" onClick={() => setStep('form')} className="btn btn-primary flex-1" style={{ cursor: 'pointer' }}>
                    Try again
                  </button>
                  <button type="button" onClick={backToMethods} className="btn btn-ghost flex-1" style={{ cursor: 'pointer' }}>
                    Change payment method
                  </button>
                </div>
              </div>
            )}
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
        <div className="card mt-8 overflow-hidden" id="history">
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

        {/* ── Deposit flow animations ── */}
        <style>{`
          @keyframes mz-pop {
            0% { transform: scale(0.4); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes mz-draw {
            0% { stroke-dasharray: 40; stroke-dashoffset: 40; opacity: 0; }
            100% { stroke-dasharray: 40; stroke-dashoffset: 0; opacity: 1; }
          }
          @keyframes mz-ping {
            0% { transform: scale(0.75); opacity: 0.9; }
            80%, 100% { transform: scale(1.35); opacity: 0; }
          }
        `}</style>

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
