'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Separate component so useSearchParams() is inside a Suspense boundary
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

          {/* Deposit Form */}
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
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#0a0a0f',
                    border: '1px solid #1e2d4a',
                    color: '#f0f4ff',
                    focusRingColor: '#3b82f6',
                  }}
                  required
                />
              </div>

              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2 mb-4">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(String(amt))}
                    className="text-xs px-3 py-1 rounded-lg transition-colors"
                    style={{
                      backgroundColor: depositAmount === String(amt) ? '#2563eb' : '#1e2d4a',
                      color: depositAmount === String(amt) ? '#fff' : '#94a3b8',
                      border: '1px solid #1e2d4a',
                    }}
                  >
                    KSH {amt}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={depositing}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity"
                style={{ backgroundColor: '#2563eb', color: '#fff', opacity: depositing ? 0.7 : 1 }}
              >
                {depositing ? 'Redirecting to Paystack...' : 'Deposit via Paystack'}
              </button>
            </form>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-8 rounded-2xl p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: '#475569' }}>Transaction History</p>

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
