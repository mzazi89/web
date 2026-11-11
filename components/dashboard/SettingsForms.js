'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/ui';

// MZAZI TECH — account settings forms.
// Two endpoints, both server-side validated: /api/account/profile and
// /api/account/password (which re-checks the current password before changing
// anything, so a borrowed session cannot take the account over).

function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const send = async (url, payload) => {
    setBusy(true); setError(''); setOk('');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'That did not work. Please try again.');
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, ok, setOk, setError, send };
}

export function ProfileForm({ user }) {
  const [firstname, setFirstname] = useState(user.firstname || '');
  const [lastname, setLastname] = useState(user.lastname || '');
  const { busy, error, ok, setOk, send } = useSubmit();
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    const data = await send('/api/account/profile', { firstname, lastname });
    if (data) { setOk('Profile saved.'); router.refresh(); }
  };

  return (
    <form onSubmit={submit} className="form-grid">
      <label className="field">
        <span className="field-label">First name</span>
        <input className="input" value={firstname} onChange={(e) => setFirstname(e.target.value)} maxLength={40} required />
      </label>
      <label className="field">
        <span className="field-label">Last name</span>
        <input className="input" value={lastname} onChange={(e) => setLastname(e.target.value)} maxLength={40} />
      </label>
      <label className="field" style={{ gridColumn: '1 / -1' }}>
        <span className="field-label">Email</span>
        <input className="input" value={user.email || ''} readOnly disabled />
        <span className="field-hint">Email changes go through support so the account cannot be moved without verification.</span>
      </label>

      {error && <p className="form-note is-bad" role="alert">{error}</p>}
      {ok && <p className="form-note is-good" role="status">{ok}</p>}

      <div style={{ gridColumn: '1 / -1' }}>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const { busy, error, ok, setOk, setError, send } = useSubmit();

  const submit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError('The two new passwords do not match.'); return; }
    const data = await send('/api/account/password', { currentPassword, newPassword });
    if (data) { setOk('Password updated. Use it next time you sign in.'); setCurrent(''); setNext(''); setConfirm(''); }
  };

  return (
    <form onSubmit={submit} className="form-grid">
      <label className="field" style={{ gridColumn: '1 / -1' }}>
        <span className="field-label">Current password</span>
        <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
      </label>
      <label className="field">
        <span className="field-label">New password</span>
        <input className="input" type="password" value={newPassword} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={6} required />
      </label>
      <label className="field">
        <span className="field-label">Confirm new password</span>
        <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" minLength={6} required />
      </label>

      {error && <p className="form-note is-bad" role="alert">{error}</p>}
      {ok && <p className="form-note is-good" role="status">{ok}</p>}

      <div style={{ gridColumn: '1 / -1' }} className="row-between">
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
        <a href="/forgot-password" className="dash-mini-link">Forgot current password?</a>
      </div>
    </form>
  );
}

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const signOut = async () => {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch {
      setBusy(false);
    }
  };

  return (
    <button type="button" className="btn btn-ghost" onClick={signOut} disabled={busy}>
      <Icons.LogOut size={14} /> {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
