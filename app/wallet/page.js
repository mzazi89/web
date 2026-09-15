'use client';

// MZAZI TECH — Payments & Wallet.
//
// Presentation only: every payment call is the same one the product already
// used, and nothing about the Paystack flows was reimplemented.
//
//   GET  /api/auth/me                     → session gate
//   GET  /api/wallet/balance              → { balance, transactions[] }
//   GET  /api/wallet/offer                → { offer }
//   POST /api/wallet/deposit              → card: { authorization_url } | mobile_money: { reference }
//   GET  /api/wallet/status?reference=…   → polled until success / failed / abandoned
//   POST /api/vouchers/redeem             → { code }

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AppBackground, PageHeader, Button, Card, CardHeader, Badge, Modal, DataTable,
  EmptyState, ErrorState, Alert, SkeletonText, Field, Input, humaniseError, Icons,
} from '@/components/ui';
import { fmtKes } from '@/lib/currency';

// ─── Receipt printer (unchanged behaviour) ──────────────────────────────────
function downloadReceipt(t, userEmail, balance) {
  const date = new Date(t.created_at);
  const dateStr = date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const isDebit = t.type !== 'deposit';
  const sign = isDebit ? '-' : '+';
  const color = isDebit ? 'var(--bad)' : 'var(--good)';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Mzazi Tech Receipt #${t.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:var(--ink); display:flex; justify-content:center; align-items:flex-start; padding:clamp(12px, 4vw, 30px); font-family:'Space Grotesk',sans-serif; }
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
      background: radial-gradient(circle at 10px 14px, var(--ink) 10px, transparent 0) repeat-x, #fff;
      background-size:20px 14px, 100% 100%;
    }
    .receipt::after {
      content:'';
      display:block;
      height:14px;
      background: radial-gradient(circle at 10px 0px, var(--ink) 10px, transparent 0) repeat-x, #fff;
      background-size:20px 14px, 100% 100%;
      transform:rotate(180deg);
    }
    .header {
      background:var(--bg);
      color:#fff;
      text-align:center;
      padding:28px 24px 20px;
    }
    .logo { font-size:20px; font-weight:700; letter-spacing:0.5px; margin-bottom:4px; }
    .logo span { color:var(--brand); }
    .tagline { font-family:'IBM Plex Mono',monospace; font-size: 12.5px; color:var(--muted); letter-spacing:2px; text-transform:uppercase; }
    .status-badge {
      display:inline-block;
      margin-top:14px;
      padding:4px 16px;
      border-radius:2px;
      font-family:'IBM Plex Mono',monospace;
      font-size: 12.5px;
      font-weight:600;
      letter-spacing:1px;
      text-transform:uppercase;
      background:${t.status === 'success' ? 'rgba(62,207,142,0.15)' : 'rgba(242,169,59,0.15)'};
      color:${t.status === 'success' ? 'var(--good)' : 'var(--brand)'};
      border:1px solid ${t.status === 'success' ? 'rgba(62,207,142,0.4)' : 'rgba(242,169,59,0.4)'};
    }
    .body { padding:24px; }
    .amount-section { text-align:center; padding:20px 0 24px; border-bottom:1px dashed var(--ink); }
    .amount-label { font-family:'IBM Plex Mono',monospace; font-size: 12.5px; color:var(--muted); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px; }
    .amount { font-size:38px; font-weight:700; color:${color}; letter-spacing:-1px; }
    .currency { font-size:16px; font-weight:500; }
    .rows { padding:20px 0; border-bottom:1px dashed var(--ink); }
    .row { display:flex; justify-content:space-between; align-items:flex-start; padding:7px 0; font-size:13px; }
    .row-label { color:var(--muted); font-size: 12.5px; font-family:'IBM Plex Mono',monospace; text-transform:uppercase; letter-spacing:0.6px; }
    .row-value { color:var(--surface-2); font-weight:600; text-align:right; max-width:200px; word-break:break-all; }
    .ref { font-family:'IBM Plex Mono',monospace; font-size: 12.5px; color:var(--blue); }
    .warranty {
      margin:16px 0 0;
      padding:12px 14px;
      background:var(--ink);
      border-radius:2px;
      border-left:3px solid var(--brand);
      font-size: 12.5px;
      color:#7a6a4f;
      line-height:1.6;
    }
    .warranty strong { display:block; margin-bottom:2px; font-size:12px; color:var(--bg); }
    .footer { text-align:center; padding:16px 24px 20px; }
    .footer p { font-size: 12.5px; color:var(--muted); line-height:1.7; }
    .footer a { color:var(--blue); text-decoration:none; }
    .barcode {
      font-family:'IBM Plex Mono',monospace;
      font-size: 12.5px;
      color:var(--ink);
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mzazi-Receipt-${t.id}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ─── Deposit helpers ──────────────────────────────────────────────────────────
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
  { id: 'card', name: 'Card', desc: 'Visa, Mastercard & more — secure Paystack checkout', icon: <Icons.CreditCard size={22} /> },
  { id: 'mpesa', name: 'M-PESA', desc: 'Instant STK push to your M-PESA phone', icon: <Icons.Phone size={22} /> },
  { id: 'airtel', name: 'Airtel Money', desc: 'Pay from your Airtel Money wallet', icon: <Icons.Phone size={22} /> },
  { id: 'mpesa_till', name: 'M-PESA Till', desc: 'Pay from a registered M-PESA Till', icon: <Icons.CreditCard size={22} /> },
];

