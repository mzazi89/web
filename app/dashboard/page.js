'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fmtKes } from '@/lib/currency';

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
  const [addModal, setAddModal]   = useState(false); // Add Server flow
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
      setSecNotice('Choose a question and enter an answer (min 2 characters).');
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
      if (!res.ok) { setSecNotice(d.error || 'Failed to save'); }
      else {
        setSecQuestion(secForm.question);
        setSecNotice('Security question saved.');
        setSecForm({ question: '', answer: '' });
      }
    } catch {
      setSecNotice('Connection error.');
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
      if (!res.ok) { setDevNotice(data.error || 'Failed to unlink'); setUnlinking(null); return; }
      setDevNotice(`Unlinking ${number}…`);
      setTimeout(fetchDevices, 14000); // the bot picks it up within ~15s
    } catch {
      setDevNotice('Connection error.');
      setUnlinking(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p className="mono text-[11px] uppercase tracking-[0.18em]" style={{ color: '#4C535B' }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const firstName = user?.firstname || user?.fullname?.split(' ')[0] || 'Member';
  const activePanels = panels.filter(p => p.status === 'active').length;

  const stats = [
    { label: 'Wallet balance', value: fmtKes(balance), href: '/wallet', tone: '#F2A93B' },
    { label: 'Active panels',  value: activePanels, href: '/products', tone: '#E9E7E2' },
    { label: 'API keys',       value: apiStats ? apiStats.keys : '—', href: '/api/dashboard/keys', tone: '#E9E7E2' },
    { label: 'API requests',   value: apiStats ? apiStats.requests.toLocaleString() : '—', href: '/api/dashboard', tone: '#E9E7E2' },
  ];

  return (
    <div className="py-10 sm:py-14">
      <div className="container-site">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-10">
          <div>
            <p className="eyebrow">Account</p>
            <h1 className="headline mt-3" style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.5rem)' }}>
              Welcome back, {firstName}<span className="accent">.</span>
            </h1>
            <p className="mono text-[11px] uppercase tracking-[0.14em] mt-2" style={{ color: '#4C535B' }}>{user?.email}</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Link href="/wallet" className="btn btn-ghost flex-1 sm:flex-none">Top up</Link>
            <Link href="/products" className="btn btn-primary flex-1 sm:flex-none">New panel</Link>
          </div>
        </div>

        {/* ── Stats ledger ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 mb-10" style={{ border: '1px solid #262C33' }}>
          {stats.map((s, i) => (
            <Link
              key={s.label}
              href={s.href}
              className="p-6 transition-colors"
              style={{
                textDecoration: 'none',
                borderLeft: i > 0 ? '1px solid #1B2026' : 'none',
                borderTop: i > 1 && i % 2 === 0 ? '1px solid #1B2026' : 'none',
                background: 'rgba(255,255,255,0.012)',
              }}
            >
              <div className="stat-num" style={{ color: s.tone }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column (2/3): panels + activity ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Panels */}
            <section className="card overflow-hidden">
              <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1B2026' }}>
                <div>
                  <h2 className="display text-base font-bold" style={{ color: '#E9E7E2' }}>My panels</h2>
                  <p className="mono text-[10px] uppercase tracking-[0.14em] mt-0.5" style={{ color: '#4C535B' }}>{panels.length} total · {activePanels} active</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAddModal(true)}
                    className="mono text-[11px] uppercase tracking-[0.12em]"
                    style={{ color: '#F2A93B', background: 'none', border: '1px solid rgba(242,169,59,0.4)', padding: '5px 10px', borderRadius: 4, cursor: 'pointer' }}
                  >
                    ➕ Add Server
                  </button>
                  <Link href="/products" className="mono text-[11px] uppercase tracking-[0.12em]" style={{ color: '#F2A93B', textDecoration: 'none' }}>
                    Deploy new →
                  </Link>
                </div>
              </header>

              {panels.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="display font-bold mb-2" style={{ color: '#E9E7E2' }}>No panels yet</p>
                  <p className="text-sm mb-6" style={{ color: '#79818A' }}>Deploy your first Pterodactyl panel in minutes.</p>
                  <Link href="/products" className="btn btn-primary">Deploy now</Link>
                </div>
              ) : (
                <div className="divide-y" style={{ borderBottom: '1px solid #1B2026' }}>
                  {panels.map(p => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="mono text-[10px]" style={{ color: '#4C535B' }}>#{p.id}</span>
                          <p className="text-sm font-semibold truncate" style={{ color: '#E9E7E2' }}>
                            {p.ptero_username || `Panel #${p.id}`}
                          </p>
                          <span className="tag" style={{ color: p.status === 'active' ? '#3ECF8E' : '#AEB5BD' }}>
                            <span className="dot" style={{ color: p.status === 'active' ? '#3ECF8E' : '#4C535B' }} />
                            {p.status}
                          </span>
                        </div>
                        <p className="mono text-[11px] mt-1.5" style={{ color: '#4C535B' }}>
                          {p.package_name} · {fmtKes(p.package_price || 0)}
                          {p.expires_at && (
                            <span className="ml-2" style={{ color: p.is_expired ? '#E5484D' : '#79818A' }}>
                              {p.is_expired ? 'EXPIRED' : `expires ${new Date(p.expires_at).toLocaleString()}`}
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => setCredModal({ panel: p })}
                        className="btn btn-dark flex-shrink-0"
                        style={{ padding: '8px 16px', fontSize: 11 }}
                      >
                        Credentials
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent activity */}
            <section className="card overflow-hidden">
              <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1B2026' }}>
                <div>
                  <h2 className="display text-base font-bold" style={{ color: '#E9E7E2' }}>Recent activity</h2>
                  <p className="mono text-[10px] uppercase tracking-[0.14em] mt-0.5" style={{ color: '#4C535B' }}>Wallet transactions</p>
                </div>
                <Link href="/wallet" className="mono text-[11px] uppercase tracking-[0.12em]" style={{ color: '#F2A93B', textDecoration: 'none' }}>
                  All →
                </Link>
              </header>
              {transactions.length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: '#4C535B' }}>No transactions yet.</p>
              ) : (
                <div className="divide-y" style={{ borderBottom: '1px solid #1B2026' }}>
                  {transactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="mono text-[10px] px-2 py-1 flex-shrink-0"
                          style={{
                            color: t.type === 'deposit' ? '#3ECF8E' : '#E5484D',
                            border: `1px solid ${t.type === 'deposit' ? 'rgba(62,207,142,0.3)' : 'rgba(229,72,77,0.3)'}`,
                            borderRadius: 2,
                          }}
                        >
                          {t.type === 'deposit' ? 'IN' : 'OUT'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] truncate" style={{ color: '#AEB5BD' }}>{t.description || t.type}</p>
                          <p className="mono text-[10px]" style={{ color: '#4C535B' }}>{new Date(t.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="mono text-[13px] font-semibold flex-shrink-0" style={{ color: t.type === 'deposit' ? '#3ECF8E' : '#E5484D' }}>
                        {t.type === 'deposit' ? '+' : '−'}{fmtKes(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── Right column (1/3) ── */}
          <div className="space-y-6">

            {/* Wallet */}
            <section className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: '#4C535B' }}>Wallet</h2>
                <Link href="/wallet" className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: '#F2A93B', textDecoration: 'none' }}>Manage →</Link>
              </div>
              <div className="stat-num mb-1" style={{ color: '#F2A93B' }}>{fmtKes(balance)}</div>
              <p className="mono text-[10px] uppercase tracking-[0.14em] mb-5" style={{ color: '#4C535B' }}>Available balance</p>
              <Link href="/wallet" className="btn btn-ghost w-full" style={{ padding: '10px 0', fontSize: 11 }}>
                Deposit funds
              </Link>
            </section>

            {/* Linked WhatsApp devices */}
            <section className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: '#4C535B' }}>Linked devices</h2>
                <Link href="/whatsapp-bot" className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: '#F2A93B', textDecoration: 'none' }}>Manage →</Link>
              </div>
              {devices ? (
                <>
                  <div className="stat-num mb-2" style={{ color: '#3ECF8E' }}>
                    {devices.devices.length}
                    <span className="text-sm font-semibold" style={{ color: '#4C535B' }}> / {devices.maxDevices === 999 ? '∞' : devices.maxDevices} linked</span>
                  </div>
                  <p className="mono text-[10px] uppercase tracking-[0.12em] mb-3" style={{ color: '#4C535B' }}>
                    Plan: <span style={{ color: '#AEB5BD' }}>{devices.plan.replace('_', ' ')}</span>
                    {devices.endDate && <> · until {new Date(devices.endDate).toLocaleDateString()}</>}
                  </p>
                  {devNotice && <p className="text-xs mb-3" style={{ color: '#F2A93B' }}>{devNotice}</p>}
                  {devices.devices.length === 0 ? (
                    <p className="text-xs py-3" style={{ color: '#4C535B' }}>
                      No devices yet.{' '}
                      <Link href="/whatsapp-bot" className="link" style={{ fontSize: 12 }}>Pair your first number →</Link>
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {devices.devices.map((d) => (
                        <div key={d.number} className="flex items-center justify-between gap-2 px-3 py-2.5" style={{ background: '#0F1215', border: '1px solid #1B2026' }}>
                          <span className="mono text-xs font-semibold truncate" style={{ color: '#E9E7E2' }}>{d.number}</span>
                          <button onClick={() => unlinkDevice(d.number)} disabled={unlinking === d.number}
                            className="mono text-[10px] uppercase tracking-[0.1em] flex-shrink-0"
                            style={{
                              color: '#E5484D',
                              border: '1px solid rgba(229,72,77,0.3)',
                              background: 'rgba(229,72,77,0.05)',
                              padding: '5px 10px',
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
                <p className="text-xs" style={{ color: '#4C535B' }}>Loading…</p>
              )}
            </section>

            {/* Security question */}
            <section className="card p-6">
              <h2 className="mono text-[10px] uppercase tracking-[0.18em] mb-1" style={{ color: '#4C535B' }}>Security question</h2>
              <p className="text-xs mb-4" style={{ color: '#79818A' }}>
                Answer it correctly to reset your password if you ever forget it.
              </p>

              {secQuestion !== null && secQuestion !== '' && (
                <p className="text-xs mb-4 px-3 py-2.5" style={{ background: 'rgba(242,169,59,0.05)', border: '1px solid rgba(242,169,59,0.25)', color: '#AEB5BD' }}>
                  Current: <b style={{ color: '#E9E7E2' }}>{secQuestion}</b>
                </p>
              )}
              {secQuestion === '' && (
                <p className="text-xs mb-4 px-3 py-2.5" style={{ background: 'rgba(76,125,252,0.05)', border: '1px solid rgba(76,125,252,0.25)', color: '#AEB5BD' }}>
                  Not set yet — set one below so you can recover your password.
                </p>
              )}

              <select
                value={secForm.question}
                onChange={(e) => setSecForm({ ...secForm, question: e.target.value })}
                className="input mb-2.5"
                style={{ padding: '9px 12px', fontSize: 13 }}>
                <option value="" disabled style={{ color: '#4C535B' }}>Choose a question…</option>
                {[
                  "What is your mother's maiden name?",
                  'What was the name of your first pet?',
                  'What city were you born in?',
                  'What was the name of your primary school?',
                  'What is your favourite food?',
                ].map((q) => (
                  <option key={q} value={q} style={{ color: '#E9E7E2' }}>{q}</option>
                ))}
              </select>
              <input
                type="text"
                value={secForm.answer}
                onChange={(e) => setSecForm({ ...secForm, answer: e.target.value })}
                placeholder="Your answer"
                className="input mb-3"
                style={{ padding: '9px 12px', fontSize: 13 }}
              />
              {secNotice && <p className="text-xs mb-2" style={{ color: '#F2A93B' }}>{secNotice}</p>}
              <button onClick={saveSecurity} disabled={secSaving}
                className="btn btn-dark w-full"
                style={{ padding: '10px 0', fontSize: 11, opacity: secSaving ? 0.6 : 1 }}>
                {secSaving ? 'Saving…' : secQuestion ? 'Update security question' : 'Set security question'}
              </button>
            </section>

            {/* MZAZI API */}
            <section className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: '#4C535B' }}>MZAZI API</h2>
                <Link href="/api/dashboard" className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: '#F2A93B', textDecoration: 'none' }}>Dashboard →</Link>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{ color: '#79818A' }}>
                Downloads, AI, search and 200+ more endpoints — one key, one envelope.
              </p>
              {apiStats && apiStats.usage && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="stat-num" style={{ fontSize: '1.35rem', color: '#E9E7E2' }}>{apiStats.usage.requests_today.toLocaleString()}</div>
                    <div className="stat-label">Requests today</div>
                  </div>
                  <div>
                    <div className="stat-num" style={{ fontSize: '1.35rem', color: '#3ECF8E' }}>{apiStats.usage.avg_response_ms !== null ? `${Number(apiStats.usage.avg_response_ms).toFixed(0)}ms` : '—'}</div>
                    <div className="stat-label">Avg response</div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Link href="/api/dashboard/keys" className="btn btn-ghost" style={{ padding: '9px 0', fontSize: 11 }}>API keys</Link>
                <Link href="/api/docs" className="btn btn-ghost" style={{ padding: '9px 0', fontSize: 11 }}>Docs & tester</Link>
              </div>
            </section>

            {/* Referral */}
            {referral && (
              <section className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: '#4C535B' }}>Refer & earn</h2>
                  <span className="tag tag-amber">KES 20 / purchase</span>
                </div>
                <p className="text-xs leading-relaxed mb-4" style={{ color: '#79818A' }}>
                  Share your link — when someone signs up and buys a panel, you get KES 20 in your wallet.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="stat-num" style={{ fontSize: '1.35rem', color: '#3ECF8E' }}>{referral.referred_count}</div>
                    <div className="stat-label">Referred</div>
                  </div>
                  <div>
                    <div className="stat-num" style={{ fontSize: '1.35rem', color: '#F2A93B' }}>{fmtKes(referral.total_earned)}</div>
                    <div className="stat-label">Earned</div>
                  </div>
                </div>
                <div className="flex gap-2 mb-2">
                  <code className="flex-1 mono text-[11px] px-3 py-2 truncate" style={{ background: '#0F1215', border: '1px solid #1B2026', color: '#AEB5BD' }}>
                    {referral.link}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(referral.link).then(() => setCopied(true)).catch(() => {}); setTimeout(() => setCopied(false), 2000); }}
                    className="btn btn-dark"
                    style={{ padding: '8px 14px', fontSize: 11 }}>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="mono text-[10px]" style={{ color: '#4C535B' }}>Your code: <span style={{ color: '#F2A93B' }}>{referral.code}</span></p>
              </section>
            )}

            {/* Quick links */}
            <section className="card p-6">
              <p className="mono text-[10px] uppercase tracking-[0.18em] mb-3" style={{ color: '#4C535B' }}>Quick links</p>
              <div className="divide-y" style={{ borderTop: '1px solid #1B2026', borderBottom: '1px solid #1B2026' }}>
                {[
                  { label: 'Deploy panel',   href: '/products' },
                  { label: 'WhatsApp bot',   href: '/whatsapp-bot' },
                  { label: 'MZAZI API',      href: '/api' },
                  { label: 'Contact support',href: '/contact' },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="flex items-center justify-between py-2.5 text-sm transition-colors"
                    style={{ color: '#AEB5BD', textDecoration: 'none' }}>
                    {l.label}
                    <span className="mono text-[10px]" style={{ color: '#4C535B' }}>→</span>
                  </Link>
                ))}
              </div>
            </section>
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
      {addModal && (
        <AddServerModal
          onClose={() => setAddModal(false)}
          onDone={() => { fetchPanels(); }}
        />
      )}
    </div>
  );
}

