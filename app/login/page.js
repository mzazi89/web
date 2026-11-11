'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/AuthShell';
import { Button, Field, Input, Alert, Icons, VerdictOverlay } from '@/components/ui';
import { safeNext, authHref } from '@/lib/nextPath';

// MZAZI TECH — sign in.
// Behaviour is unchanged (same endpoint, same redirect targets): what changed is
// the answer. A wrong password gets a cross, a correct one gets a tick, and the
// form gets out of the way while it happens.

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState(null);
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

  const succeeded = verdict?.status === 'success';

  // The overlay carries the headline; the alert underneath keeps the server's
  // exact wording, so it is still on screen once the mark fades.
  const fail = (message, detail) => {
    setError(detail);
    setVerdict({ id: Date.now(), status: 'error', message });
  };

  const dismissVerdict = () => setVerdict(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || succeeded) return;
    setError('');
    setNotice('');
    setVerdict(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setVerdict({ id: Date.now(), status: 'success', message: 'Signed in' });
        window.setTimeout(() => {
          router.push(next);
          router.refresh();
        }, 850);
        return;
      }

      const detail = data.error || 'That email and password do not match. Please try again.';
      // 401/403 is the "these credentials are wrong" case — worth naming, since
      // that is the one a person can actually fix by retyping.
      const wrongPassword = response.status === 401 || response.status === 403;
      fail(wrongPassword ? 'Wrong password' : 'Sign-in failed', detail);
    } catch {
      fail('Connection lost', 'We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your bots, devices and payments."
      maxWidth={400}
      footer={(
        <>
          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13.5, color: 'var(--muted)' }}>
            No account?{' '}
            <Link href={authHref(next, { signup: true })} style={{ fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
              Create one free
            </Link>
          </p>

          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: 'var(--dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icons.Shield size={13} />
            Secured connection · your details are never shared
          </p>
        </>
      )}
    >
      <div className="card card-pad auth-card">
        <VerdictOverlay
          verdict={verdict}
          ttl={verdict?.status === 'error' ? 2000 : 0}
          onDone={dismissVerdict}
        />

        {notice && <Alert kind="success" style={{ marginBottom: 16 }}>{notice}</Alert>}
        {error && <Alert kind="error" style={{ marginBottom: 16 }}>{error}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Email address" id="login-email">
            <Input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading || succeeded}
            />
          </Field>

          <Field label="Password" id="login-password">
            <div className="pw-wrap">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                disabled={loading || succeeded}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                tabIndex={0}
              >
                {showPassword ? <Icons.EyeOff size={17} /> : <Icons.Eye size={17} />}
              </button>
            </div>
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6, marginBottom: 18 }}>
            <Link href="/forgot-password" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none' }}>
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
            disabled={!email || !password || succeeded}
          >
            Sign in
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
