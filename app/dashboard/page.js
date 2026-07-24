'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [panels, setPanels]       = useState([]);
  const [balance, setBalance]     = useState(0);
  const [transactions, setTxns]   = useState([]);
  const router = useRouter();

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        await Promise.all([fetchPanels(), fetchWallet()]);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
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
    { label: 'Wallet Balance', value: `KSH ${parseFloat(balance).toLocaleString()}`, icon: '💳', color: '#3b82f6', href: '/wallet' },
    { label: 'Active Panels',  value: activePanels,                                   icon: '🖥️', color: '#10b981', href: '/products' },
    { label: 'Total Panels',   value: panels.length,                                  icon: '📊', color: '#8b5cf6', href: null },
    { label: 'Account',        value: 'Active',                                        icon: '✅', color: '#22c55e', href: null },
  ];

  return (
    <div className="min-h-screen py-8 sm:py-10" style={{ backgroundColor: '#0a0a0f' }}>
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
                <Link href={s.href} style={{ textDecoration: 'none' }}>
                  <StatInner s={s} />
                </Link>
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
                    style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a' }}>
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
                          {p.package_name} · KSH {parseFloat(p.package_price || 0).toLocaleString()}
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
                      <p className="text-xs" style={{ color: '#475569' }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right sidebar (1/3) ── */}
          <div className="space-y-5">
            {/* Wallet card */}
            <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm sm:text-base" style={{ color: '#f0f4ff' }}>Wallet</h2>
                <Link href="/wallet" className="text-xs" style={{ color: '#3b82f6', textDecoration: 'none' }}>Manage →</Link>
              </div>
              <p className="font-extrabold mb-1" style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', color: '#3b82f6' }}>
                KSH {parseFloat(balance).toLocaleString()}
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
                        {t.type === 'deposit' ? '+' : '-'}KSH {parseFloat(t.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Quick Links</p>
              <div className="space-y-2">
                {[
                  { label: 'Deploy Panel',      href: '/products',     icon: '🚀' },
                  { label: 'WhatsApp Bot',       href: '/whatsapp-bot', icon: '🤖' },
                  { label: 'Contact Support',    href: '/contact',      icon: '💬' },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={{ color: '#94a3b8', backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
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
