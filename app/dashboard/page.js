'use client';

// MZAZI TECH — Dashboard.
//
// Answers the five questions a returning user actually has, in the first screen:
// is my account active, which plan, when does it expire, how many devices, is my
// bot online — then offers the three actions that matter.
//
// Everything the dashboard used to do is still here, moved into clearly
// separated secondary tabs. No fetch was changed:
//   GET  /api/auth/me
//   GET  /api/wallet/balance
//   GET  /api/pair/devices          (cache: no-store)
//   POST /api/pair/unlink           → { number }
//   GET  /api/panel/list
//   GET  /api/vps/my
//   GET  /api/api-keys  ·  GET /api/dashboard/stats
//   GET  /api/referral              (cache: no-store)
//   GET  /api/auth/security         (cache: no-store)
//   POST /api/auth/security         → secForm
//   GET  /api/packages
//   POST /api/panel/add
//   POST /api/panel/credentials

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBackground, PageHeader, Button, Card, CardHeader, StatCard, Badge, StatusIndicator,
  EmptyState, SkeletonText, SkeletonCards, ConfirmDialog, Alert, Field, Select, Input,
  humaniseError, planLabel, planTone, Icons,
} from '@/components/ui';
import { fmtKes } from '@/lib/currency';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'services', label: 'Panels & VPS' },
  { id: 'developer', label: 'Developer' },
  { id: 'security', label: 'Security' },
];

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [panels, setPanels] = useState([]);
  const [vpsServers, setVpsServers] = useState([]);
  const [showVpsCreds, setShowVpsCreds] = useState({}); // id -> reveal password?
  const [balance, setBalance] = useState(0);
  const [transactions, setTxns] = useState([]);
  const [apiStats, setApiStats] = useState(null); // { keys, requests }
  const [referral, setReferral] = useState(null); // { code, link, counts }
  const [copied, setCopied] = useState(false);
  const [credModal, setCredModal] = useState(null); // { panel } | null
  const [addModal, setAddModal] = useState(false); // Add Server flow
  const [tab, setTab] = useState('overview');
  // Linked WhatsApp devices (managed on the whatsapp-bot page)
  const [devices, setDevices] = useState(null); // { plan, maxDevices, devices }
  const [unlinking, setUnlinking] = useState(null);
  const [deviceToUnlink, setDeviceToUnlink] = useState(null);
  const [devNotice, setDevNotice] = useState('');
  // Security question (password recovery)
  const [secQuestion, setSecQuestion] = useState(null); // null=unknown, ''=not set
  const [secForm, setSecForm] = useState({ question: '', answer: '' });
  const [secNotice, setSecNotice] = useState('');
  const [secSaving, setSecSaving] = useState(false);
  const router = useRouter();

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        await Promise.all([fetchPanels(), fetchVps(), fetchWallet(), fetchApiStats(), fetchReferral()]);
      } else {
        router.push('/login');
      }
    } catch (e) {
      setAuthError(humaniseError(e, 'We could not load your dashboard. Please try again.'));
    } finally {
      setLoading(false);
    }
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

  const fetchVps = async () => {
    try {
      const res = await fetch('/api/vps/my');
      if (res.ok) { const d = await res.json(); setVpsServers(d.vps || []); }
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
      if (!res.ok) { setSecNotice(humaniseError(d.error || 'We could not save that.')); }
      else {
        setSecQuestion(secForm.question);
        setSecNotice('Security question saved.');
        setSecForm({ question: '', answer: '' });
      }
    } catch (e) {
      setSecNotice(humaniseError(e));
    }
    setSecSaving(false);
  };

  const unlinkDevice = async () => {
    if (!deviceToUnlink) return;
    const number = deviceToUnlink;
    setUnlinking(number);
    setDevNotice('');
    try {
      const res = await fetch('/api/pair/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number }),
      });
      const data = await res.json();
      setDeviceToUnlink(null);
      if (!res.ok) { setDevNotice(humaniseError(data.error || 'We could not unlink that device.')); setUnlinking(null); return; }
      setDevNotice(`Unlinking ${number}…`);
      setTimeout(() => { setUnlinking(null); fetchDevices(); }, 14000); // the bot picks it up within ~15s
    } catch (e) {
      setDeviceToUnlink(null);
      setDevNotice(humaniseError(e));
      setUnlinking(null);
    }
  };

  if (loading) {
    return (
      <AppBackground variant="dashboard">
        <div className="container-site" style={{ paddingTop: 28, paddingBottom: 90, maxWidth: 1100 }}>
          <SkeletonText lines={2} />
          <div style={{ height: 20 }} />
          <SkeletonCards count={4} height={110} />
          <div style={{ height: 22 }} />
          <SkeletonText lines={5} />
        </div>
      </AppBackground>
    );
  }

  const firstName = user?.firstname || user?.fullname?.split(' ')[0] || 'Member';
  const activePanels = panels.filter(p => p.status === 'active').length;

  const deviceList = devices?.devices || [];
  const maxDevices = devices?.maxDevices ?? 1;
  const unlimited = maxDevices >= 999;
  const planId = devices?.plan || 'FREE';
  const endDate = devices?.endDate;
  const liveDevices = deviceList.filter(d => String(d.status || '').toUpperCase() !== 'INACTIVE');
  const botStatus = deviceList.length === 0
    ? { value: 'No devices', tone: 'blue', hint: 'Connect a number to go live' }
    : liveDevices.length > 0
      ? { value: 'Online', tone: 'good', hint: `${liveDevices.length} live` }
      : { value: 'Offline', tone: 'warn', hint: 'Reconnect a device' };

  const facts = [
    { label: 'Plan', value: planLabel(planId), hint: endDate ? `until ${new Date(endDate).toLocaleDateString()}` : 'Free forever', tone: planTone(planId) === 'neutral' ? 'blue' : 'brand', icon: <Icons.Sparkles size={19} /> },
    { label: 'Devices', value: `${deviceList.length} of ${unlimited ? '∞' : maxDevices}`, hint: unlimited ? 'Unlimited plan' : `${Math.max(0, maxDevices - deviceList.length)} slot${maxDevices - deviceList.length === 1 ? '' : 's'} free`, tone: 'blue', icon: <Icons.Phone size={19} /> },
    { label: 'Status', value: botStatus.value, hint: botStatus.hint, tone: botStatus.tone, icon: <Icons.Wifi size={19} /> },
    { label: 'Expires', value: endDate ? new Date(endDate).toLocaleDateString() : 'Never', hint: endDate ? 'Plan renewal date' : 'No expiry', tone: 'good', icon: <Icons.Calendar size={19} /> },
  ];

  return (
    <AppBackground variant="dashboard">
      <div className="container-site" style={{ paddingTop: 26, paddingBottom: 90, maxWidth: 1100 }}>
        <PageHeader
          title={<>Welcome back, {firstName} <span aria-hidden="true">👋</span></>}
          description={user?.email ? `Signed in as ${user.email}` : 'Your account at a glance.'}
          icon={<Icons.Dashboard size={20} />}
          actions={
            <>
              <Button variant="ghost" href="/wallet" icon={<Icons.Wallet size={16} />}>Wallet</Button>
              <Button href="/subscription" icon={<Icons.Sparkles size={16} />}>Upgrade plan</Button>
            </>
          }
        />

        {authError && (
          <div style={{ marginBottom: 20 }}>
            <Alert kind="error" title="We couldn’t load your dashboard">
              {authError}{' '}
              <button type="button" className="link" onClick={checkAuth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Try again</button>
            </Alert>
          </div>
        )}

        {/* ── Primary answer ── */}
        <div className="grid-cards anim-fade-up" style={{ marginBottom: 22 }}>
          {facts.map((f) => (
            <StatCard key={f.label} label={f.label} value={f.value} hint={f.hint} icon={f.icon} tone={f.tone} />
          ))}
        </div>

        {/* ── Three actions ── */}
        <div className="anim-fade-up d1" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
          <Button href="/devices" icon={<Icons.WhatsApp size={16} />}>Connect WhatsApp</Button>
          <Button href="/devices" variant="dark" icon={<Icons.Phone size={16} />}>Manage devices</Button>
          <Button href="/subscription" variant="ghost" icon={<Icons.Sparkles size={16} />}>Upgrade plan</Button>
        </div>

        <div className="grid-2-responsive anim-fade-up d2" style={{ marginBottom: 26 }}>
          {/* ── Devices preview ── */}
          <Card>
            <CardHeader
              title="Your devices"
              description={devices ? `${deviceList.length} of ${unlimited ? 'unlimited' : maxDevices} connected` : 'Loading…'}
              icon={<Icons.Phone size={18} />}
              action={<Button variant="ghost" size="sm" href="/devices">Manage</Button>}
            />

            {devNotice && (
              <div style={{ marginBottom: 12 }} role="status" aria-live="polite">
                <Alert kind="info">{devNotice}</Alert>
              </div>
            )}

            {!devices ? (
              <SkeletonText lines={3} />
            ) : deviceList.length === 0 ? (
              <EmptyState
                compact
                icon={<Icons.WhatsApp size={26} />}
                title="No devices connected yet."
                description="Connect your first WhatsApp number to get started."
                action={<Button size="sm" href="/whatsapp-bot" icon={<Icons.WhatsApp size={15} />}>Connect WhatsApp</Button>}
              />
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {deviceList.slice(0, 3).map((d) => (
                  <div
                    key={d.number}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--line-soft)', borderRadius: 'var(--r-md)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <Icons.WhatsApp size={18} />
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.number}</span>
                    </div>
                    <Button size="sm" variant="ghost" disabled={unlinking === d.number} onClick={() => setDeviceToUnlink(d.number)} style={{ color: 'var(--bad)' }}>
                      {unlinking === d.number ? '…' : 'Unlink'}
                    </Button>
                  </div>
                ))}
                {deviceList.length > 3 && (
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--dim)' }}>+{deviceList.length - 3} more on the devices page.</p>
                )}
              </div>
            )}
          </Card>

          {/* ── Recent activity ── */}
          <Card>
            <CardHeader
              title="Recent activity"
              description="Wallet transactions"
              icon={<Icons.CreditCard size={18} />}
              action={<Button variant="ghost" size="sm" href="/payments">All payments</Button>}
            />
            {transactions.length === 0 ? (
              <EmptyState
                compact
                icon={<Icons.CreditCard size={26} />}
                title="No payments yet."
                description="Top-ups and plan purchases will appear here."
                action={<Button size="sm" href="/wallet" icon={<Icons.Plus size={15} />}>Add money</Button>}
              />
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {transactions.slice(0, 5).map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description || t.type}
                      </p>
                      <p className="mono" style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--dim)' }}>{new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="mono tnum" style={{ flexShrink: 0, fontWeight: 700, color: t.type === 'deposit' ? 'var(--good)' : 'var(--bad)' }}>
                      {t.type === 'deposit' ? '+' : '−'}{fmtKes(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Secondary tabs ── */}
        <div className="segmented" role="tablist" aria-label="More sections" style={{ marginBottom: 20 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'is-active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ SERVICES ══ */}
        {tab === 'services' && (
          <div className="grid-2-responsive">
            <Card>
              <CardHeader
                title="My panels"
                description={`${panels.length} total · ${activePanels} active`}
                icon={<Icons.Dashboard size={18} />}
                action={<Button size="sm" onClick={() => setAddModal(true)} icon={<Icons.Plus size={15} />}>Add server</Button>}
              />
              {panels.length === 0 ? (
                <EmptyState
                  compact
                  icon={<Icons.Dashboard size={26} />}
                  title="No panels yet"
                  description="Deploy your first Pterodactyl panel in minutes."
                  action={<Button size="sm" href="/products">Deploy now</Button>}
                />
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {panels.map((p) => (
                    <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--line-soft)', borderRadius: 'var(--r-md)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span className="mono" style={{ fontSize: 11, color: 'var(--dim)' }}>#{p.id}</span>
                          <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{p.ptero_username || `Panel #${p.id}`}</span>
                          <Badge tone={p.status === 'active' ? 'good' : 'neutral'} dot>{p.status}</Badge>
                        </div>
                        <p className="mono" style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--dim)' }}>
                          {p.package_name} · {fmtKes(p.package_price || 0)}
                          {p.expires_at && (
                            <span style={{ marginLeft: 8, color: p.is_expired ? 'var(--bad)' : 'var(--muted)' }}>
                              {p.is_expired ? 'EXPIRED' : `expires ${new Date(p.expires_at).toLocaleDateString()}`}
                            </span>
                          )}
                        </p>
                      </div>
                      <Button size="sm" variant="dark" onClick={() => setCredModal({ panel: p })}>Credentials</Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader
                title="My VPS servers"
                description={`${vpsServers.length} purchased`}
                icon={<Icons.Command size={18} />}
                action={<Button size="sm" variant="ghost" href="/vps">Buy more</Button>}
              />
              {vpsServers.length === 0 ? (
                <EmptyState
                  compact
                  icon={<Icons.Command size={26} />}
                  title="No VPS yet"
                  description="Get a full-access server — credentials revealed instantly after payment."
                  action={<Button size="sm" href="/vps">Browse VPS</Button>}
                />
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {vpsServers.map((s) => {
                    const reveal = !!showVpsCreds[s.order_id];
                    return (
                      <div key={s.order_id} style={{ padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--line-soft)', borderRadius: 'var(--r-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{s.package_name}</span>
                          <Badge tone="good" dot>Active</Badge>
                        </div>
                        <p className="mono" style={{ margin: '6px 0 0', fontSize: 11.5, color: 'var(--dim)' }}>
                          {[s.hostname, s.region, s.instance_os || s.pkg_os, s.cpu || s.pkg_cpu, s.droplet_id ? `ID ${s.droplet_id}` : ''].filter(Boolean).join(' · ') || `${s.ram} · ${s.cpu}`}
                        </p>
                        <div className="mono" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8, fontSize: 12 }}>
                          <span style={{ color: 'var(--ink-2)' }}>{s.username}@{s.host} -p {s.port || 22}</span>
                          <span style={{ color: 'var(--muted)' }}>Pass: {reveal ? <strong style={{ color: 'var(--brand)' }}>{s.password}</strong> : '••••••••'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                          <Button size="sm" variant="ghost" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(s.host).catch(() => {}); }}>Copy host</Button>
                          <Button size="sm" variant="ghost" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(s.password).catch(() => {}); }}>Copy pass</Button>
                          <Button size="sm" variant="dark" onClick={() => setShowVpsCreds(p => ({ ...p, [s.order_id]: !reveal }))}>
                            {reveal ? 'Hide password' : 'Reveal password'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ══ DEVELOPER ══ */}
        {tab === 'developer' && (
          <div className="grid-2-responsive">
            <Card>
              <CardHeader
                title="MZAZI API"
                description="Downloads, AI, search and 200+ more endpoints — one key, one envelope."
                icon={<Icons.Command size={18} />}
                action={<Button size="sm" variant="ghost" href="/api/dashboard">Open dashboard</Button>}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
                <div>
                  <p className="stat-num tnum" style={{ margin: 0, fontSize: '1.35rem' }}>{apiStats ? apiStats.keys : '—'}</p>
                  <p className="stat-label">API keys</p>
                </div>
                <div>
                  <p className="stat-num tnum" style={{ margin: 0, fontSize: '1.35rem' }}>{apiStats ? apiStats.requests.toLocaleString() : '—'}</p>
                  <p className="stat-label">Total requests</p>
                </div>
                {apiStats?.usage && (
                  <>
                    <div>
                      <p className="stat-num tnum" style={{ margin: 0, fontSize: '1.35rem' }}>{apiStats.usage.requests_today.toLocaleString()}</p>
                      <p className="stat-label">Requests today</p>
                    </div>
                    <div>
                      <p className="stat-num tnum" style={{ margin: 0, fontSize: '1.35rem', color: 'var(--good)' }}>
                        {apiStats.usage.avg_response_ms !== null ? `${Number(apiStats.usage.avg_response_ms).toFixed(0)}ms` : '—'}
                      </p>
                      <p className="stat-label">Avg response</p>
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Button size="sm" variant="ghost" href="/api/dashboard/keys">API keys</Button>
                <Button size="sm" variant="ghost" href="/api/docs">Docs & tester</Button>
              </div>
            </Card>

            <div style={{ display: 'grid', gap: 22, alignContent: 'start' }}>
              {referral && (
                <Card>
                  <CardHeader
                    title="Refer & earn"
                    description="Share your link — when someone signs up and buys a panel, you get KES 20 in your wallet."
                    icon={<Icons.Users size={18} />}
                    action={<Badge tone="brand">KES 20 / purchase</Badge>}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
                    <div>
                      <p className="stat-num tnum" style={{ margin: 0, fontSize: '1.35rem', color: 'var(--good)' }}>{referral.referred_count}</p>
                      <p className="stat-label">Referred</p>
                    </div>
                    <div>
                      <p className="stat-num tnum" style={{ margin: 0, fontSize: '1.35rem', color: 'var(--brand)' }}>{fmtKes(referral.total_earned)}</p>
                      <p className="stat-label">Earned</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <code className="mono truncate-1" style={{ flex: 1, padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--line-soft)', borderRadius: 'var(--r-sm)', color: 'var(--ink-2)', fontSize: 11.5 }}>
                      {referral.link}
                    </code>
                    <Button
                      size="sm"
                      variant="dark"
                      onClick={() => { navigator.clipboard.writeText(referral.link).then(() => setCopied(true)).catch(() => {}); setTimeout(() => setCopied(false), 2000); }}
                      icon={copied ? <Icons.Check size={15} /> : <Icons.Copy size={15} />}
                      aria-label="Copy referral link"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <p className="mono" style={{ margin: 0, fontSize: 11, color: 'var(--dim)' }}>
                    Your code: <span style={{ color: 'var(--brand)' }}>{referral.code}</span>
                  </p>
                </Card>
              )}

              <Card>
                <CardHeader title="Quick links" icon={<Icons.ExternalLink size={18} />} />
                <div style={{ display: 'grid', gap: 4 }}>
                  {[
                    { label: 'Deploy panel', href: '/products', icon: <Icons.Dashboard size={16} /> },
                    { label: 'WhatsApp bot', href: '/whatsapp-bot', icon: <Icons.WhatsApp size={16} /> },
                    { label: 'MZAZI API', href: '/api', icon: <Icons.Command size={16} /> },
                    { label: 'Help & support', href: '/help', icon: <Icons.Help size={16} /> },
                    { label: 'Contact support', href: '/contact', icon: <Icons.Send size={16} /> },
                  ].map((l) => (
                    <a key={l.href} href={l.href} className="menu-item" style={{ justifyContent: 'space-between' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>{l.icon}{l.label}</span>
                      <Icons.ChevronRight size={15} />
                    </a>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ══ SECURITY ══ */}
        {tab === 'security' && (
          <Card>
            <CardHeader
              title="Security question"
              description="Answer it correctly to reset your password if you ever forget it."
              icon={<Icons.Shield size={18} />}
            />
            {secQuestion !== null && secQuestion !== '' && (
              <div style={{ marginBottom: 16 }}><Alert kind="brand" title="Currently set">“{secQuestion}”</Alert></div>
            )}
            {secQuestion === '' && (
              <div style={{ marginBottom: 16 }}><Alert kind="info">Not set yet — add one below so you can recover your password.</Alert></div>
            )}

            <Field label="Question" id="dash-sec-q">
              <Select id="dash-sec-q" value={secForm.question} onChange={(e) => setSecForm({ ...secForm, question: e.target.value })}>
                <option value="">Choose a question…</option>
                {[
                  "What is your mother's maiden name?",
                  'What was the name of your first pet?',
                  'What city were you born in?',
                  'What was the name of your primary school?',
                  'What is your favourite food?',
                ].map((q) => <option key={q} value={q}>{q}</option>)}
              </Select>
            </Field>

            <Field label="Answer" id="dash-sec-a">
              <Input
                id="dash-sec-a"
                type="text"
                value={secForm.answer}
                onChange={(e) => setSecForm({ ...secForm, answer: e.target.value })}
                placeholder="Your answer"
                autoComplete="off"
              />
            </Field>

            {secNotice && (
              <div style={{ marginBottom: 14 }} role="status" aria-live="polite">
                <Alert kind={secNotice.toLowerCase().includes('saved') ? 'success' : 'error'}>{secNotice}</Alert>
              </div>
            )}

            <Button onClick={saveSecurity} loading={secSaving} loadingText="Saving…" variant="dark">
              {secQuestion ? 'Update security question' : 'Set security question'}
            </Button>
          </Card>
        )}
      </div>

      {/* ── Unlink confirmation ── */}
      <ConfirmDialog
        open={!!deviceToUnlink}
        onClose={() => { if (unlinking === null) setDeviceToUnlink(null); }}
        onConfirm={unlinkDevice}
        loading={unlinking !== null}
        tone="danger"
        title="Unlink this device?"
        description={`${deviceToUnlink || ''} will be logged out of WhatsApp. The bot will disconnect and the session deleted — you can pair it again later.`}
        confirmLabel="Unlink device"
      />

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
    </AppBackground>
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
        setMsg(`Server added! (${fmtKes(d.amount)}) — #${d.server_id}`);
        setTimeout(() => { onDone(); onClose(); }, 1800);
      } else {
        setMsg(humaniseError(d.error || 'We could not add that server.'));
      }
    } catch (e) {
      setMsg(humaniseError(e));
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
      <div className="w-full max-w-md overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
          <h3 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Add server</h3>
          <button onClick={onClose} className="icon-btn" aria-label="Close dialog" style={{ width: 34, height: 34 }}><Icons.X size={16} /></button>
        </div>
        <div className="p-5">
          {msg && (
            <div style={{ marginBottom: 16 }}>
              <Alert kind={msg.startsWith('Server added') ? 'success' : 'error'}>{msg}</Alert>
            </div>
          )}

          {step === 'username' && (
            <form onSubmit={(e) => { e.preventDefault(); if (username.trim()) setStep('choice'); }}>
              <Field label="Panel username" id="add-username" hint="The username of your existing server.">
                <input
                  id="add-username"
                  ref={inputRef}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. johndoe"
                  className="input"
                />
              </Field>
              <Button type="submit" block disabled={!username.trim()}>Continue</Button>
            </form>
          )}

          {step === 'choice' && (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: 13.5, color: 'var(--muted)' }}>
                Username: <strong style={{ color: 'var(--ink)' }}>{username}</strong>
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                <button className="option-card" type="button" style={{ textAlign: 'left' }} onClick={() => { setMode('similar'); setStep('confirm'); }}>
                  Similar server — 30% of your first server’s price
                </button>
                <button className="option-card" type="button" style={{ textAlign: 'left' }} onClick={() => { setMode('different'); setStep('packages'); pickPackages(); }}>
                  Different server — full price
                </button>
              </div>
              <Button variant="ghost" size="sm" onClick={back} style={{ marginTop: 16 }}>Back</Button>
            </div>
          )}

          {step === 'packages' && (
            <div>
              <p style={{ margin: '0 0 12px', fontSize: 13.5, color: 'var(--muted)' }}>Choose a package (full price):</p>
              <div style={{ display: 'grid', gap: 8, maxHeight: 220, overflow: 'auto' }}>
                {pkgs.length === 0 && <p style={{ margin: 0, fontSize: 13, color: 'var(--dim)' }}>Loading packages…</p>}
                {pkgs.map((p) => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--ink)', cursor: 'pointer' }}>
                    <input type="radio" name="addpkg" checked={String(pkgId) === String(p.id)} onChange={() => setPkgId(p.id)} style={{ accentColor: 'var(--brand)' }} />
                    {p.name} — {fmtKes(p.price)}
                  </label>
                ))}
              </div>
              <Button block disabled={!pkgId} onClick={() => setStep('confirm')} style={{ marginTop: 16 }}>Continue</Button>
              <Button variant="ghost" size="sm" onClick={back} style={{ marginTop: 10 }}>Back</Button>
            </div>
          )}

          {step === 'confirm' && (
            <form onSubmit={submit}>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--ink)' }}>
                Add a <strong>{mode === 'similar' ? 'similar server (same specs, 30% of your first server’s price)' : 'different server (full package price)'}</strong> to username{' '}
                <strong style={{ color: 'var(--brand)' }}>{username}</strong>? The amount is deducted from your wallet.
              </p>
              <Button type="submit" block disabled={busy} loading={busy} loadingText="Working…">Confirm & pay</Button>
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
        setError(humaniseError(data.error || 'We could not verify that password.'));
      }
    } catch (e) {
      setError(humaniseError(e));
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
      <div className="w-full max-w-md overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <div>
            <p className="display text-sm font-bold" style={{ color: 'var(--ink)' }}>Panel credentials</p>
            <p className="mono text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: 'var(--dim)' }}>{panel.ptero_username || `Panel #${panel.id}`}</p>
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="Close dialog" style={{ width: 34, height: 34 }}><Icons.X size={16} /></button>
        </div>

        <div className="p-6">
          {!creds ? (
            <form onSubmit={handleReveal} className="space-y-4">
              <Alert kind="info">For your security, enter your account password to view the credentials for this panel.</Alert>

              {error && <Alert kind="error">{error}</Alert>}

              <Field label="Account password" id="cred-pass">
                <input
                  id="cred-pass"
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your login password"
                  className="input"
                  required
                />
              </Field>

              <Button type="submit" block disabled={loading || (!password && !isGoogleOnly)} loading={loading} loadingText="Verifying…">
                Reveal credentials
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <Alert kind="success">Identity verified — credentials revealed below.</Alert>

              {[
                { label: 'Panel URL',  value: creds.panel_url,  key: 'url',   link: creds.panel_url },
                { label: 'Username',   value: creds.username,   key: 'user' },
                { label: 'Email',      value: creds.email,      key: 'email' },
                { label: 'Password',   value: creds.password,   key: 'pass' },
              ].map(({ label, value, key, link }) => (
                <div key={key} className="flex items-center justify-between gap-3 px-3 py-3"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line-soft)', borderRadius: 'var(--r-sm)' }}>
                  <div className="min-w-0">
                    <p className="mono text-[9px] uppercase tracking-[0.14em]" style={{ color: 'var(--dim)' }}>{label}</p>
                    <p className="mono text-sm font-semibold truncate mt-0.5" style={{ color: key === 'pass' ? 'var(--brand)' : 'var(--ink)' }}>
                      {key === 'pass' ? '••••••••' : value}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm">Open</a>
                    )}
                    <Button size="sm" variant="dark" onClick={() => copy(value, key)}>
                      {copied === key ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
              ))}

              <PasswordReveal password={creds.password} />

              <p className="text-xs text-center" style={{ color: 'var(--dim)' }}>
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
      style={{ background: 'var(--brand-tint)', border: '1px solid var(--brand-soft)', borderRadius: 'var(--r-sm)' }}>
      <div>
        <p className="mono text-[9px] uppercase tracking-[0.14em] mb-0.5" style={{ color: 'var(--dim)' }}>Password (visible)</p>
        <p className="mono text-sm font-bold" style={{ color: 'var(--brand)', letterSpacing: show ? 0 : '0.1em' }}>
          {show ? password : '••••••••••••'}
        </p>
      </div>
      <Button size="sm" variant="dark" onClick={() => setShow(v => !v)}>
        {show ? 'Hide' : 'Show'}
      </Button>
    </div>
  );
}
