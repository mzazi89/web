'use client';
import { useState } from 'react';
import CodeBlock from './CodeBlock';
import CopyButton from './CopyButton';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://mzazi.shop';

// Live tester for a single registry endpoint — calls the REAL MZAZI API.
// API key optional (see the JSON error without one, real result with one).
export default function EndpointTester({ endpoint }) {
  // registry field is `parameters` ({required:[{name,example}], optional:[...]})
  const def = endpoint.parameters || endpoint.params || { required: [], optional: [] };
  const required = (def.required || []).map(p => (typeof p === 'string' ? { name: p } : p));
  const optional = (def.optional || []).map(p => (typeof p === 'string' ? { name: p } : p));
  const all = [...required, ...optional];

  const [key, setKey] = useState('');
  const [values, setValues] = useState(() => {
    const v = {};
    for (const p of all) v[p.name] = p.example || '';
    return v;
  });
  const [result, setResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const run = async () => {
    setTesting(true);
    setResult(null);
    const started = Date.now();

    const params = new URLSearchParams();
    for (const p of all) {
      if (values[p.name] && values[p.name].trim()) params.set(p.name, values[p.name].trim());
    }
    if (key.trim()) params.set('apikey', key.trim());

    const url = `${BASE_URL}${endpoint.path}${params.toString() ? '?' + params.toString() : ''}`;

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
    <div className="card card-pad" style={{ background: '#0F1215', padding: '18px' }}>
      <div className="flex flex-wrap items-end gap-3 mb-3">
        <div className="flex-1 min-w-[200px]">
          <label className="label">API key <span className="tag tag-green" style={{ fontSize: 9, padding: '1px 6px', marginLeft: 6 }}>optional</span></label>
          <input value={key} onChange={e => setKey(e.target.value)} placeholder="mzazi_..."
            className="input font-mono" style={{ padding: '9px 12px', fontSize: 13 }} />
        </div>
        {all.map(p => (
          <div key={p.name} className="flex-1 min-w-[140px]">
            <label className="label">
              {p.name}
              {required.some(r => r.name === p.name) && <span style={{ color: '#E5484D' }}> *</span>}
            </label>
            <input value={values[p.name] || ''} onChange={e => setValues(v => ({ ...v, [p.name]: e.target.value }))}
              placeholder={p.example || p.name}
              className="input" style={{ padding: '9px 12px', fontSize: 13 }} />
          </div>
        ))}
        <button onClick={run} disabled={testing}
          className="btn btn-primary" style={{ padding: '10px 18px', fontSize: 10, opacity: testing ? 0.6 : 1, cursor: testing ? 'not-allowed' : 'pointer' }}>
          {testing ? 'Sending…' : 'Send request'}
        </button>
      </div>

      {result && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 mono text-xs">
            <span className="tag" style={{
              color: result.ok ? '#3ECF8E' : '#E5484D',
              borderColor: result.ok ? 'rgba(62,207,142,0.35)' : 'rgba(229,72,77,0.35)',
              background: result.ok ? 'rgba(62,207,142,0.06)' : 'rgba(229,72,77,0.06)',
            }}>HTTP {result.status}</span>
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
