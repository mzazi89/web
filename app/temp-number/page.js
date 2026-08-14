'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import TypingHeading from '@/components/TypingHeading';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://mzazi.shop';

const PROVIDERS = [
  { id: 'receive-sms-online', label: 'Receive SMS Online', country: 'Sweden' },
  { id: 'hs3x', label: 'HS3X', country: 'USA' },
  { id: 'receive-smss', label: 'Receive-SMSS', country: '—' },
  { id: 'sms24', label: 'SMS24', country: '—' },
  { id: 'receivesms', label: 'ReceiveSMS.co', country: '—' },
  { id: 'smstome', label: 'SMS to Me', country: '—' },
];

const FLAGS = { Sweden: '🇸🇪', USA: '🇺🇸', UK: '🇬🇧', Germany: '🇩🇪', France: '🇫🇷', Spain: '🇪🇸', Nigeria: '🇳🇬', Kenya: '🇰🇪', India: '🇮🇳', Brazil: '🇧🇷', 'Unknown': '🌐' };

function pick(obj, keys, fallback = null) {
  if (!obj || typeof obj !== 'object') return fallback;
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  return fallback;
}

export default function TempNumberPage() {
  const [provider, setProvider] = useState('receive-sms-online');
  const [numbers, setNumbers] = useState(null);       // array or null
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [selected, setSelected] = useState(null);     // number object
  const [messages, setMessages] = useState(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [auto, setAuto] = useState(false);
  const [status, setStatus] = useState(null);         // {type, text}
  const [lastCheck, setLastCheck] = useState(null);
  const timerRef = useRef(null);

  const showStatus = (type, text) => setStatus({ type, text });

  const fetchNumbers = async () => {
    setLoadingNumbers(true);
    setNumbers(null);
    setSelected(null);
    setMessages(null);
    setStatus(null);
    const started = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/temp-number?action=numbers&provider=${provider}`, { cache: 'no-store' });
      const d = await res.json();
      if (!res.ok) {
        showStatus('error', `${d.error || 'Error'}: ${d.message || res.status}`);
        return;
      }
      const list = d.result?.numbers || [];
      setNumbers(list);
      showStatus('success', `${list.length} number${list.length !== 1 ? 's' : ''} found · ${Date.now() - started}ms`);
    } catch (e) {
      showStatus('error', `Request failed: ${e.message}`);
    } finally { setLoadingNumbers(false); }
  };

  const fetchMessages = useCallback(async (num) => {
    setLoadingMsgs(true);
    const started = Date.now();
    try {
      const number = num || selected;
      if (!number) return;
      const raw = typeof number === 'string' ? number : (number.number || number.slug || '');
      const res = await fetch(`${BASE_URL}/api/temp-number?action=inbox&provider=${provider}&number=${encodeURIComponent(raw)}`, { cache: 'no-store' });
      const d = await res.json();
      if (!res.ok) {
        showStatus('error', `${d.error || 'Error'}: ${d.message || res.status}`);
        return;
      }
      setMessages(d.result?.messages || []);
      setLastCheck(new Date());
    } catch (e) {
      showStatus('error', `Request failed: ${e.message}`);
    } finally { setLoadingMsgs(false); }
  }, [provider, selected]);

  // auto-refresh poll
  useEffect(() => {
    if (auto && selected) {
      timerRef.current = setInterval(() => fetchMessages(), 12000);
      return () => clearInterval(timerRef.current);
    }
  }, [auto, selected, fetchMessages]);

  const msgFrom = (m) => pick(m, ['from', 'sender', 'phone', 'number', 'sender_name'], 'Unknown');
  const msgText = (m) => pick(m, ['text', 'message', 'body', 'content'], '');
  const msgTime = (m) => pick(m, ['time', 'date', 'received_at', 'timestamp'], null);

  return (
    <div className="container-site py-12" style={{ minHeight: '70vh' }}>
      <div className="mb-8">
        <a href="/api" className="text-xs font-semibold" style={{ color: '#475569', textDecoration: 'none' }}>← Back to API</a>
        <h1 className="text-3xl font-extrabold mt-2"><TypingHeading as="span" text="Temporary Phone Numbers" speed={45} className="gradient-text" /></h1>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          Get a temporary virtual number and read its SMS messages right here — no phone needed.
        </p>
      </div>

      {/* Setup */}
      <div className="card p-5 mb-6 grid grid-cols-1 lg:grid-cols-2 gap-3 items-end">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#64748b' }}>Provider</label>
          <select value={provider} onChange={e => { setProvider(e.target.value); setNumbers(null); setSelected(null); setMessages(null); }}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ backgroundColor: '#020409', border: '1px solid #1e3a8a', color: '#f0f4ff' }}>
            {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <button onClick={fetchNumbers} disabled={loadingNumbers}
          className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', opacity: loadingNumbers ? 0.6 : 1, cursor: loadingNumbers ? 'not-allowed' : 'pointer' }}>
          {loadingNumbers ? 'Fetching…' : '🔢 Get Numbers'}
        </button>
      </div>

      {status && (
        <p className="text-sm mb-5" style={{ color: status.type === 'success' ? '#4ade80' : '#f87171' }}>{status.text}</p>
      )}

      {/* Numbers + inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Numbers */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ color: '#f0f4ff' }}>Available Numbers</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>
              {numbers ? numbers.length : 0} found
            </span>
          </div>

          {loadingNumbers ? (
            <p className="text-sm py-10 text-center" style={{ color: '#64748b' }}>Loading numbers…</p>
          ) : numbers === null ? (
            <p className="text-sm py-10 text-center" style={{ color: '#64748b' }}>
              Click <strong style={{ color: '#93c5fd' }}>Get Numbers</strong> to see available virtual numbers.
            </p>
          ) : numbers.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm" style={{ color: '#64748b' }}>
                No numbers available from this provider right now. Try another provider.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {numbers.map((n, i) => {
                const num = typeof n === 'string' ? { number: n } : n;
                const display = num.number || num.slug || num.url || `Number ${i + 1}`;
                const country = num.country || 'Unknown';
                const isSel = selected && (selected.number === num.number || selected === n || (typeof selected === 'string' && selected === display));
                return (
                  <button key={i} onClick={() => { setSelected(num); setMessages(null); }}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor: isSel ? 'rgba(37,99,235,0.15)' : '#020409',
                      border: `1px solid ${isSel ? 'rgba(37,99,235,0.5)' : '#1e3a8a'}`,
                      cursor: 'pointer',
                    }}>
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{FLAGS[country] || '🌐'}</span>
                      <span className="font-mono text-sm truncate" style={{ color: isSel ? '#93c5fd' : '#f0f4ff' }}>{display}</span>
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: '#64748b' }}>{country} {isSel ? '· ✓ selected' : ''}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Inbox */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ color: '#f0f4ff' }}>Inbox {selected && <span className="font-mono text-xs" style={{ color: '#64748b' }}>({selected.number || selected.slug || ''})</span>}</h2>
            {lastCheck && <span className="text-[10px]" style={{ color: '#475569' }}>checked {lastCheck.toLocaleTimeString()}</span>}
          </div>

          {!selected ? (
            <p className="text-sm py-10 text-center" style={{ color: '#64748b' }}>Select a number to read its messages.</p>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <button onClick={() => fetchMessages()} disabled={loadingMsgs}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', opacity: loadingMsgs ? 0.6 : 1, cursor: loadingMsgs ? 'not-allowed' : 'pointer' }}>
                  {loadingMsgs ? 'Checking…' : '📥 Check Messages'}
                </button>
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: '#94a3b8' }}>
                  <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} style={{ accentColor: '#2563eb' }} />
                  Auto-refresh (12s)
                </label>
              </div>

              {loadingMsgs ? (
                <p className="text-sm py-8 text-center" style={{ color: '#64748b' }}>Checking inbox…</p>
              ) : messages === null ? (
                <p className="text-sm py-8 text-center" style={{ color: '#64748b' }}>Press Check Messages to read SMS for this number.</p>
              ) : messages.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-3xl mb-2">💤</p>
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    No messages yet. Send an SMS to this number — {auto ? 'we’re watching for it automatically.' : 'then press refresh.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {messages.map((m, i) => (
                    <div key={i} className="p-3.5 rounded-xl" style={{ backgroundColor: '#020409', border: '1px solid #1e3a8a' }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold" style={{ color: '#93c5fd' }}>📩 {msgFrom(m)}</span>
                        {msgTime(m) && <span className="text-[10px]" style={{ color: '#475569' }}>{String(msgTime(m))}</span>}
                      </div>
                      <p className="text-sm" style={{ color: '#e2e8f0' }}>{msgText(m) || '(empty message)'}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card p-5 mt-6">
        <h3 className="text-sm font-bold mb-2" style={{ color: '#f0f4ff' }}>ℹ️ How it works</h3>
        <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: '#94a3b8' }}>
          <li>Pick a provider and click <strong style={{ color: '#93c5fd' }}>Get Numbers</strong> — available temporary numbers are listed (no account or API key needed).</li>
          <li>Select a number and click <strong style={{ color: '#93c5fd' }}>Check Messages</strong> to read its SMS. Turn on auto-refresh to watch for new messages.</li>
          <li>Use the number anywhere for verification — OTPs and SMS land right here on this page.</li>
        </ol>
        <p className="text-[10px] mt-3" style={{ color: '#475569' }}>
          Powered by the MZAZI API TempNumber endpoints. Number availability and providers vary by region and time.
        </p>
      </div>
    </div>
  );
}
