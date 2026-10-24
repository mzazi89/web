'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { AppBackground, Button, Field, Input, Alert, ThemeToggle, Icons } from '@/components/ui';
import { safeNext, authHref } from '@/lib/nextPath';

// MZAZI TECH — sign in.
// Deliberately minimal: brand, welcome, two fields, one button, one link.
// Behaviour is unchanged from v1 (same endpoints, same redirects).

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Where to land after signing in. Set from ?next=, which is how a visitor who
  // hit a sign-in wall on /devices gets back to /devices instead of the
  // dashboard. Reads window rather than useSearchParams so this page stays a
  // plain static client route.
  const [next, setNext] = useState('/dashboard');
  useEffect(() => {
    setNext(safeNext(new URLSearchParams(window.location.search).get('next')));
  }, []);

  // Already signed in? Skip straight to where they were headed.
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => { if (r.ok) router.replace(next); })
      .catch(() => {});
  }, [router, next]);

  // Returned from a password reset?
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'ok') {
      setNotice('Your password was reset. Sign in with your new password.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        router.push(next);
        router.refresh();
      } else {
        setError(data.error || 'That email and password do not match. Please try again.');
      }
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground variant="auth" style={{ minHeight: 'calc(100vh - var(--nav-h))', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 16px' }}>
        <ThemeToggle />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px 48px' }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="anim-fade-up">
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <Link href="/" aria-label="MZAZI TECH home" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <Logo size={44} />
            </Link>
            <h1 className="headline" style={{ fontSize: 'clamp(1.6rem, 5vw, 2rem)', marginTop: 20, marginBottom: 0 }}>
              Welcome back
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14.5, color: 'var(--muted)' }}>
              Sign in to manage your bots, devices and payments.
            </p>
          </div>

          <div className="card card-pad">
            {notice && (
              <Alert kind="success" className="mb-4" style={{ marginBottom: 16 }}>{notice}</Alert>
            )}
            {error && (
              <Alert kind="error" className="mb-4" style={{ marginBottom: 16 }}>{error}</Alert>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <Field label="Email address" id="login-email">
                <Input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>

              <Field label="Password" id="login-password">
                <Input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                />
              </Field>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6, marginBottom: 18 }}>
                <Link href="/forgot-password" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                loading={loading}
                loadingText="Signing in…"
                disabled={!email || !password}
              >
                Sign in
              </Button>
            </form>
          </div>

          <p style={{ marginTop: 22, textAlign: 'center', fontSize: 14.5, color: 'var(--muted)' }}>
            No account?{' '}
            <Link href={authHref(next, { signup: true })} style={{ fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
              Create one free
            </Link>
          </p>

          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 12.5, color: 'var(--dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icons.Shield size={13} />
            Secured connection · your details are never shared
          </p>
        </div>
      </div>
    </AppBackground>
  );
}
