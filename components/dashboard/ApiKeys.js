'use client';

import { useState } from 'react';
import { Icons } from '@/components/ui';
import { Status } from './Parts';

// MZAZI TECH — API key controls.
//
// The raw key is displayed exactly once, in this component's state, and never
// written anywhere else. Rotation revokes the old hash and issues a new one, so
// a leaked key stops working the moment the owner presses the button.

export default function ApiKeys({ initial }) {
  const [keys, setKeys] = useState(initial || []);
  const [name, setName] = useState('');
  const [revealed, setRevealed] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const refresh = async () => {
    const res = await fetch('/api/api-keys', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.keys)) setKeys(data.keys);
  };

  const call = async (label, fn) => {
    setBusy(label); setError(''); setNote('');
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'That did not work. Please try again.');
      await refresh();
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy('');
    }
  };

  const create = async (e) => {
    e.preventDefault();
    const data = await call('create', () => fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name.trim() || 'Default Key' }),
    }));
    if (data?.key) { setRevealed(data.key); setName(''); setNote('Key created.'); }
  };

  const regenerate = async (id) => {
    if (!confirm('Regenerate this key? The current secret stops working immediately.')) return;
    const data = await call(`regen-${id}`, () => fetch(`/api/api-keys/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'regenerate' }),
    }));
    if (data?.key) { setRevealed(data.key); setNote('New key issued. The old one is revoked.'); }
  };

  const revoke = async (id) => {
    if (!confirm('Revoke this key? Any app using it will start failing.')) return;
    await call(`revoke-${id}`, () => fetch(`/api/api-keys/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'revoke' }),
    }));
    setNote('Key revoked.');
  };

  const restore = async (id) => {
    await call(`restore-${id}`, () => fetch(`/api/api-keys/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'restore' }),
    }));
    setNote('Key restored.');
  };

  return (
    <div>
      <form onSubmit={create} className="key-form">
        <input
          className="input"
          placeholder="Key name — e.g. production-billing"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          aria-label="New API key name"
        />
        <button type="submit" className="btn btn-primary" disabled={busy === 'create'}>
          {busy === 'create' ? 'Creating…' : <><Icons.Plus size={14} /> Create key</>}
        </button>
      </form>

      {error && <p className="form-note is-bad" role="alert">{error}</p>}
      {note && !revealed && <p className="form-note is-good" role="status">{note}</p>}

      {revealed && (
        <div className="key-reveal" role="alert">
          <p className="key-reveal-title"><Icons.Key size={14} /> Copy this key now — it is shown once</p>
          <code>{revealed}</code>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(revealed)}>Copy</button>
            <button type="button" className="btn btn-ghost" onClick={() => setRevealed(null)}>I have it</button>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <p className="dash-panel-sub" style={{ marginTop: 12 }}>No keys yet — create one above to start calling the API.</p>
      ) : keys.map((k) => (
        <div className="key-row" key={k.id}>
          <div style={{ minWidth: 0 }}>
            <p className="key-name">{k.name}</p>
            <p className="key-meta">
              <code>{k.key_prefix}</code> · {k.plan || 'FREE'} ·{' '}
              {k.last_used_at ? `last used ${new Date(k.last_used_at).toLocaleDateString('en-KE')}` : 'never used'}
            </p>
          </div>
          <div className="key-actions">
            <Status value={k.status} />
            {String(k.status).toLowerCase() === 'active' ? (
              <>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => regenerate(k.id)} disabled={!!busy}>
                  {busy === `regen-${k.id}` ? 'Working…' : 'Regenerate'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--bad)' }} onClick={() => revoke(k.id)} disabled={!!busy}>
                  Revoke
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => restore(k.id)} disabled={!!busy}>
                {busy === `restore-${k.id}` ? 'Working…' : 'Restore'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
