'use client';
import { useState } from 'react';
import CodeBlock from './CodeBlock';
import CopyButton from './CopyButton';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://mzazi.shop';

// Public endpoints available in the tester (data endpoint needs a key; health doesn't)
const ENDPOINTS = [
  { label: 'GET /api/download/play', path: '/api/download/play', needsKey: true },
  { label: 'GET /api/health', path: '/api/health', needsKey: false },
];

// Live API tester — calls the REAL endpoint. API key is OPTIONAL:
// valid key → live result; missing/invalid key → the proper JSON error response.
export default function ApiTester({ defaultQuery = 'Faded Alan Walker', compact = false }) {
  const [form, setForm] = useState({ key: '', query: defaultQuery, endpoint: ENDPOINTS[0].path });
  const [result, setResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const currentEndpoint = ENDPOINTS.find(e => e.path === form.endpoint) || ENDPOINTS[0];

  const run = async () => {
    setTesting(true);
    setResult(null);
    const started = Date.now();

    const params = new URLSearchParams();
    if (currentEndpoint.needsKey && form.query.trim()) params.set('query', form.query.trim());
    // only include apikey when the user actually typed one
    if (form.key.trim()) params.set('apikey', form.key.trim());

    const url = `${BASE_URL}${form.endpoint}${params.toString() ? '?' + params.toString() : ''}`;

    try {
      const res = await fetch(url);
      const json = await res.json().catch(() => null);
      setResult({
        url,
        status: res.status,
        ok: res.ok,
        ms: Date.now() - started,
        body: json ? JSON.stringify(json, null, 2) : `(non-JSON response, HTTP ${res.status})`,
      });
    } catch (e) {
      setResult({ url, status: 0, ok: false, ms: Date.now() - started, body: `Network error: ${e.message}` });
    }
    setTesting(false);
  };

  return (
    <div className="card card-pad" style={{ padding: '24px' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="display font-bold text-lg" style={{ color: '#E9E7E2' }}>API tester</h3>
        <span className="tag tag-green"><span className="dot anim-pulse" /> Live</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="label">Endpoint</label>
          <select
            value={form.endpoint}
            onChange={e => setForm(f => ({ ...f, endpoint: e.target.value }))}
            className="input font-mono">
            {ENDPOINTS.map(e => <option key={e.path} value={e.path}>{e.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">API key <span className="tag tag-green" style={{ fontSize: 9, padding: '1px 6px', marginLeft: 6 }}>optional</span></label>
          <input
            value={form.key}
            onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
            placeholder="mzazi_... (leave empty to test without a key)"
            className="input font-mono"
          />
        </div>
        <div>
          <label className="label">Song name</label>
          <input
            value={form.query}
            onChange={e => setForm(f => ({ ...f, query: e.target.value }))}
            placeholder="e.g. Faded Alan Walker"
            className="input"
            onKeyDown={e => { if (e.key === 'Enter') run(); }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={run} disabled={testing}
          className="btn btn-primary" style={{ opacity: testing ? 0.6 : 1, cursor: testing ? 'not-allowed' : 'pointer' }}>
          {testing ? 'Sending…' : 'Send request'}
        </button>
        <span className="mono text-[10px] uppercase tracking-[0.1em]" style={{ color: '#4C535B' }}>
          {currentEndpoint.needsKey
            ? 'No key? You’ll see the proper JSON error — then add your key to get real results.'
            : 'This endpoint is public — no API key needed.'}
        </span>
      </div>

      {result && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2 mono text-xs">
            <span className="tag" style={{
              color: result.ok ? '#3ECF8E' : '#E5484D',
              borderColor: result.ok ? 'rgba(62,207,142,0.35)' : 'rgba(229,72,77,0.35)',
              background: result.ok ? 'rgba(62,207,142,0.06)' : 'rgba(229,72,77,0.06)',
            }}>
              HTTP {result.status}
            </span>
            <span style={{ color: '#79818A' }}>{result.ms}ms</span>
            <span className="break-all" style={{ color: '#4C535B' }}>{result.url}</span>
            <CopyButton text={result.url} label="Copy URL" />
          </div>
          <CodeBlock label="JSON response" code={result.body} />
        </div>
      )}
    </div>
  );
}
