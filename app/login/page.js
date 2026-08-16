'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Already logged in? Redirect to the dashboard.
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => { if (r.ok) router.replace('/dashboard'); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Login failed. Check your credentials.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show a message if redirected back with a status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'ok') {
      setError('Your password was reset. Sign in with your new password.');
    }
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center py-12 px-5">
      <div className="container-site grid lg:grid-cols-2 gap-12 items-center w-full">
        {/* Form side */}
        <div className="max-w-md w-full">
          <p className="eyebrow">Account access</p>
          <h1 className="headline mt-4" style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.4rem)' }}>
            Welcome back<span className="accent">.</span>
          </h1>
          <p className="text-sm mt-2 mb-8" style={{ color: '#79818A' }}>
            Sign in to manage panels, devices and your wallet.
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 text-sm" style={{ background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.3)', color: '#E5484D' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label" style={{ marginBottom: 0 }}>Password</label>
                <Link href="/forgot-password" className="mono text-[10px] uppercase tracking-[0.1em]" style={{ color: '#79818A', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Your password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-sm" style={{ color: '#79818A' }}>
            No account?{' '}
            <Link href="/signup" className="link">Create one free</Link>
          </p>
        </div>

        {/* Editorial rail */}
        <div className="hidden lg:block">
          <div className="card p-10 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #14181D 0%, #0F1215 100%)' }}>
            <div aria-hidden="true" className="absolute -top-20 -right-20 w-72 h-72 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(242,169,59,0.10) 0%, transparent 65%)' }} />
            <Logo size={40} />
            <p className="display text-2xl font-bold leading-snug mt-8" style={{ color: '#E9E7E2' }}>
              One account for panels, bots and APIs<span className="accent">.</span>
            </p>
            <p className="text-sm leading-relaxed mt-4 mb-10" style={{ color: '#79818A' }}>
              Everything you buy, deploy and connect lives under one login — with a wallet that
              makes payment instant.
            </p>
            <div className="space-y-0" style={{ borderTop: '1px solid #1B2026' }}>
              {[
                { k: 'Panels', v: 'Deploy in under 2 minutes' },
                { k: 'Devices', v: 'Linked from WhatsApp or Telegram' },
                { k: 'Wallet', v: 'KES balance, Paystack top-ups' },
                { k: 'API', v: 'Keys, usage and docs in one place' },
              ].map(r => (
                <div key={r.k} className="flex items-baseline justify-between gap-6 py-3.5" style={{ borderBottom: '1px solid #1B2026' }}>
                  <span className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: '#F2A93B' }}>{r.k}</span>
                  <span className="text-[13px] text-right" style={{ color: '#AEB5BD' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
