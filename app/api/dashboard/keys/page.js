'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CopyButton from '@/components/api/CopyButton';
import { ToastProvider, useToast } from '@/components/api/Toast';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleString();
}

function KeyGlyph() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#F2A93B' }}>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M10.7 12.3 21 2M15 8l3 3M18 5l3 3" />
    </svg>
  );
}

function KeysInner() {
  const router = useRouter();
  const toast = useToast();
  const [keys, setKeys] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newKey, setNewKey] = useState(null); // full key shown exactly once
  const [busyId, setBusyId] = useState(null);

  const loadKeys = useCallback(async () => {
    const res = await fetch('/api/api-keys');
    if (!res.ok) { setKeys([]); setLoading(false); return; }
    const data = await res.json();
    setKeys(data.keys);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.replace('/login?next=/api/dashboard/keys'); return; }
      loadKeys();
    }).catch(() => router.replace('/login?next=/api/dashboard/keys'));
  }, []);

  const createKey = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName || 'Default Key' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create key');
      setNewKey(data.key);
      setKeyName('');
      toast('API key created — store it securely!');
      await loadKeys();
    } catch (e) {
      toast(e.message, 'error');
    }
    setCreating(false);
  };

  const act = async (key, action, extra = {}) => {
    setBusyId(key.id);
    try {
      const res = await fetch(`/api/api-keys/${key.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      if (action === 'regenerate') {
        setNewKey(data.key);
        toast('New key generated — store it securely!');
      } else if (action === 'revoke') {
        toast(`Key "${key.name}" revoked`);
      } else if (action === 'restore') {
        toast(`Key "${key.name}" restored`);
      } else if (action === 'rename') {
        toast('Key renamed');
      }
      await loadKeys();
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusyId(null);
  };

  const removeKey = async (key) => {
    if (!confirm(`Delete API key "${key.name}"? This cannot be undone.`)) return;
    setBusyId(key.id);
    try {
      const res = await fetch(`/api/api-keys/${key.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete key');
      toast('API key deleted');
      await loadKeys();
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusyId(null);
  };

  if (loading) return (
    <div className="container-site py-24 text-center">
      <div className="spinner mx-auto mb-4" />
      <p className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A' }}>Loading API keys…</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)', minHeight: '70vh' }}>
      <section className="section" style={{ paddingTop: 64, paddingBottom: 110 }}>
        <div className="container-site max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="eyebrow">Credentials</p>
              <h1 className="headline mt-4" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)' }}>
                API keys<span className="accent">.</span>
              </h1>
              <p className="text-sm mt-3" style={{ color: '#79818A' }}>
                Generate, copy, revoke and rotate your API keys. Full keys are shown only once.
              </p>
            </div>
            <Link href="/api/dashboard" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A', textDecoration: 'none' }}>
              ← Back to dashboard
            </Link>
          </div>

          {/* Create */}
          <div className="card card-pad mb-10">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-4">
                <p className="mono text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: '#F2A93B' }}>New key</p>
                <h2 className="section-title text-xl" style={{ color: '#E9E7E2' }}>Create an API key</h2>
                <p className="text-sm mt-2" style={{ color: '#79818A' }}>
                  Give the key a name so you can identify it later. The full key is displayed once — store it securely.
                </p>
              </div>
              <div className="lg:col-span-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={keyName}
                    onChange={e => setKeyName(e.target.value)}
                    placeholder="e.g. WhatsApp Bot"
                    className="input flex-1"
                    onKeyDown={e => { if (e.key === 'Enter') createKey(); }}
                  />
                  <button onClick={createKey} disabled={creating}
                    className="btn btn-primary" style={{ opacity: creating ? 0.6 : 1, cursor: creating ? 'not-allowed' : 'pointer' }}>
                    {creating ? 'Creating…' : '+ Create API key'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Keys list */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1B2026' }}>
              <h2 className="section-title text-xl" style={{ color: '#E9E7E2' }}>Your keys</h2>
              <span className="tag">{keys.length} total</span>
            </div>
            {keys.length === 0 ? (
              <div className="py-16 text-center">
                <KeyGlyph />
                <p className="display font-bold text-lg mt-4 mb-1" style={{ color: '#E9E7E2' }}>No API keys yet</p>
                <p className="text-sm" style={{ color: '#79818A' }}>Create your first key above to start calling the API.</p>
              </div>
            ) : (
              <div className="scroll-x">
                <table className="table-plain table-responsive">
                  <thead>
                    <tr>
                      {['Name', 'Key', 'Plan', 'Status', 'Requests', 'Daily limit', 'Last used', 'Created', 'Expires', 'Actions'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map(k => (
                      <tr key={k.id} data-label="Name" style={{ opacity: k.status === 'revoked' ? 0.55 : 1 }}>
                        <td data-label="Name">
                          <p className="font-semibold" style={{ color: '#E9E7E2' }}>{k.name}</p>
                          <p className="mono text-[10px]" style={{ color: '#4C535B' }}>#{k.id}</p>
                        </td>
                        <td data-label="Key" className="mono text-[12px]" style={{ color: '#AEB5BD' }}>{k.prefix}</td>
                        <td data-label="Plan"><span className="tag tag-amber">{k.plan}</span></td>
                        <td data-label="Status">
                          <span className={`tag ${k.status === 'active' ? 'tag-green' : 'tag-red'}`}>{k.status}</span>
                        </td>
                        <td data-label="Requests">
                          <p className="mono text-[11px]" style={{ color: '#AEB5BD' }}>{k.total_requests.toLocaleString()} total</p>
                          <p className="mono text-[10px]" style={{ color: '#4C535B' }}>{k.requests_today.toLocaleString()} today</p>
                        </td>
                        <td data-label="Daily limit">
                          <p className="mono text-[11px]" style={{ color: '#AEB5BD' }}>{k.daily_limit < 0 ? '∞' : k.daily_limit.toLocaleString()}</p>
                          <p className="mono text-[10px]" style={{ color: k.remaining_today === 0 ? '#E5484D' : '#4C535B' }}>
                            {k.remaining_today < 0 ? 'unlimited' : `${k.remaining_today.toLocaleString()} left today`}
                          </p>
                        </td>
                        <td data-label="Last used" style={{ color: '#AEB5BD' }}>{fmtDate(k.last_used_at)}</td>
                        <td data-label="Created" style={{ color: '#79818A' }}>{fmtDate(k.created_at)}</td>
                        <td data-label="Expires" style={{ color: k.expires_at ? '#F2A93B' : '#79818A' }}>{fmtDate(k.expires_at)}</td>
                        <td data-label="Actions">
                          <div className="flex flex-wrap gap-1.5">
                            <button onClick={() => act(k, 'rename', { name: prompt('New key name:', k.name) || k.name })}
                              disabled={busyId === k.id}
                              className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em]"
                              style={{ border: '1px solid #262C33', color: '#AEB5BD', background: 'transparent', cursor: 'pointer' }}>
                              Rename
                            </button>
                            {k.status === 'active' ? (
                              <>
                                <button onClick={() => act(k, 'revoke')} disabled={busyId === k.id}
                                  className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em]"
                                  style={{ border: '1px solid rgba(229,72,77,0.4)', color: '#E5484D', background: 'transparent', cursor: 'pointer' }}>
                                  Revoke
                                </button>
                                <button onClick={() => act(k, 'regenerate')} disabled={busyId === k.id}
                                  className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em]"
                                  style={{ border: '1px solid rgba(242,169,59,0.4)', color: '#F2A93B', background: 'transparent', cursor: 'pointer' }}>
                                  Regenerate
                                </button>
                              </>
                            ) : (
                              <button onClick={() => act(k, 'restore')} disabled={busyId === k.id}
                                className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em]"
                                style={{ border: '1px solid rgba(62,207,142,0.4)', color: '#3ECF8E', background: 'transparent', cursor: 'pointer' }}>
                                Restore
                              </button>
                            )}
                            <button onClick={() => removeKey(k)} disabled={busyId === k.id}
                              className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em]"
                              style={{ border: '1px solid rgba(229,72,77,0.4)', color: '#E5484D', background: 'transparent', cursor: 'pointer' }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Full-key modal (shown exactly once) */}
          {newKey && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setNewKey(null)}>
              <div className="card card-pad w-full max-w-lg" style={{ background: '#0F1215' }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-2">
                  <KeyGlyph />
                  <div>
                    <h3 className="display font-bold text-lg" style={{ color: '#E9E7E2' }}>Your new API key</h3>
                    <p className="mono text-[10px] uppercase tracking-[0.14em] mt-0.5" style={{ color: '#F2A93B' }}>
                      Store this key securely — shown once
                    </p>
                  </div>
                </div>
                <p className="text-xs mb-5" style={{ color: '#79818A' }}>
                  For security reasons, it will never be shown again.
                </p>
                <div className="flex items-center gap-2 mb-6">
                  <code className="mono flex-1 px-3 py-2.5 text-xs break-all"
                    style={{ background: '#14181D', border: '1px solid rgba(242,169,59,0.4)', color: '#F2A93B' }}>
                    {newKey}
                  </code>
                  <CopyButton text={newKey} label="Copy" />
                </div>
                <button onClick={() => setNewKey(null)}
                  className="btn btn-primary w-full" style={{ cursor: 'pointer' }}>
                  I&apos;ve saved my key
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ApiKeysPage() {
  return (
    <ToastProvider>
      <KeysInner />
    </ToastProvider>
  );
}
