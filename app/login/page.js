'use client';
import React, { useState, useEffect } from 'react';
import TypingHeading from '@/components/TypingHeading';
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: 'rgba(2,4,9,0.92)' }}>
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#060b16', border: '1px solid #1e3a8a', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex justify-center">
              <Logo size={56} />
            </div>
            <TypingHeading as="h2" text="Welcome back" speed={55} className="text-2xl font-extrabold" style={{ color: '#f0f4ff' }} />
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Sign in to your MZAZI TECH account</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm transition-all outline-none"
                style={{ backgroundColor: '#02040a', border: '1px solid #1e3a8a', color: '#f0f4ff' }}
                placeholder="you@example.com"
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#1e3a8a'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm transition-all outline-none"
                style={{ backgroundColor: '#02040a', border: '1px solid #1e3a8a', color: '#f0f4ff' }}
                placeholder="Your password"
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#1e3a8a'}
              />
              <div className="text-right mt-1.5">
                <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: '#60a5fa' }}>
                  Forgot password?
                </Link>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
              style={{ background: loading ? '#1e3a8a' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span>Signing in...</span>
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: '#64748b' }}>
            No account?{' '}
            <Link href="/signup" className="font-semibold hover:underline" style={{ color: '#3b82f6' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