function MethodIcon({ m }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 44, height: 44, flex: '0 0 44px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--r-md)', background: 'var(--brand-tint)', color: 'var(--brand)',
      }}
    >
      {m.icon}
    </span>
  );
}

// ─── Main wallet component ───────────────────────────────────────────────────
function WalletInner() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }
  const [depositOpen, setDepositOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Deposit flow: method → form → confirm → processing | redirecting → success | failed
  const [step, setStep] = useState('method');
  const [method, setMethod] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [till, setTill] = useState('');
  const [reference, setReference] = useState(null);
  const [depositing, setDepositing] = useState(false);
  const [failureMsg, setFailureMsg] = useState('');
  const [creditedAmount, setCreditedAmount] = useState(0);
  const [offer, setOffer] = useState(null);
  const [adDismissed, setAdDismissed] = useState(false);

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
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/wallet/balance');
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error('Wallet request failed');
      const data = await res.json();
      setBalance(data.balance || 0);
      setTransactions(data.transactions || []);
      setLoadError('');
    } catch (e) {
      setLoadError(humaniseError(e, 'We could not load your wallet. Please try again.'));
    }
    try {
      const ores = await fetch('/api/wallet/offer');
      if (ores.ok) {
        const odata = await ores.json();
        setOffer(odata.offer || null);
      }
    } catch { /* offer is optional */ }
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
        setVoucherOpen(false);
        setBalance(data.newBalance);
        await fetchWallet();
      } else {
        setMessage({ type: 'error', text: humaniseError(data.error || 'Invalid voucher code') });
      }
    } catch (e) {
      setMessage({ type: 'error', text: humaniseError(e) });
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
    setDepositOpen(true);
  };

  const startOfferDeposit = () => {
    setAdDismissed(true);
    if (!method || step === 'method') {
      setStep('form');
      setMethod('card');
    }
    setDepositOpen(true);
  };

  const backToMethods = () => {
    setFailureMsg('');
    setDepositing(false);
    setStep('method');
  };

  // Validate the form, then move to the review step (no network yet).
  const reviewDeposit = () => {
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
    setStep('confirm');
  };

  const handlePayNow = async () => {
    const amount = parseFloat(depositAmount);
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
      setFailureMsg(humaniseError(data.error || 'Payment could not be started. Please try again.'));
      setStep('failed');
    } catch (e) {
      setFailureMsg(humaniseError(e));
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

  const openDeposit = () => {
    resetDeposit();
    setDepositOpen(true);
  };

  const closeDeposit = () => {
    if (depositing) return;
    setDepositOpen(false);
    resetDeposit();
  };

  // ── Derived helpers ──
  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === method) || null;
  const phoneNorm = (method === 'mpesa' || method === 'airtel') ? normalizePhoneClient(phone) : null;
  const quickAmounts = [100, 200, 500, 1000, 2000];
  const amountLabel = depositAmount ? fmtKes(parseFloat(depositAmount) || 0) : '';

  const offerActive = !!(offer && offer.enabled);
  const offerMult = Number(offer?.multiplier) > 1 ? Number(offer.multiplier) : 2;
  const offerAmt = parseFloat(depositAmount) || 0;
  const offerBonus = offerActive && offerAmt > 0 ? Math.round(offerAmt * (offerMult - 1) * 100) / 100 : 0;
  const offerTotal = Math.round((offerAmt + offerBonus) * 100) / 100;

  if (loading) {
    return (
      <AppBackground variant="dashboard">
        <div className="container-site" style={{ paddingTop: 26, paddingBottom: 90, maxWidth: 900 }}>
          <SkeletonText lines={2} />
          <div style={{ height: 140 }} />
          <SkeletonText lines={4} />
        </div>
      </AppBackground>
    );
  }

  return (
    <AppBackground variant="dashboard">
      <div className="container-site" style={{ paddingTop: 26, paddingBottom: 90, maxWidth: 900 }}>
        <PageHeader
          title="Payments & wallet"
          description="Add money, redeem vouchers, and use your balance to pay for WhatsApp bot plans."
          icon={<Icons.Wallet size={20} />}
          actions={
            <>
              <Button variant="ghost" onClick={() => setVoucherOpen(true)} icon={<Icons.Ticket size={16} />}>Redeem voucher</Button>
              <Button onClick={openDeposit} icon={<Icons.Plus size={16} />}>Add money</Button>
            </>
          }
          breadcrumb={['Dashboard', 'Wallet']}
        />

        {message && (
          <div style={{ marginBottom: 20 }} role="status" aria-live="polite">
            <Alert kind={message.type === 'success' ? 'success' : message.type === 'error' ? 'error' : 'info'}>
              {message.text}
            </Alert>
          </div>
        )}

        {loadError && (
          <div style={{ marginBottom: 20 }}>
            <Alert kind="error" title="We couldn’t refresh your wallet">
              {loadError}{' '}
              <button type="button" className="link" onClick={fetchWallet} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Try again</button>
            </Alert>
          </div>
        )}

        {/* ── Balance ── */}
        <Card accent className="anim-fade-up" style={{ marginBottom: 20 }}>
          <p className="stat-label" style={{ margin: 0 }}>Available balance</p>
          <p className="stat-num tnum" style={{ margin: '6px 0 0', color: 'var(--brand)' }}>{fmtKes(balance)}</p>
          {user && <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--dim)' }}>Account: {user.email}</p>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <Button onClick={openDeposit} icon={<Icons.Plus size={16} />}>Add money</Button>
            <Button variant="ghost" href="/subscription" icon={<Icons.Sparkles size={16} />}>Spend on a plan</Button>
          </div>
        </Card>

        {/* ── Deposit offer ── */}
        {offer?.enabled && !adDismissed && (
          <Card className="anim-fade-up d1" style={{ marginBottom: 20, borderColor: 'var(--brand-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span
                aria-hidden="true"
                className="anim-pulse"
                style={{
                  width: 54, height: 54, flex: '0 0 54px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', background: 'var(--brand-tint)', color: 'var(--brand)',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20,
                }}
              >
                ×{offerMult}
              </span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <p className="eyebrow" style={{ margin: 0 }}>Limited offer</p>
                <p style={{ margin: '6px 0 0', fontWeight: 700, color: 'var(--ink)' }}>
                  {offer.adText || `Deposit & get ${offerMult}× your money`}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>
                  Any top-up is {offerMult}× — you get {offerMult - 1}× extra credited the moment payment is confirmed.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button onClick={startOfferDeposit} icon={<Icons.Zap size={16} />}>Deposit & double</Button>
                <Button variant="ghost" onClick={() => setAdDismissed(true)} aria-label="Dismiss offer"><Icons.X size={16} /></Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── Recent transactions ── */}
        <Card id="history" className="anim-fade-up d2">
          <CardHeader
            title="Recent transactions"
            description="Your latest 10 wallet movements."
            icon={<Icons.CreditCard size={18} />}
          />

          {transactions.length === 0 ? (
            <EmptyState
              icon={<Icons.CreditCard size={26} />}
              title="You don't have any payments yet."
              description="Add money to your wallet and your payments will show up here."
              action={<Button onClick={openDeposit} icon={<Icons.Plus size={16} />}>Add money</Button>}
            />
          ) : (
            <DataTable columns={['Date', 'Description', 'Type', 'Amount', 'Status', 'Receipt']}>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td data-label="Date" className="mono tnum" style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td data-label="Description" style={{ color: 'var(--ink-2)' }}>{t.description || t.type}</td>
                  <td data-label="Type">
                    <Badge tone={t.type === 'deposit' ? 'good' : 'blue'}>{t.type}</Badge>
                  </td>
                  <td data-label="Amount" className="mono tnum" style={{ color: t.type === 'deposit' ? 'var(--good)' : 'var(--bad)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {t.type === 'deposit' ? '+' : '−'}{fmtKes(t.amount)}
                    {t.type === 'deposit' && Number(t.bonus_amount) > 0 && (
                      <span style={{ display: 'block', fontWeight: 400, color: 'var(--brand)', fontSize: 12.5, marginTop: 2 }}>
                        +{fmtKes(t.bonus_amount)} bonus
                      </span>
                    )}
                  </td>
                  <td data-label="Status">
                    <Badge tone={t.status === 'success' ? 'good' : 'warn'}>{t.status}</Badge>
                  </td>
                  <td data-label="Receipt">
                    <Button size="sm" variant="dark" onClick={() => downloadReceipt(t, user?.email, balance)}>Receipt</Button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Card>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>
            Need a full history or a panel issue fixed?&nbsp;
            <a className="link" href="https://t.me/mzazitech" target="_blank" rel="noopener noreferrer">Contact support on Telegram →</a>
          </p>
          <Button variant="ghost" size="sm" href="/payments">Open payments page</Button>
        </div>
      </div>

      {/* ── Deposit modal ── */}
      <Modal
        open={depositOpen}
        onClose={closeDeposit}
        size="lg"
        title={
          step === 'method' ? 'Add money'
            : step === 'form' ? `Deposit · ${METHOD_LABELS[method] || ''}`
              : step === 'confirm' ? 'Confirm your deposit'
                : step === 'processing' ? 'Payment in progress'
                  : step === 'redirecting' ? 'Secure checkout'
                    : step === 'success' ? 'Payment successful'
                      : 'Payment failed'
        }
        description={step === 'method' ? 'Choose how you want to pay. Deposits are processed securely and your wallet is credited once payment is confirmed.' : undefined}
        closeOnBackdrop={!depositing}
      >
        {/* STEP 1 — method */}
        {step === 'method' && (
          <div style={{ display: 'grid', gap: 10 }}>
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => selectMethod(m.id)}
                className="option-card"
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', cursor: 'pointer' }}
              >
                <MethodIcon m={m} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, color: 'var(--ink)' }}>{m.name}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)' }}>{m.desc}</span>
                </span>
                <Icons.ChevronRight size={16} />
              </button>
            ))}
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--dim)', lineHeight: 1.6 }}>
              Deposits are processed securely by Paystack. Your wallet is credited only after the payment is confirmed.
            </p>
          </div>
        )}

        {/* STEP 2 — form */}
        {step === 'form' && selectedMethod && (
          <div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
              <label className="label" htmlFor="dep-amount">Amount (KES)</label>
              <input
                id="dep-amount"
                type="number"
                min="10"
                max="150000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount…"
                className="input"
                inputMode="numeric"
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(String(amt))}
                    className="btn btn-sm"
                    style={{
                      background: depositAmount === String(amt) ? 'var(--brand-tint)' : 'var(--surface-2)',
                      color: depositAmount === String(amt) ? 'var(--brand)' : 'var(--muted)',
                      border: `1px solid ${depositAmount === String(amt) ? 'var(--brand-soft)' : 'var(--line)'}`,
                    }}
                  >
                    {fmtKes(amt)}
                  </button>
                ))}
              </div>
            </div>

            {offerActive && offerAmt > 0 && (
              <div style={{ marginBottom: 14 }}>
                <Alert kind="brand">
                  With the {offerMult}× offer you’ll receive <strong>{fmtKes(offerTotal)}</strong> ({fmtKes(offerBonus)} bonus).
                </Alert>
              </div>
            )}

            {(method === 'mpesa' || method === 'airtel') && (
              <Field label={method === 'mpesa' ? 'M-PESA phone number' : 'Airtel Money phone number'} id="dep-phone" hint="We’ll send the payment prompt to this number.">
                <Input
                  id="dep-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  inputMode="tel"
                />
                {phone.length >= 9 && (
                  <p className="mono" style={{ margin: '6px 0 0', fontSize: 13, color: phoneNorm?.ok ? 'var(--good)' : 'var(--bad)' }}>
                    {phoneNorm?.ok ? `Will send to → ${phoneNorm.phone}` : phoneNorm?.error || ''}
                  </p>
                )}
              </Field>
            )}

            {method === 'mpesa_till' && (
              <Field label="M-PESA Till number" id="dep-till" hint="Enter the Till number (5–8 digits) — not your personal M-PESA number.">
                <Input
                  id="dep-till"
                  type="text"
                  inputMode="numeric"
                  value={till}
                  onChange={(e) => setTill(e.target.value.replace(/[^\d]/g, '').slice(0, 8))}
                  placeholder="e.g. 522533"
                />
              </Field>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              <Button onClick={reviewDeposit} disabled={!depositAmount} icon={<Icons.ArrowRight size={16} />}>Review deposit</Button>
              <Button variant="ghost" onClick={backToMethods}>Change method</Button>
            </div>
          </div>
        )}

        {/* STEP 3 — confirm */}
        {step === 'confirm' && selectedMethod && (
          <div>
            <dl style={{ margin: 0, display: 'grid', gap: 12, padding: 16, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}>
              {[
                ['Amount', amountLabel],
                ['Method', METHOD_LABELS[method]],
                ...(phone ? [['Phone', maskPhone(phoneNorm?.phone || phone)]] : []),
                ...(till ? [['Till', till]] : []),
                ...(offerActive && offerAmt > 0 ? [['Offer bonus', `+${fmtKes(offerBonus)}`]] : []),
                ['You’ll receive', fmtKes(offerActive && offerAmt > 0 ? offerTotal : offerAmt)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <dt style={{ color: 'var(--muted)', fontSize: 13.5 }}>{k}</dt>
                  <dd className="mono tnum" style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>{v}</dd>
                </div>
              ))}
            </dl>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <Button onClick={handlePayNow} icon={<Icons.Check size={16} />}>Confirm & pay</Button>
              <Button variant="ghost" onClick={() => setStep('form')} disabled={depositing}>Back</Button>
            </div>
          </div>
        )}

        {/* STEP 4a — mobile money processing */}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }} role="status" aria-live="polite">
            <span className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Payment request sent to your phone.</p>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              Check your {METHOD_LABELS[method]} phone and complete the authorization. We’re watching for confirmation — nothing is frozen.
            </p>
            <p className="mono" style={{ margin: '16px 0 0', fontSize: 12.5, color: 'var(--dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Processing payment…
            </p>
            <div style={{ marginTop: 18 }}>
              <Button variant="ghost" onClick={closeDeposit}>Cancel</Button>
            </div>
          </div>
        )}

        {/* STEP 4b — card redirect */}
        {step === 'redirecting' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }} role="status" aria-live="polite">
            <span className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Redirecting to secure checkout…</p>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
              Complete the payment on the secure page. You’ll be brought straight back here.
            </p>
          </div>
        )}

        {/* STEP 5a — success */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }} role="status" aria-live="polite">
            <span style={{ display: 'inline-flex', color: 'var(--good)' }} aria-hidden="true"><Icons.CheckCircle size={52} /></span>
            <h3 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
              ✓ Payment successful
            </h3>
            <p style={{ margin: '6px 0 0', color: 'var(--ink-2)' }}>Your payment was received.</p>
            <p className="stat-num tnum" style={{ margin: '14px 0 0', color: 'var(--good)' }}>{fmtKes(creditedAmount)}</p>
            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>
              New balance: <strong style={{ color: 'var(--brand)' }}>{fmtKes(balance)}</strong>
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 18 }}>
              <Button onClick={() => { setDepositOpen(false); resetDeposit(); }}>Done</Button>
              <Button variant="ghost" onClick={resetDeposit}>Make another deposit</Button>
            </div>
          </div>
        )}

        {/* STEP 5b — failed */}
        {step === 'failed' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }} role="alert">
            <span style={{ display: 'inline-flex', color: 'var(--bad)' }} aria-hidden="true"><Icons.AlertCircle size={52} /></span>
            <h3 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
              ✕ Payment failed
            </h3>
            <p style={{ margin: '6px 0 0', color: 'var(--ink-2)' }}>Your payment was not completed.</p>
            {failureMsg && <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>{failureMsg}</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 18 }}>
              <Button onClick={() => setStep('form')}>Try again</Button>
              <Button variant="ghost" onClick={backToMethods}>Change method</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Voucher modal ── */}
      <Modal
        open={voucherOpen}
        onClose={() => { setVoucherOpen(false); setVoucherCode(''); }}
        size="sm"
        title="Redeem a voucher"
        description="Enter the 6-character code you were given and we’ll credit your wallet instantly."
      >
        <form onSubmit={handleRedeemVoucher}>
          <Field label="Voucher code" id="voucher-code">
            <Input
              id="voucher-code"
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
              className="input"
              autoComplete="off"
              style={{ letterSpacing: '0.3em', fontFamily: 'var(--font-mono)', textAlign: 'center' }}
            />
          </Field>
          <Button
            type="submit"
            block
            loading={redeemingVoucher}
            loadingText="Checking…"
            disabled={voucherCode.length !== 6}
            icon={<Icons.Ticket size={16} />}
          >
            Redeem code
          </Button>
        </form>
      </Modal>
    </AppBackground>
  );
}

// Outer page wraps WalletInner in Suspense (required for useSearchParams in Next.js 14)
export default function WalletPage() {
  return (
    <Suspense fallback={
      <AppBackground variant="dashboard">
        <div className="container-site" style={{ paddingTop: 26, paddingBottom: 90, maxWidth: 900 }}>
          <SkeletonText lines={4} />
        </div>
      </AppBackground>
    }>
      <WalletInner />
    </Suspense>
  );
}
