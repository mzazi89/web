'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fmtMtc, fmtMtcValue, mtcToKsh } from '@/lib/currency';

export default function DashboardPage() {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [panels, setPanels]       = useState([]);
  const [balance, setBalance]     = useState(0);
  const [transactions, setTxns]   = useState([]);
  const [apiStats, setApiStats]   = useState(null); // { keys, requests }
  const [referral, setReferral]   = useState(null); // { code, link, counts }
  const [copied, setCopied]       = useState(false);
  const [credModal, setCredModal] = useState(null); // { panel } | null
  // Linked WhatsApp devices (managed on the whatsapp-bot page)
  const [devices, setDevices]     = useState(null); // { plan, maxDevices, devices }
  const [unlinking, setUnlinking] = useState(null);
  const [devNotice, setDevNotice] = useState('');
  // Security question (password recovery)
  const [secQuestion, setSecQuestion] = useState(null); // null=unknown, ''=not set
  const [secForm, setSecForm] = useState({ question: '', answer: '' });
  const [secNotice, setSecNotice] = useState('');
  const [secSaving, setSecSaving] = useState(false);
  const router = useRouter();

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        await Promise.all([fetchPanels(), fetchWallet(), fetchApiStats(), fetchReferral()]);
      } else { router.push('/login'); }
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchReferral = async () => {
    try {
      const res = await fetch('/api/referral', { cache: 'no-store' });
      if (res.ok) setReferral(await res.json());
    } catch {}
  };

  const fetchApiStats = async () => {
    try {
      const [keysRes, statsRes] = await Promise.all([fetch('/api/api-keys'), fetch('/api/dashboard/stats')]);
      const keys = keysRes.ok ? (await keysRes.json()).keys || [] : [];
      const stats = statsRes.ok ? await statsRes.json() : null;
      const activeKeys = keys.filter(k => k.status === 'active').length;
      const totalRequests = keys.reduce((a, k) => a + (k.total_requests || 0), 0);
      setApiStats({ keys: activeKeys, requests: totalRequests, usage: stats?.stats });
    } catch {}
  };

  const fetchPanels = async () => {
    try {
      const res = await fetch('/api/panel/list');
      if (res.ok) { const d = await res.json(); setPanels(d.panels || []); }
    } catch {}
  };

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/wallet/balance');
      if (res.ok) { const d = await res.json(); setBalance(d.balance || 0); setTxns(d.transactions || []); }
    } catch {}
  };

  // ── Linked WhatsApp devices ────────────────────────────────────────────────
  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/pair/devices', { cache: 'no-store' });
      if (res.ok) setDevices(await res.json());
    } catch {}
  };

  useEffect(() => { if (user) fetchDevices(); }, [user]);

  // ── Security question (password recovery) ─────────────────────────────────
  useEffect(() => {
    if (!user) return;
    fetch('/api/auth/security', { cache: 'no-store' })
      .then((r) => r.ok && r.json())
      .then((d) => { if (d) setSecQuestion(d.question || ''); })
      .catch(() => {});
  }, [user]);

  const saveSecurity = async () => {
    if (!secForm.question || secForm.answer.length < 2) {
      setSecNotice('❌ Choose a question and enter an answer (min 2 characters).');
      return;
    }
    setSecSaving(true);
    setSecNotice('');
    try {
      const res = await fetch('/api/auth/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secForm),
      });
      const d = await res.json();
      if (!res.ok) { setSecNotice(`❌ ${d.error || 'Failed to save'}`); }
      else {
        setSecQuestion(secForm.question);
        setSecNotice('✅ Security question saved.');
        setSecForm({ question: '', answer: '' });
      }
    } catch {
      setSecNotice('❌ Connection error.');
    }
    setSecSaving(false);
  };

  const unlinkDevice = async (number) => {
    if (!window.confirm(`Unlink ${number}? The bot will disconnect and delete this session.`)) return;
    setUnlinking(number);
    setDevNotice('');
    try {
      const res = await fetch('/api/pair/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number }),
      });
      const data = await res.json();
      if (!res.ok) { setDevNotice(`❌ ${data.error || 'Failed to unlink'}`); setUnlinking(null); return; }
      setDevNotice(`⏳ Unlinking ${number}…`);
      setTimeout(fetchDevices, 14000); // the bot picks it up within ~15s
    } catch {
      setDevNotice('❌ Connection error.');
      setUnlinking(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgba(10,10,15,0.72)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
          <p className="text-sm" style={{ color: '#475569' }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const firstName = user?.firstname || user?.fullname?.split(' ')[0] || 'Member';
  const activePanels = panels.filter(p => p.status === 'active').length;

  const stats = [
    { label: 'Wallet Balance', value: fmtMtc(balance), icon: '💳', color: '#3b82f6', href: '/wallet' },
    { label: 'Active Panels',  value: activePanels,                                   icon: '🖥️', color: '#10b981', href: '/products' },
    { label: 'API Keys',       value: apiStats ? apiStats.keys : '—',                 icon: '🔑', color: '#a78bfa', href: '/api/dashboard/keys' },
    { label: 'API Requests',   value: apiStats ? apiStats.requests.toLocaleString() : '—', icon: '📡', color: '#f472b6', href: '/api/dashboard' },
  ];

  return (
    <div className="min-h-screen py-8 sm:py-10" style={{ backgroundColor: 'rgba(10,10,15,0.72)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#f0f4ff' }}>
              Welcome back, <span style={{ color: '#3b82f6' }}>{firstName}</span> 👋
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>{user?.email}</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Link href="/wallet"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)', textDecoration: 'none' }}>
              💳 Top Up
            </Link>
            <Link href="/products"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
              🚀 New Panel
            </Link>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-10">
          {stats.map(s => (
            <div key={s.label}
              className="p-4 sm:p-5 rounded-2xl transition-all"
              style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              {s.href ? (
                <Link href={s.href} style={{ textDecoration: 'none' }}><StatInner s={s} /></Link>
              ) : (
                <StatInner s={s} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

          {/* ── Panels list (2/3) ── */}
          <div className="lg:col-span-2 rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-base sm:text-lg" style={{ color: '#f0f4ff' }}>My Panels</h2>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{panels.length} total</p>
              </div>
              <Link href="/products"
                className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)', textDecoration: 'none' }}>
                + Deploy New
              </Link>
            </div>

            {panels.length === 0 ? (
              <div className="py-12 sm:py-16 text-center">
                <div className="text-4xl sm:text-5xl mb-4">🖥️</div>
                <p className="font-semibold mb-2" style={{ color: '#f0f4ff' }}>No panels yet</p>
                <p className="text-sm mb-5" style={{ color: '#64748b' }}>Deploy your first Pterodactyl panel in minutes.</p>
                <Link href="/products"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
                  🚀 Deploy Now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {panels.map(p => (
                  <div key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl"
                    style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa' }}>
                        🖥️
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: '#f0f4ff' }}>
                          {p.ptero_username || `Panel #${p.id}`}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                          {p.package_name} · {fmtMtc(p.package_price || 0)}
                          {p.expires_at && (
                            <span className="ml-1" style={{ color: p.is_expired ? '#f87171' : '#a78bfa' }}>
                              · {p.is_expired ? '⏱ Expired' : `⏱ Expires ${new Date(p.expires_at).toLocaleString()}`}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: p.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                          color: p.status === 'active' ? '#4ade80' : '#94a3b8',
                          border: `1px solid ${p.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(100,116,139,0.25)'}`,
                        }}>
                        {p.status}
                      </span>
                      {/* 🔐 View Credentials button */}
                      <button
                        onClick={() => setCredModal({ panel: p })}
                        className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                        style={{
                          backgroundColor: 'rgba(168,85,247,0.1)',
                          color: '#c084fc',
                          border: '1px solid rgba(168,85,247,0.25)',
                          cursor: 'pointer',
                        }}>
                        🔐 Credentials
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right sidebar (1/3) ── */}
          <div className="space-y-5">
            {/* Linked WhatsApp devices */}
            <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm sm:text-base" style={{ color: '#f0f4ff' }}>🤖 Linked Devices</h2>
                <Link href="/whatsapp-bot" className="text-xs" style={{ color: '#3b82f6', textDecoration: 'none' }}>Manage →</Link>
              </div>
              {devices ? (
                <>
                  <p className="font-extrabold mb-2" style={{ fontSize: 'clamp(1.4rem,3.5vw,1.8rem)', color: '#4ade80' }}>
                    {devices.devices.length} <span className="text-sm font-semibold" style={{ color: '#64748b' }}>/ {devices.maxDevices === 999 ? '∞' : devices.maxDevices} linked</span>
                  </p>
                  <p className="text-xs mb-3" style={{ color: '#64748b' }}>
                    Plan: <span className="font-bold" style={{ color: '#93c5fd' }}>{devices.plan.replace('_', ' ')}</span>
                    {devices.endDate && <> · until {new Date(devices.endDate).toLocaleDateString()}</>}
                  </p>
                  {devNotice && <p className="text-xs mb-2" style={{ color: '#4ade80' }}>{devNotice}</p>}
                  {devices.devices.length === 0 ? (
                    <p className="text-xs text-center py-3" style={{ color: '#475569' }}>
                      No devices yet.{' '}
                      <Link href="/whatsapp-bot" className="underline" style={{ color: '#60a5fa' }}>Pair your first number →</Link>
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {devices.devices.map((d) => (
                        <div key={d.number} className="flex items-center justify-between gap-2 p-2.5 rounded-xl"
                          style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a' }}>
                          <span className="font-mono text-xs font-bold truncate" style={{ color: '#f0f4ff' }}>{d.number}</span>
                          <button onClick={() => unlinkDevice(d.number)} disabled={unlinking === d.number}
                            className="text-[11px] px-2.5 py-1 rounded-lg font-semibold flex-shrink-0"
                            style={{
                              color: '#f87171',
                              border: '1px solid rgba(248,113,113,0.3)',
                              backgroundColor: 'rgba(248,113,113,0.05)',
                              cursor: unlinking === d.number ? 'not-allowed' : 'pointer',
                              opacity: unlinking === d.number ? 0.5 : 1,
                            }}>
                            {unlinking === d.number ? '…' : 'Unlink'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-center py-4" style={{ color: '#475569' }}>Loading…</p>
              )}
            </div>

            {/* Security question — password recovery */}
            <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <h2 className="font-bold text-sm sm:text-base mb-1" style={{ color: '#f0f4ff' }}>🔐 Security Question</h2>
              <p className="text-xs mb-4" style={{ color: '#64748b' }}>
                Answer it correctly to reset your password if you ever forget it.
              </p>

              {secQuestion !== null && secQuestion !== '' && (
                <p className="text-xs mb-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', color: '#93c5fd' }}>
                  Current: <b style={{ color: '#f0f4ff' }}>{secQuestion}</b>
                </p>
              )}
              {secQuestion === '' && (
                <p className="text-xs mb-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
                  Not set yet — set one below so you can recover your password.
                </p>
              )}

              <select
                value={secForm.question}
                onChange={(e) => setSecForm({ ...secForm, question: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 text-xs outline-none mb-2.5"
                style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a', color: '#f0f4ff' }}>
                <option value="" disabled style={{ color: '#64748b' }}>Choose a question…</option>
                {[
                  "What is your mother's maiden name?",
                  'What was the name of your first pet?',
                  'What city were you born in?',
                  'What was the name of your primary school?',
                  'What is your favourite food?',
                ].map((q) => (
                  <option key={q} value={q} style={{ color: '#f0f4ff' }}>{q}</option>
                ))}
              </select>
              <input
                type="text"
                value={secForm.answer}
                onChange={(e) => setSecForm({ ...secForm, answer: e.target.value })}
                placeholder="Your answer"
                className="w-full rounded-xl px-3 py-2.5 text-xs outline-none mb-3"
                style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
              />
              {secNotice && <p className="text-xs mb-2" style={{ color: secNotice.startsWith('❌') ? '#f87171' : '#4ade80' }}>{secNotice}</p>}
              <button onClick={saveSecurity} disabled={secSaving}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: secSaving ? 'not-allowed' : 'pointer', opacity: secSaving ? 0.6 : 1 }}>
                {secSaving ? 'Saving…' : secQuestion ? 'Update Security Question' : 'Set Security Question'}
              </button>
            </div>

            {/* Wallet card */}
            <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm sm:text-base" style={{ color: '#f0f4ff' }}>Wallet</h2>
                <Link href="/wallet" className="text-xs" style={{ color: '#3b82f6', textDecoration: 'none' }}>Manage →</Link>
              </div>
              <p className="font-extrabold mb-1" style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', color: '#3b82f6' }}>
                {fmtMtc(balance)}
              </p>
              <p className="text-xs mb-4" style={{ color: '#475569' }}>Available balance</p>
              <Link href="/wallet"
                className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center"
                style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)', textDecoration: 'none' }}>
                + Deposit Funds
              </Link>
            </div>

            {/* Recent transactions */}
            <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm sm:text-base" style={{ color: '#f0f4ff' }}>Recent Activity</h2>
                <Link href="/wallet" className="text-xs" style={{ color: '#3b82f6', textDecoration: 'none' }}>All →</Link>
              </div>
              {transactions.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#374151' }}>No transactions yet</p>
              ) : (
                <div className="space-y-2.5">
                  {transactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs"
                          style={{ backgroundColor: t.type === 'deposit' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                          {t.type === 'deposit' ? '⬆' : '⬇'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs truncate" style={{ color: '#cbd5e1' }}>{t.description || t.type}</p>
                          <p className="text-xs" style={{ color: '#374151' }}>{new Date(t.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold flex-shrink-0"
                        style={{ color: t.type === 'deposit' ? '#4ade80' : '#f87171' }}>
                        {t.type === 'deposit' ? '+' : '-'}{fmtMtc(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MZAZI API card */}
            <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#0f1629', border: '1px solid rgba(168,85,247,0.25)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm sm:text-base" style={{ color: '#f0f4ff' }}>🔌 MZAZI API</h2>
                <Link href="/api/dashboard" className="text-xs" style={{ color: '#a78bfa', textDecoration: 'none' }}>Dashboard →</Link>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#64748b' }}>
                Downloads, AI, search and 200+ more endpoints — one key, one envelope.
              </p>
              {apiStats && apiStats.usage && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a' }}>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: '#475569' }}>Today</p>
                    <p className="text-sm font-bold" style={{ color: '#93c5fd' }}>{apiStats.usage.requests_today.toLocaleString()}</p>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a' }}>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: '#475569' }}>Avg ms</p>
                    <p className="text-sm font-bold" style={{ color: '#4ade80' }}>{apiStats.usage.avg_response_ms !== null ? `${Number(apiStats.usage.avg_response_ms).toFixed(0)}ms` : '—'}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Link href="/api/dashboard/keys"
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-center"
                  style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)', textDecoration: 'none' }}>
                  + API Keys
                </Link>
                <Link href="/api/docs"
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-center"
                  style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.25)', textDecoration: 'none' }}>
                  Docs &amp; Tester
                </Link>
              </div>
            </div>

            {/* Referral card */}
            {referral && (
              <div className="rounded-2xl p-5" style={{ backgroundColor: '#0f1629', border: '1px solid rgba(74,222,128,0.25)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-sm sm:text-base" style={{ color: '#f0f4ff' }}>🎁 Refer &amp; Earn</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>
                    2 MTC / purchase
                  </span>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: '#64748b' }}>
                  Share your link — when someone signs up and buys a panel, you get 2 MTC (KSH 20) in your wallet.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a' }}>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: '#475569' }}>Referred</p>
                    <p className="text-sm font-bold" style={{ color: '#4ade80' }}>{referral.referred_count}</p>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a' }}>
                    <p className="text-[10px] uppercase tracking-wide" style={{ color: '#475569' }}>Earned</p>
                    <p className="text-sm font-bold" style={{ color: '#fbbf24' }}>{fmtMtc(referral.total_earned)}</p>
                  </div>
                </div>
                <div className="flex gap-2 mb-2">
                  <code className="flex-1 px-3 py-2 rounded-lg text-xs font-mono truncate"
                    style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a', color: '#93c5fd' }}>
                    {referral.link}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(referral.link).then(() => setCopied(true)).catch(() => {}); setTimeout(() => setCopied(false), 2000); }}
                    className="px-3 py-2 rounded-lg text-xs font-bold"
                    style={{ backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', cursor: 'pointer' }}>
                    Copy
                  </button>
                </div>
                <p className="text-[10px] font-mono" style={{ color: '#475569' }}>Your code: <span style={{ color: '#4ade80' }}>{referral.code}</span></p>
              </div>
            )}

            {/* Quick links */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Quick Links</p>
              <div className="space-y-2">
                {[
                  { label: 'Deploy Panel',   href: '/products', icon: '🚀' },
                  { label: 'WhatsApp Bot',   href: '/whatsapp-bot', icon: '🤖' },
                  { label: 'MZAZI API',      href: '/api',      icon: '🔌' },
                  { label: 'Contact Support',href: '/contact',  icon: '💬' },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={{ color: '#94a3b8', backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
                    <span>{l.icon}</span>
                    <span>{l.label}</span>
                    <svg className="w-3.5 h-3.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Credentials Modal ── */}
      {credModal && (
        <CredentialsModal
          panel={credModal.panel}
          user={user}
          onClose={() => setCredModal(null)}
        />
      )}
    </div>
  );
}

function StatInner({ s }) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl sm:text-2xl">{s.icon}</span>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
      </div>
      <p className="font-extrabold text-xl sm:text-2xl mb-1" style={{ color: s.color }}>{s.value}</p>
      <p className="text-xs" style={{ color: '#64748b' }}>{s.label}</p>
    </>
  );
}

function CredentialsModal({ panel, user, onClose }) {
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [creds, setCreds]         = useState(null);
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState('');
  const inputRef = useRef(null);
  const isGoogleOnly = !user?.password_set; // Google accounts have no local password

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleReveal = async (e) => {
    e.preventDefault();
    if (!password && !isGoogleOnly) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/panel/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panel_id: panel.id, password: password || 'google-auth' }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreds(data.credentials);
      } else {
        setError(data.error || 'Failed to verify');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e2d4a' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
              🔐
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Panel Credentials</p>
              <p className="text-xs" style={{ color: '#475569' }}>{panel.ptero_username || `Panel #${panel.id}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: '#475569', border: '1px solid #1e2d4a', background: 'transparent', cursor: 'pointer' }}>✕</button>
        </div>

        <div className="p-6">
          {!creds ? (
            /* Password gate */
            <form onSubmit={handleReveal} className="space-y-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <p className="text-xs leading-relaxed" style={{ color: '#c084fc' }}>
                  🔒 For your security, enter your account password to view the credentials for this panel.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>
                  Account Password
                </label>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your login password"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#1e2d4a'}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
                style={{
                  background: loading || !password ? '#1e2d4a' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                  cursor: loading || !password ? 'not-allowed' : 'pointer',
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Verifying…
                  </span>
                ) : '🔓 Reveal Credentials'}
              </button>
            </form>
          ) : (
            /* Credentials view */
            <div className="space-y-3">
              <div className="p-3 rounded-xl text-xs" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
                ✅ Identity verified — credentials revealed below.
              </div>

              {[
                { label: 'Panel URL',  value: creds.panel_url,  key: 'url',   icon: '🌐', link: creds.panel_url },
                { label: 'Username',   value: creds.username,   key: 'user',  icon: '👤' },
                { label: 'Email',      value: creds.email,      key: 'email', icon: '📧' },
                { label: 'Password',   value: creds.password,   key: 'pass',  icon: '🔑' },
              ].map(({ label, value, key, icon, link }) => (
                <div key={key} className="flex items-center justify-between gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a' }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs" style={{ color: '#475569' }}>{label}</p>
                      <p className="text-sm font-mono font-semibold truncate" style={{ color: key === 'pass' ? '#c084fc' : '#f0f4ff' }}>
                        {key === 'pass' ? '••••••••' : value}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)', textDecoration: 'none' }}>
                        Open ↗
                      </a>
                    )}
                    <button
                      onClick={() => copy(value, key)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: copied === key ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.1)',
                        color: copied === key ? '#4ade80' : '#c084fc',
                        border: `1px solid ${copied === key ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.25)'}`,
                        cursor: 'pointer',
                      }}>
                      {copied === key ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}

              {/* Show real password (toggle) */}
              <PasswordReveal password={creds.password} />

              <div className="pt-1">
                <p className="text-xs text-center" style={{ color: '#374151' }}>
                  Keep these credentials safe — do not share them with anyone.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordReveal({ password }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center justify-between p-3 rounded-xl"
      style={{ backgroundColor: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
      <div>
        <p className="text-xs mb-0.5" style={{ color: '#475569' }}>Password (visible)</p>
        <p className="text-sm font-mono font-bold" style={{ color: '#c084fc', letterSpacing: show ? 0 : '0.1em' }}>
          {show ? password : '••••••••••••'}
        </p>
      </div>
      <button
        onClick={() => setShow(v => !v)}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)', cursor: 'pointer' }}>
        {show ? '🙈 Hide' : '👁 Show'}
      </button>
    </div>
  );
}