// ─── ➕ Add Server modal (existing panel owners) ──────────────────────────────
// Username → Similar (30% of first server price) or Different (full price,
// pick a package) → wallet deduction via /api/panel/add.
function AddServerModal({ onClose, onDone }) {
  const [step, setStep]     = useState('username'); // username | choice | packages | confirm
  const [username, setUsername] = useState('');
  const [mode, setMode]     = useState(null); // similar | different
  const [pkgs, setPkgs]     = useState([]);
  const [pkgId, setPkgId]   = useState('');
  const [busy, setBusy]     = useState(false);
  const [msg, setMsg]       = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const pickPackages = async () => {
    if (pkgs.length) return;
    try {
      const res = await fetch('/api/packages');
      const d = await res.json();
      setPkgs(d.packages || []);
    } catch {}
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/panel/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          mode,
          package_id: mode === 'different' ? parseInt(pkgId, 10) : undefined,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg(`✅ Server added! (KES ${Number(d.amount).toLocaleString()}) — #${d.server_id}`);
        setTimeout(() => { onDone(); onClose(); }, 1800);
      } else {
        setMsg(`❌ ${d.error || 'Failed to add server'}`);
      }
    } catch {
      setMsg('❌ Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    setMsg('');
    if (step === 'choice') setStep('username');
    else if (step === 'packages' || step === 'confirm') setStep('choice');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md overflow-hidden" style={{ backgroundColor: '#14181D', border: '1px solid #262C33', borderRadius: 4 }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #262C33' }}>
          <h3 className="text-sm font-bold" style={{ color: '#E9E7E2' }}>➕ Add Server</h3>
          <button onClick={onClose} className="mono text-xs" style={{ color: '#79818A', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        <div className="p-5">
          {msg && (
            <p className="text-sm mb-4" style={{ color: msg.startsWith('✅') ? '#3ECF8E' : '#E5484D' }}>{msg}</p>
          )}

          {step === 'username' && (
            <form onSubmit={(e) => { e.preventDefault(); if (username.trim()) setStep('choice'); }}>
              <label className="block text-xs mb-2" style={{ color: '#79818A' }}>
                Panel username <span style={{ color: '#4C535B' }}>(the username of your existing server)</span>
              </label>
              <input
                ref={inputRef}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. johndoe"
                className="input w-full"
                style={{ marginBottom: 12 }}
              />
              <button className="btn btn-primary w-full" disabled={!username.trim()}>Continue</button>
            </form>
          )}

          {step === 'choice' && (
            <div>
              <p className="text-xs mb-3" style={{ color: '#79818A' }}>
                Username: <b style={{ color: '#E9E7E2' }}>{username}</b>
              </p>
              <div className="space-y-2">
                <button
                  className="btn w-full"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => { setMode('similar'); setStep('confirm'); }}
                >
                  🔄 Similar server — 30% of your first server&apos;s price
                </button>
                <button
                  className="btn w-full"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => { setMode('different'); setStep('packages'); pickPackages(); }}
                >
                  📦 Different server — full price
                </button>
              </div>
              <button className="mono text-xs mt-4" style={{ color: '#79818A', background: 'none', border: 'none', cursor: 'pointer' }} onClick={back}>← Back</button>
            </div>
          )}

          {step === 'packages' && (
            <div>
              <p className="text-xs mb-3" style={{ color: '#79818A' }}>Choose a package (full price):</p>
              <div className="space-y-2 max-h-56 overflow-auto">
                {pkgs.length === 0 && <p className="text-xs" style={{ color: '#4C535B' }}>Loading packages…</p>}
                {pkgs.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 text-sm" style={{ color: '#E9E7E2', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="addpkg"
                      checked={String(pkgId) === String(p.id)}
                      onChange={() => setPkgId(p.id)}
                      style={{ accentColor: '#F2A93B' }}
                    />
                    {p.name} — KES {Number(p.price).toLocaleString()}
                  </label>
                ))}
              </div>
              <button className="btn btn-primary w-full mt-4" disabled={!pkgId} onClick={() => setStep('confirm')}>Continue</button>
              <button className="mono text-xs mt-3" style={{ color: '#79818A', background: 'none', border: 'none', cursor: 'pointer' }} onClick={back}>← Back</button>
            </div>
          )}

          {step === 'confirm' && (
            <form onSubmit={submit}>
              <p className="text-sm mb-4" style={{ color: '#E9E7E2' }}>
                Add a <b>{mode === 'similar' ? 'similar server (same specs, 30% of your first server&apos;s price)' : 'different server (full package price)'}</b> to username{' '}
                <b style={{ color: '#F2A93B' }}>{username}</b>? The amount is deducted from your wallet.
              </p>
              <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Working…' : '✅ Confirm & Pay'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
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
      <div className="w-full max-w-md overflow-hidden" style={{ backgroundColor: '#14181D', border: '1px solid #262C33', borderRadius: 4 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1B2026' }}>
          <div>
            <p className="display text-sm font-bold" style={{ color: '#E9E7E2' }}>Panel credentials</p>
            <p className="mono text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: '#4C535B' }}>{panel.ptero_username || `Panel #${panel.id}`}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center" style={{ color: '#79818A', border: '1px solid #262C33', background: 'transparent', cursor: 'pointer' }}>✕</button>
        </div>

        <div className="p-6">
          {!creds ? (
            /* Password gate */
            <form onSubmit={handleReveal} className="space-y-4">
              <div className="px-4 py-3" style={{ background: 'rgba(242,169,59,0.05)', border: '1px solid rgba(242,169,59,0.25)' }}>
                <p className="text-xs leading-relaxed" style={{ color: '#AEB5BD' }}>
                  For your security, enter your account password to view the credentials for this panel.
                </p>
              </div>

              {error && (
                <div className="px-3 py-2.5 text-xs" style={{ background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.3)', color: '#E5484D' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="label">Account password</label>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your login password"
                  className="input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="btn btn-primary w-full"
                style={{ opacity: loading || !password ? 0.6 : 1 }}>
                {loading ? 'Verifying…' : 'Reveal credentials'}
              </button>
            </form>
          ) : (
            /* Credentials view */
            <div className="space-y-3">
              <div className="px-3 py-2.5 text-xs" style={{ background: 'rgba(62,207,142,0.06)', border: '1px solid rgba(62,207,142,0.25)', color: '#3ECF8E' }}>
                Identity verified — credentials revealed below.
              </div>

              {[
                { label: 'Panel URL',  value: creds.panel_url,  key: 'url',   link: creds.panel_url },
                { label: 'Username',   value: creds.username,   key: 'user' },
                { label: 'Email',      value: creds.email,      key: 'email' },
                { label: 'Password',   value: creds.password,   key: 'pass' },
              ].map(({ label, value, key, link }) => (
                <div key={key} className="flex items-center justify-between gap-3 px-3 py-3"
                  style={{ background: '#0F1215', border: '1px solid #1B2026' }}>
                  <div className="min-w-0">
                    <p className="mono text-[9px] uppercase tracking-[0.14em]" style={{ color: '#4C535B' }}>{label}</p>
                    <p className="mono text-sm font-semibold truncate mt-0.5" style={{ color: key === 'pass' ? '#F2A93B' : '#E9E7E2' }}>
                      {key === 'pass' ? '••••••••' : value}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer"
                        className="btn btn-dark" style={{ padding: '6px 12px', fontSize: 10 }}>
                        Open
                      </a>
                    )}
                    <button
                      onClick={() => copy(value, key)}
                      className="btn btn-dark" style={{ padding: '6px 12px', fontSize: 10, color: copied === key ? '#3ECF8E' : undefined }}>
                      {copied === key ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}

              {/* Show real password (toggle) */}
              <PasswordReveal password={creds.password} />

              <p className="text-xs text-center" style={{ color: '#4C535B' }}>
                Keep these credentials safe — do not share them with anyone.
              </p>
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
    <div className="flex items-center justify-between px-3 py-3"
      style={{ background: 'rgba(242,169,59,0.04)', border: '1px solid rgba(242,169,59,0.2)' }}>
      <div>
        <p className="mono text-[9px] uppercase tracking-[0.14em] mb-0.5" style={{ color: '#4C535B' }}>Password (visible)</p>
        <p className="mono text-sm font-bold" style={{ color: '#F2A93B', letterSpacing: show ? 0 : '0.1em' }}>
          {show ? password : '••••••••••••'}
        </p>
      </div>
      <button
        onClick={() => setShow(v => !v)}
        className="btn btn-dark" style={{ padding: '6px 12px', fontSize: 10 }}>
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
