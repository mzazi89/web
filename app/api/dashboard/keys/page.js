'use client';
import { useState, useEffect, useCallback } from 'react';
import TypingHeading from '@/components/TypingHeading';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CopyButton from '@/components/api/CopyButton';
import { ToastProvider, useToast } from '@/components/api/Toast';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleString();
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
      <p className="text-sm" style={{ color: '#64748b' }}>Loading API keys…</p>
    </div>
  );

  return (
    <div className="container-site py-12" style={{ minHeight: '70vh' }}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold"><TypingHeading as="span" text="API Keys" speed={45} className="gradient-text" /></h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            Generate, copy, revoke and rotate your API keys. Full keys are shown only once.
          </p>
        </div>
        <Link href="/api/dashboard" className="text-xs font-semibold" style={{ color: '#60a5fa', textDecoration: 'none' }}>
          ← Back to dashboard
        </Link>
      </div>

      {/* Create */}
      <div className="card p-6 mb-8">
        <h2 className="font-bold mb-1" style={{ color: '#f0f4ff' }}>CREATE API KEY</h2>
        <p className="text-xs mb-4" style={{ color: '#64748b' }}>Give the key a name so you can identify it later.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={keyName}
            onChange={e => setKeyName(e.target.value)}
            placeholder="e.g. WhatsApp Bot"
            className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'rgba(2,4,9,0.45)', border: '1px solid #1e3a8a', color: '#f0f4ff' }}
            onKeyDown={e => { if (e.key === 'Enter') createKey(); }}
          />
          <button onClick={createKey} disabled={creating}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', opacity: creating ? 0.6 : 1, cursor: creating ? 'not-allowed' : 'pointer' }}>
            {creating ? 'CREATING…' : '+ CREATE API KEY'}
          </button>
        </div>
      </div>

      {/* Keys list */}
      <div className="card overflow-hidden">
        {keys.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-3">🔑</p>
            <p className="text-sm font-semibold mb-1" style={{ color: '#f0f4ff' }}>No API keys yet</p>
            <p className="text-xs mb-4" style={{ color: '#64748b' }}>Create your first key above to start calling the API.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#060b16', borderBottom: '1px solid #1e3a8a' }}>
                  {['Name', 'Key', 'Plan', 'Status', 'Requests', 'Daily Limit', 'Last Used', 'Created', 'Expires', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} style={{ borderBottom: '1px solid #060b16', opacity: k.status === 'revoked' ? 0.55 : 1 }}>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold" style={{ color: '#f0f4ff' }}>{k.name}</p>
                      <p className="text-[10px] font-mono" style={{ color: '#475569' }}>#{k.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs" style={{ color: '#94a3b8' }}>{k.prefix}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(37,99,235,0.12)', color: '#60a5fa' }}>
                        {k.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold" style={{ color: k.status === 'active' ? '#4ade80' : '#f87171' }}>
                        {k.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs" style={{ color: '#94a3b8' }}>{k.total_requests.toLocaleString()} total</p>
                      <p className="text-[10px]" style={{ color: '#64748b' }}>{k.requests_today.toLocaleString()} today</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs" style={{ color: '#94a3b8' }}>{k.daily_limit < 0 ? '∞' : k.daily_limit.toLocaleString()}</p>
                      <p className="text-[10px]" style={{ color: k.remaining_today === 0 ? '#f87171' : '#64748b' }}>
                        {k.remaining_today < 0 ? 'unlimited' : `${k.remaining_today.toLocaleString()} left today`}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{fmtDate(k.last_used_at)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>{fmtDate(k.created_at)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: k.expires_at ? '#fbbf24' : '#64748b' }}>
                      {fmtDate(k.expires_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => act(k, 'rename', { name: prompt('New key name:', k.name) || k.name })}
                          disabled={busyId === k.id}
                          className="px-2 py-1 rounded-md text-[11px] font-semibold"
                          style={{ border: '1px solid #1e3a8a', color: '#94a3b8', cursor: 'pointer' }}>
                          Rename
                        </button>
                        {k.status === 'active' ? (
                          <>
                            <button onClick={() => act(k, 'revoke')} disabled={busyId === k.id}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold"
                              style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', cursor: 'pointer' }}>
                              Revoke
                            </button>
                            <button onClick={() => act(k, 'regenerate')} disabled={busyId === k.id}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold"
                              style={{ border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', cursor: 'pointer' }}>
                              Regenerate
                            </button>
                          </>
                        ) : (
                          <button onClick={() => act(k, 'restore')} disabled={busyId === k.id}
                            className="px-2 py-1 rounded-md text-[11px] font-semibold"
                            style={{ border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', cursor: 'pointer' }}>
                            Restore
                          </button>
                        )}
                        <button onClick={() => removeKey(k)} disabled={busyId === k.id}
                          className="px-2 py-1 rounded-md text-[11px] font-semibold"
                          style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', cursor: 'pointer' }}>
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
          <div className="card p-6 w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-1" style={{ color: '#f0f4ff' }}>🔑 Your new API key</h3>
            <p className="text-xs mb-4" style={{ color: '#fbbf24' }}>
              Store this key securely. For security reasons, it will never be shown again.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <code className="flex-1 px-3 py-2.5 rounded-lg text-xs font-mono break-all"
                style={{ backgroundColor: 'rgba(2,4,9,0.45)', border: '1px solid #1e3a8a', color: '#93c5fd' }}>
                {newKey}
              </code>
              <CopyButton text={newKey} label="Copy" />
            </div>
            <button onClick={() => setNewKey(null)}
              className="w-full py-2.5 rounded-lg text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: 'pointer' }}>
              I've saved my key
            </button>
          </div>
        </div>
      )}
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
