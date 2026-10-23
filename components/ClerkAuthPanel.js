'use client';

// Clerk's sign-in / sign-up surface plus the hand-off to the app's own session.
//
// Clerk finishes authentication in its own UI; this component then calls
// /api/auth/clerk-sync, which resolves the Clerk user to a `users` row and sets
// the `token` cookie every protected route already understands. Only after that
// succeeds do we navigate to the dashboard.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn, SignUp, useAuth } from '@clerk/nextjs';
import { CLERK_APPEARANCE } from '@/lib/clerk';

export default function ClerkAuthPanel({ mode = 'sign-in' }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;
    setSyncing(true);

    (async () => {
      try {
        const res = await fetch('/api/auth/clerk-sync', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not finish signing you in.');
        if (!cancelled) router.replace('/dashboard');
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not finish signing you in.');
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, router]);

  return (
    <div style={{ display: 'grid', gap: 14, justifyItems: 'center' }}>
      {error && (
        <div className="alert alert-danger" role="alert" style={{ width: '100%' }}>
          {error}
        </div>
      )}
      {syncing && !error && (
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>Signing you in…</p>
      )}

      {mode === 'sign-up' ? (
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          afterSignUpUrl="/dashboard"
          appearance={CLERK_APPEARANCE}
        />
      ) : (
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          afterSignInUrl="/dashboard"
          appearance={CLERK_APPEARANCE}
        />
      )}
    </div>
  );
}
