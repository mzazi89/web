'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function WalletPage() {
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
    checkAuth();
    // Handle Paystack callback messages
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold" style={{ color: '#f0f4ff' }}>My Wallet</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748b' }}>Deposit funds and use them to deploy panels instantly</p>
        </div>

        {/* Alert */}
        {message && (
          <div className="mb-6 p-4 rounded-xl text-sm" style={{
            backgroundColor: message.type === 'success' ? 'rgba(34,197,94,0.1)' : message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
            color: message.type === 'success' ? '#4ade80' : message.type === 'error' ? '#f87171' : '#60a5fa',
          }}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Balance Card */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs" style={{ color: '#64748b' }}>Available Balance</p>
                <p className="text-3xl font-extrabold" style={{ color: '#3b82f6' }}>KSH {balance.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl mb-4" style={{ backgroundColor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
              <p className="text-xs" style={{ color: '#64748b' }}>
                💡 Your wallet balance is deducted automatically when you create a new panel. Top up before deploying.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Starter Panel', cost: 50 },
                { label: 'Standard Panel', cost: 75 },
                { label: 'Premium Panel', cost: 100 },
                { label: 'Ultimate Panel', cost: 120 },
              ].map(pkg => (
                <div key={pkg.label} className="flex justify-between text-xs" style={{ color: '#64748b' }}>
                  <span>{pkg.label}</span>
                  <span style={{ color: balance >= pkg.cost ? '#4ade80' : '#f87171' }}>
                    {balance >= pkg.cost ? '✓' : '✗'} KSH {pkg.cost}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deposit Form */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
            <h2 className="text-lg font-bold mb-6" style={{ color: '#f0f4ff' }}>Top Up Wallet</h2>

            {/* Quick amounts */}
            <div className="mb-5">
              <p className="text-xs font-medium mb-3" style={{ color: '#64748b' }}>Quick amounts (KSH)</p>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map(amt => (
                  <button key={amt}
                    onClick={() => setDepositAmount(amt.toString())}
                    className="py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: depositAmount === amt.toString() ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.1)',
                      border: depositAmount === amt.toString() ? '1px solid #2563eb' : '1px solid rgba(37,99,235,0.2)',
                      color: '#60a5fa',
                    }}>
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleDeposit}>
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Custom Amount (KSH)</label>
                <input
                  type="number"
                  min="10"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                  placeholder="Enter amount (min KSH 10)"
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#1e2d4a'}
                />
              </div>

              <button type="submit" disabled={depositing}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
                style={{ background: depositing ? '#1e2d4a' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', cursor: depositing ? 'not-allowed' : 'pointer' }}>
                {depositing ? 'Redirecting to Paystack...' : `Deposit ${depositAmount ? `KSH ${parseFloat(depositAmount).toLocaleString()}` : 'Now'}`}
              </button>

              <p className="text-center text-xs mt-3" style={{ color: '#475569' }}>
                🔒 Secure payment via Paystack · M-Pesa & Cards accepted
              </p>
            </form>
          </div>
        </div>

        {/* Transactions */}
        <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
          <h2 className="text-lg font-bold mb-6" style={{ color: '#f0f4ff' }}>Transaction History</h2>
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
                    {['Date', 'Description', 'Type', 'Amount', 'Status'].map(h => (
                      <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(30,45,74,0.5)' }}>
                      <td className="py-3 pr-4 text-xs" style={{ color: '#64748b' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="py-3 pr-4" style={{ color: '#cbd5e1' }}>{t.description || t.type}</td>
                      <td className="py-3 pr-4">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          backgroundColor: t.type === 'deposit' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: t.type === 'deposit' ? '#4ade80' : '#f87171',
                          border: `1px solid ${t.type === 'deposit' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-semibold" style={{ color: t.type === 'deposit' ? '#4ade80' : '#f87171' }}>
                        {t.type === 'deposit' ? '+' : '-'}KSH {parseFloat(t.amount).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          backgroundColor: t.status === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                          color: t.status === 'success' ? '#4ade80' : '#facc15',
                        }}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
