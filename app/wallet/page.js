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

// ─── Main wallet component ───────────────────────────────────────────────────
function WalletInner() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [message, setMessage] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount); // entered in KES
    if (!amount || amount < 10) { // minimum KES 10
      setMessage({ type: 'error', text: 'Minimum deposit is KES 10' });
      return;
    }
    setDepositing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to initialize payment' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setDepositing(false);
    }
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

  const quickAmounts = [100, 200, 500, 1000, 2000];

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

          {/* ── Deposit Form ── */}
          <div className="card p-6">
            <p className="mono text-[10px] uppercase tracking-[0.18em] mb-4" style={{ color: '#4C535B' }}>Deposit funds</p>
            <form onSubmit={handleDeposit}>
              <div className="mb-3">
                <label className="label">Amount (KES)</label>
                <input
                  type="number"
                  min="10"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="Enter amount…"
                  className="input"
                  required
                />
              </div>
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
              <button type="submit" disabled={depositing} className="btn btn-primary w-full" style={{ opacity: depositing ? 0.7 : 1 }}>
                {depositing ? 'Redirecting to Paystack…' : 'Deposit via Paystack'}
              </button>
            </form>
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
