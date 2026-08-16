'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://mzazi.shop';

const PROVIDERS = [
  { id: 'receive-sms-online', label: 'Receive SMS Online', country: 'Sweden' },
  { id: 'hs3x', label: 'HS3X', country: 'USA' },
  { id: 'receive-smss', label: 'Receive-SMSS', country: '—' },
  { id: 'sms24', label: 'SMS24', country: '—' },
  { id: 'receivesms', label: 'ReceiveSMS.co', country: '—' },
  { id: 'smstome', label: 'SMS to Me', country: '—' },
];

const COUNTRY_CODES = {
  Sweden: 'SE', USA: 'US', UK: 'GB', Germany: 'DE', France: 'FR', Spain: 'ES',
  Nigeria: 'NG', Kenya: 'KE', India: 'IN', Brazil: 'BR', Unknown: '--',
};

function pick(obj, keys, fallback = null) {
  if (!obj || typeof obj !== 'object') return fallback;
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  return fallback;
}

function InboxIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4C535B' }}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
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
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)', minHeight: '70vh' }}>
      <section className="relative overflow-hidden" style={{ paddingTop: 64, paddingBottom: 40 }}>
        <div className="absolute inset-0 pointer-events-none grid-bg" style={{ maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)' }} />
        <div className="container-site relative">
          <div className="max-w-3xl">
            <a href="/api" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A', textDecoration: 'none' }}>← Back to API</a>
            <p className="eyebrow mt-8">SMS inbox</p>
            <h1 className="headline mt-4" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.2rem)' }}>
              Temporary phone numbers<span className="accent">.</span>
            </h1>
            <p className="lede mt-5 max-w-xl">
              Get a temporary virtual number and read its SMS messages right here — no phone needed.
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 24, paddingBottom: 110 }}>
        <div className="container-site max-w-6xl">
          {/* Setup */}
          <div className="card card-pad mb-6 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-4">
              <label className="label">Provider</label>
              <select value={provider} onChange={e => { setProvider(e.target.value); setNumbers(null); setSelected(null); setMessages(null); }} className="input">
                {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div className="lg:col-span-4">
              <p className="mono text-[10px] uppercase tracking-[0.14em] mb-2" style={{ color: '#4C535B' }}>
                Region: {PROVIDERS.find(p => p.id === provider)?.country || '—'}
              </p>
              <p className="text-xs" style={{ color: '#79818A' }}>
                No account or API key needed — numbers come straight from the provider.
              </p>
            </div>
            <div className="lg:col-span-4">
              <button onClick={fetchNumbers} disabled={loadingNumbers} className="btn btn-primary w-full" style={{ opacity: loadingNumbers ? 0.6 : 1, cursor: loadingNumbers ? 'not-allowed' : 'pointer' }}>
                {loadingNumbers ? 'Fetching…' : 'Get numbers'}
              </button>
            </div>
          </div>

          {status && (
            <div className="mb-6 px-4 py-3 text-sm" style={{
              background: status.type === 'success' ? 'rgba(62,207,142,0.07)' : 'rgba(229,72,77,0.08)',
              border: `1px solid ${status.type === 'success' ? 'rgba(62,207,142,0.3)' : 'rgba(229,72,77,0.3)'}`,
              color: status.type === 'success' ? '#3ECF8E' : '#E5484D',
            }}>
              {status.text}
            </div>
          )}

          {/* Numbers + inbox */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Numbers */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1B2026' }}>
                <h2 className="section-title text-lg" style={{ color: '#E9E7E2' }}>Available numbers</h2>
                <span className="tag tag-amber">{numbers ? numbers.length : 0} found</span>
              </div>

              <div className="p-4">
                {loadingNumbers ? (
                  <p className="text-sm py-10 text-center" style={{ color: '#79818A' }}>Loading numbers…</p>
                ) : numbers === null ? (
                  <p className="text-sm py-10 text-center" style={{ color: '#79818A' }}>
                    Click <strong style={{ color: '#F2A93B' }}>Get numbers</strong> to see available virtual numbers.
                  </p>
                ) : numbers.length === 0 ? (
                  <div className="py-10 text-center">
                    <InboxIcon />
                    <p className="text-sm mt-4" style={{ color: '#79818A' }}>
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
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                          style={{
                            background: isSel ? 'rgba(242,169,59,0.07)' : 'rgba(15,18,21,0.6)',
                            border: `1px solid ${isSel ? 'rgba(242,169,59,0.5)' : '#262C33'}`,
                            cursor: 'pointer',
                            borderRadius: 3,
                          }}>
                          <span className="flex items-center gap-3 min-w-0">
                            <span className="mono text-[10px] font-bold px-1.5 py-0.5 flex-shrink-0"
                              style={{ color: '#79818A', border: '1px solid #262C33' }}>
                              {COUNTRY_CODES[country] || '--'}
                            </span>
                            <span className="mono text-sm truncate" style={{ color: isSel ? '#F2A93B' : '#E9E7E2' }}>{display}</span>
                          </span>
                          <span className="mono text-[10px] uppercase tracking-[0.1em] flex-shrink-0" style={{ color: '#4C535B' }}>
                            {isSel ? 'Selected' : country}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Inbox */}
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4" style={{ borderBottom: '1px solid #1B2026' }}>
                <h2 className="section-title text-lg" style={{ color: '#E9E7E2' }}>
                  Inbox {selected && <span className="mono text-xs" style={{ color: '#79818A' }}>({selected.number || selected.slug || ''})</span>}
                </h2>
                {lastCheck && <span className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: '#4C535B' }}>checked {lastCheck.toLocaleTimeString()}</span>}
              </div>

              <div className="p-4">
                {!selected ? (
                  <p className="text-sm py-10 text-center" style={{ color: '#79818A' }}>Select a number to read its messages.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <button onClick={() => fetchMessages()} disabled={loadingMsgs} className="btn btn-primary" style={{ padding: '11px 18px', fontSize: 11, opacity: loadingMsgs ? 0.6 : 1, cursor: loadingMsgs ? 'not-allowed' : 'pointer' }}>
                        {loadingMsgs ? 'Checking…' : 'Check messages'}
                      </button>
                      <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: '#AEB5BD' }}>
                        <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} style={{ accentColor: '#F2A93B' }} />
                        Auto-refresh (12s)
                      </label>
                    </div>

                    {loadingMsgs ? (
                      <p className="text-sm py-8 text-center" style={{ color: '#79818A' }}>Checking inbox…</p>
                    ) : messages === null ? (
                      <p className="text-sm py-8 text-center" style={{ color: '#79818A' }}>Press Check messages to read SMS for this number.</p>
                    ) : messages.length === 0 ? (
                      <div className="py-10 text-center">
                        <InboxIcon />
                        <p className="text-sm mt-4" style={{ color: '#79818A' }}>
                          No messages yet. Send an SMS to this number — {auto ? 'we&apos;re watching for it automatically.' : 'then press refresh.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                        {messages.map((m, i) => (
                          <div key={i} className="p-3.5" style={{ background: 'rgba(15,18,21,0.6)', border: '1px solid #262C33', borderRadius: 3 }}>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="mono text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: '#F2A93B' }}>
                                From {msgFrom(m)}
                              </span>
                              {msgTime(m) && <span className="mono text-[10px]" style={{ color: '#4C535B' }}>{String(msgTime(m))}</span>}
                            </div>
                            <p className="text-sm" style={{ color: '#E9E7E2' }}>{msgText(m) || '(empty message)'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="card card-pad mt-6">
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <p className="eyebrow">Workflow</p>
                <h2 className="section-title text-xl mt-3" style={{ color: '#E9E7E2' }}>How it works<span className="bar" /></h2>
              </div>
              <div className="lg:col-span-8">
                <div className="space-y-4">
                  {[
                    { n: '01', text: <>Pick a provider and click <strong style={{ color: '#E9E7E2' }}>Get numbers</strong> — available temporary numbers are listed (no account or API key needed).</> },
                    { n: '02', text: <>Select a number and click <strong style={{ color: '#E9E7E2' }}>Check messages</strong> to read its SMS. Turn on auto-refresh to watch for new messages.</> },
                    { n: '03', text: <>Use the number anywhere for verification — OTPs and SMS land right here on this page.</> },
                  ].map(s => (
                    <div key={s.n} className="flex gap-5">
                      <span className="mono text-[11px] font-semibold flex-shrink-0" style={{ color: '#F2A93B', paddingTop: 2 }}>/{s.n}</span>
                      <p className="text-sm leading-relaxed" style={{ color: '#79818A' }}>{s.text}</p>
                    </div>
                  ))}
                </div>
                <p className="mono text-[10px] uppercase tracking-[0.12em] mt-6" style={{ color: '#4C535B' }}>
                  Powered by the MZAZI API TempNumber endpoints. Availability and providers vary by region and time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
