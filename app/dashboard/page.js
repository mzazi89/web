'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panels, setPanels] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

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
      if (res.ok) {
        const data = await res.json();
        setPanels(data.panels || []);
      }
    } catch {}
  };

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/wallet/balance');
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance || 0);
        setTransactions(data.transactions || []);
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-blue-500 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
          <p style={{ color: '#64748b' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Wallet Balance', value: `KSH ${walletBalance.toLocaleString()}`, icon: '💳', color: '#3b82f6', href: '/wallet' },
    { label: 'Active Panels', value: panels.filter(p => p.status === 'active').length, icon: '🖥️', color: '#10b981', href: '/products' },
    { label: 'Total Panels', value: panels.length, icon: '📊', color: '#8b5cf6', href: null },
    { label: 'Account Status', value: 'Active', icon: '✅', color: '#22c55e', href: null },
  ];

  return (
    <div className="min-h-screen py-10" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: '#f0f4ff' }}>
              Welcome back, <span style={{ color: '#3b82f6' }}>{user?.firstname || user?.fullname?.split(' ')[0]}</span>
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>{user?.email}</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Link href="/wallet" className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>
              + Top Up Wallet
            </Link>
            <Link href="/products" className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              + New Panel
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {stats.map(s => (
            <div key={s.label} className="p-5 rounded-2xl transition-all" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{s.icon}</span>
                {s.href && (
                  <Link href={s.href} className="text-xs" style={{ color: '#3b82f6' }}>View →</Link>
                )}
              </div>
              <div className="text-2xl font-extrabold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: '#64748b' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panels list */}
          <div className="lg:col-span-2 rounded-2xl p-6" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold" style={{ color: '#f0f4ff' }}>My Panels</h2>
              <Link href="/products" className="text-sm font-semibold" style={{ color: '#3b82f6' }}>
                + Deploy New
              </Link>
            </div>

            {panels.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🖥️</div>
                <p className="font-semibold mb-2" style={{ color: '#94a3b8' }}>No panels yet</p>
                <p className="text-sm mb-6" style={{ color: '#475569' }}>Deploy your first Pterodactyl panel to get started</p>
                <Link href="/products" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white inline-block"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                  View Plans
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {panels.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a' }}>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold" style={{ color: '#f0f4ff' }}>{p.ptero_username}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                        {p.package_name} — KSH {p.package_price}/month
                      </p>
                    </div>
                    <a href={`${process.env.NEXT_PUBLIC_PTERO_URL || 'https://public.mzazi.shop'}`} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>
                      Open Panel →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wallet & Transactions */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#f0f4ff' }}>Wallet</h2>
              <Link href="/wallet" className="text-sm font-semibold" style={{ color: '#3b82f6' }}>Manage</Link>
            </div>

            <div className="p-4 rounded-xl mb-6" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(29,78,216,0.1))', border: '1px solid rgba(37,99,235,0.3)' }}>
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>Available Balance</p>
              <p className="text-3xl font-extrabold" style={{ color: '#60a5fa' }}>KSH {walletBalance.toLocaleString()}</p>
            </div>

            <Link href="/wallet" className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white mb-6 transition-all"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              Deposit Funds
            </Link>

            <h3 className="text-sm font-semibold mb-3" style={{ color: '#94a3b8' }}>Recent Activity</h3>
            {transactions.length === 0 ? (
              <p className="text-xs" style={{ color: '#475569' }}>No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex justify-between items-center text-xs">
                    <div>
                      <p style={{ color: '#cbd5e1' }}>{t.description || t.type}</p>
                      <p style={{ color: '#475569' }}>{new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                    <span style={{ color: t.type === 'deposit' ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                      {t.type === 'deposit' ? '+' : '-'}KSH {parseFloat(t.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
