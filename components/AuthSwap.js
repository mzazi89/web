'use client';
import { useEffect, useState } from 'react';

// Shows `signedOut` content only when the user is NOT logged in;
// shows `signedIn` content (default: null) once the session is confirmed.
export default function AuthSwap({ signedOut, signedIn = null }) {
  const [auth, setAuth] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => { if (!cancelled) setAuth(r.ok ? 'in' : 'out'); })
      .catch(() => { if (!cancelled) setAuth('out'); });
    return () => { cancelled = true; };
  }, []);

  if (auth === 'loading') return null;
  return auth === 'out' ? signedOut : signedIn;
}
