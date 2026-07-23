'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Receipt printer (no library needed) ────────────────────────────────────
function downloadReceipt(t, userEmail, balance) {
  const date = new Date(t.created_at);
  const dateStr = date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const isDebit = t.type !== 'deposit';
  const sign = isDebit ? '-' : '+';
  const color = isDebit ? '#e53e3e' : '#38a169';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Mzazi Tech Receipt #${t.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Courier+Prime:wght@400;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#f5f5f5; display:flex; justify-content:center; align-items:flex-start; padding:30px; font-family:'Inter',sans-serif; }
    .receipt {
      background:#fff;
      width:380px;
      border-radius:12px;
      box-shadow:0 4px 24px rgba(0,0,0,0.15);
      overflow:hidden;
      position:relative;
    }
    /* torn-edge top */
    .receipt::before {
      content:'';
      display:block;
      height:14px;
      background: radial-gradient(circle at 10px 14px, #f5f5f5 10px, transparent 0) repeat-x, #fff;
      background-size:20px 14px, 100% 100%;
    }
    /* torn-edge bottom */
    .receipt::after {
      content:'';
      display:block;
      height:14px;
      background: radial-gradient(circle at 10px 0px, #f5f5f5 10px, transparent 0) repeat-x, #fff;
      background-size:20px 14px, 100% 100%;
      transform:rotate(180deg);
    }
    .header {
      background: linear-gradient(135deg, #1a1f3a 0%, #1e3a8a 100%);
      color:#fff;
      text-align:center;
      padding:28px 24px 20px;
    }
    .logo { font-size:22px; font-weight:800; letter-spacing:1px; margin-bottom:4px; }
    .logo span { color:#60a5fa; }
    .tagline { font-size:10px; color:#93c5fd; letter-spacing:2px; text-transform:uppercase; }
    .status-badge {
      display:inline-block;
      margin-top:14px;
      padding:5px 18px;
      border-radius:20px;
      font-size:11px;
      font-weight:700;
      letter-spacing:1px;
      text-transform:uppercase;
      background:${t.status === 'success' ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'};
      color:${t.status === 'success' ? '#6ee7b7' : '#fcd34d'};
      border:1px solid ${t.status === 'success' ? 'rgba(52,211,153,0.4)' : 'rgba(251,191,36,0.4)'};
    }
    .body { padding:24px; }
    .amount-section { text-align:center; padding:20px 0 24px; border-bottom:1px dashed #e2e8f0; }
    .amount-label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px; }
    .amount { font-size:38px; font-weight:800; color:${color}; letter-spacing:-1px; }
    .currency { font-size:18px; font-weight:600; }
    .rows { padding:20px 0; border-bottom:1px dashed #e2e8f0; }
    .row { display:flex; justify-content:space-between; align-items:flex-start; padding:7px 0; font-size:13px; }
    .row-label { color:#64748b; font-size:12px; }
    .row-value { color:#1e293b; font-weight:600; text-align:right; max-width:200px; word-break:break-all; }
    .ref { font-family:'Courier Prime',monospace; font-size:11px; color:#3b82f6; }
    .warranty {
      margin:16px 0 0;
      padding:12px 14px;
      background:#eff6ff;
      border-radius:8px;
      border-left:3px solid #3b82f6;
      font-size:11px;
      color:#1e40af;
      line-height:1.6;
    }
    .warranty strong { display:block; margin-bottom:2px; font-size:12px; }
    .footer { text-align:center; padding:16px 24px 20px; }
    .footer p { font-size:10px; color:#94a3b8; line-height:1.7; }
    .footer a { color:#3b82f6; text-decoration:none; }
    .barcode {
      font-family:'Courier Prime',monospace;
      font-size:9px;
      color:#cbd5e1;
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
    <div class="logo">MZAZI <span>TECH</span></div>
    <div class="tagline">Official Transaction Receipt</div>
    <div class="status-badge">${t.status}</div>
  </div>
  <div class="body">
    <div class="amount-section">
      <div class="amount-label">Transaction Amount</div>
      <div class="amount"><span class="currency">KSH </span>${sign}${parseFloat(t.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="rows">
      <div class="row"><span class="row-label">Receipt No.</span><span class="row-value ref">#MZAZI-${String(t.id).padStart(6,'0')}</span></div>
      <div class="row"><span class="row-label">Date</span><span class="row-value">${dateStr}</span></div>
      <div class="row"><span class="row-label">Time</span><span class="row-value">${timeStr}</span></div>
      <div class="row"><span class="row-label">Description</span><span class="row-value">${t.description || t.type}</span></div>
      <div class="row"><span class="row-label">Transaction Type</span><span class="row-value" style="text-transform:capitalize">${t.type}</span></div>
      <div class="row"><span class="row-label">Account</span><span class="row-value">${userEmail || '—'}</span></div>
      ${t.reference ? `<div class="row"><span class="row-label">Reference</span><span class="row-value ref">${t.reference}</span></div>` : ''}
      <div class="row"><span class="row-label">Wallet Balance After</span><span class="row-value">KSH ${parseFloat(balance).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span></div>
    </div>
    <div class="warranty">
      <strong>🛡️ Panel Warranty Policy</strong>
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
  const [message, setMessage] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const amount = searchParams.get('amount');
    if (success === 'credited') {
      setMessage({ type: 'success', text: `KSH ${parseFloat(amount).toLocaleString()} has been added to your wallet!` });
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
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 10) {
      setMessage({ type: 'error', text: 'Minimum deposit is KSH 10' });
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

  const quickAmounts = [50, 100, 200, 500, 1000];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-4xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: '#f0f4ff' }}>My Wallet</h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>Deposit funds and use them to deploy panels instantly</p>
          </div>
          {/* Telegram support button */}
          <a
            href="https://t.me/mzazitech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #0088cc, #006da8)',
              color: '#fff',
              border: '1px solid rgba(0,136,204,0.4)',
              boxShadow: '0 0 12px rgba(0,136,204,0.25)',
              textDecoration: 'none',
            }}
          >
            {/* Telegram icon */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Telegram Support
          </a>
        </div>

        {/* ── Alert ── */}
        {message && (
          <div className="mb-6 p-4 rounded-xl text-sm" style={{
            backgroundColor: message.type === 'success' ? 'rgba(34,197,94,0.1)' : message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
            color: message.type === 'success' ? '#4ade80' : message.type === 'error' ? '#f87171' : '#60a5fa',
          }}>
            {message.text}
          </div>
        )}

        {/* ── Warranty Notice ── */}
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl text-sm" style={{
          backgroundColor: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}>
          <span className="text-lg">🛡️</span>
          <p style={{ color: '#93c5fd', lineHeight: 1.6 }}>
            <span className="font-semibold" style={{ color: '#60a5fa' }}>Panel Warranty: </span>
            Pterodactyl panel replacement warranty is valid for <strong>2 weeks</strong> from purchase date.
            Contact <a href="https://t.me/mzazitech" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>support</a> within this period for a free replacement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── Balance Card ── */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Available Balance</p>
            <p className="text-4xl font-extrabold" style={{ color: '#3b82f6' }}>
              KSH {parseFloat(balance).toLocaleString()}
            </p>
            {user && (
              <p className="mt-3 text-sm" style={{ color: '#64748b' }}>
                Account: <span style={{ color: '#94a3b8' }}>{user.email}</span>
              </p>
            )}
          </div>

          {/* ── Deposit Form ── */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#475569' }}>Deposit Funds</p>
            <form onSubmit={handleDeposit}>
              <div className="mb-3">
                <label className="block text-xs mb-1" style={{ color: '#64748b' }}>Amount (KSH)</label>
                <input
                  type="number"
                  min="10"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {quickAmounts.map(amt => (
                  <button key={amt} type="button" onClick={() => setDepositAmount(String(amt))}
                    className="text-xs px-3 py-1 rounded-lg transition-colors"
                    style={{
                      backgroundColor: depositAmount === String(amt) ? '#2563eb' : '#1e2d4a',
                      color: depositAmount === String(amt) ? '#fff' : '#94a3b8',
                      border: '1px solid #1e2d4a',
                    }}>
                    KSH {amt}
                  </button>
                ))}
              </div>
              <button type="submit" disabled={depositing}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity"
                style={{ backgroundColor: '#2563eb', color: '#fff', opacity: depositing ? 0.7 : 1 }}>
                {depositing ? 'Redirecting to Paystack...' : 'Deposit via Paystack'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Transaction History ── */}
        <div className="mt-8 rounded-2xl p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Transaction History</p>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1e2d4a', color: '#64748b' }}>
              {transactions.length} record{transactions.length !== 1 ? 's' : ''}
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">📋</div>
              <p style={{ color: '#64748b' }}>No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e2d4a' }}>
                    {['Date', 'Description', 'Type', 'Amount', 'Status', 'Receipt'].map(h => (
                      <th key={h} className="text-left pb-3 pr-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(30,45,74,0.5)' }}>
                      <td className="py-3 pr-3 text-xs whitespace-nowrap" style={{ color: '#64748b' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-3" style={{ color: '#cbd5e1' }}>{t.description || t.type}</td>
                      <td className="py-3 pr-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          backgroundColor: t.type === 'deposit' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: t.type === 'deposit' ? '#4ade80' : '#f87171',
                          border: `1px solid ${t.type === 'deposit' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 pr-3 font-semibold whitespace-nowrap" style={{ color: t.type === 'deposit' ? '#4ade80' : '#f87171' }}>
                        {t.type === 'deposit' ? '+' : '-'}KSH {parseFloat(t.amount).toLocaleString()}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          backgroundColor: t.status === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                          color: t.status === 'success' ? '#4ade80' : '#facc15',
                        }}>
                          {t.status}
                        </span>
                      </td>
                      {/* ── Download Receipt button ── */}
                      <td className="py-3">
                        <button
                          onClick={() => downloadReceipt(t, user?.email, balance)}
                          title="Download receipt"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            backgroundColor: 'rgba(37,99,235,0.12)',
                            color: '#60a5fa',
                            border: '1px solid rgba(37,99,235,0.25)',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.25)';
                            e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.12)';
                            e.currentTarget.style.borderColor = 'rgba(37,99,235,0.25)';
                          }}
                        >
                          {/* printer icon */}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <polyline points="6 9 6 2 18 2 18 9"/>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                            <rect x="6" y="14" width="12" height="8"/>
                          </svg>
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
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl"
          style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
          <p className="text-xs" style={{ color: '#475569' }}>
            Need help with a transaction or a panel issue?
          </p>
          <a
            href="https://t.me/mzazitech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all"
            style={{
              background: 'linear-gradient(135deg, #0088cc, #006da8)',
              color: '#fff',
              textDecoration: 'none',
              boxShadow: '0 0 10px rgba(0,136,204,0.2)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Contact Support on Telegram
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
      </div>
    }>
      <WalletInner />
    </Suspense>
  );
}
