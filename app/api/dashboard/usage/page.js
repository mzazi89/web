'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart } from '@/components/api/Charts';

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleString();
}

function StatPill({ label, value, color = '#94a3b8' }) {
  return (
    <div className="card p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: '#64748b' }}>{label}</p>
      <p className="text-lg font-extrabold" style={{ color }}>{value}</p>
    </div>
  );
}

export default function ApiUsage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ endpoint: '', status: '', page: 1 });
  const [endpoints, setEndpoints] = useState([]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.endpoint) params.set('endpoint', filters.endpoint);
    if (filters.status) params.set('status', filters.status);
    params.set('page', String(filters.page));
    params.set('per_page', '20');

    const res = await fetch(`/api/dashboard/usage-data?${params}`);
    if (!res.ok) throw new Error('Failed to load usage data');
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.replace('/login?next=/api/dashboard/usage'); return; }
      load();
    }).catch(() => router.replace('/login?next=/api/dashboard/usage'));
  }, [load]);

  useEffect(() => {
    // distinct endpoints for the filter dropdown
    fetch('/api/dashboard/usage-data?per_page=1')
      .then(r => r.json())
      .then(d => {
        const seen = new Set();
        // usage endpoint list is filtered by filters; get full endpoint list from stats page data instead
        const list = (d.requests || []).map(r => r.endpoint);
        list.forEach(e => seen.add(e));
        // fallback: fetch recent rows page to collect endpoints
        fetch('/api/dashboard/usage-data?per_page=100')
          .then(r => r.json())
          .then(d2 => {
            (d2.requests || []).forEach(r => seen.add(r.endpoint));
            setEndpoints([...seen].sort());
          });
      });
  }, []);

  if (loading && !data) return (
    <div className="container-site py-24 text-center">
      <div className="spinner mx-auto mb-4" />
      <p className="text-sm" style={{ color: '#64748b' }}>Loading usage…</p>
    </div>
  );

  const s = data?.summary || {};
  const meta = data?.meta || {};

  return (
    <div className="container-site py-12" style={{ minHeight: '70vh' }}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold"><span className="gradient-text">Usage Analytics</span></h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Requests per day, per endpoint, success and failure rates.</p>
        </div>
        <Link href="/api/dashboard" className="text-xs font-semibold" style={{ color: '#60a5fa', textDecoration: 'none' }}>
          ← Back to dashboard
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-5 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#64748b' }}>Endpoint</label>
          <select value={filters.endpoint} onChange={e => setFilters(f => ({ ...f, endpoint: e.target.value, page: 1 }))}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'rgba(2,4,9,0.45)', border: '1px solid #1e3a8a', color: '#f0f4ff' }}>
            <option value="">All endpoints</option>
            {endpoints.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: '#64748b' }}>Status</label>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'rgba(2,4,9,0.45)', border: '1px solid #1e3a8a', color: '#f0f4ff' }}>
            <option value="">All</option>
            <option value="success">Success (2xx/3xx)</option>
            <option value="failed">Failed (4xx/5xx)</option>
          </select>
        </div>
        <button onClick={() => setFilters(f => ({ ...f, page: 1 }))}
          className="px-4 py-2 rounded-lg text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: 'pointer' }}>
          Apply
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <StatPill label="Total" value={(s.total || 0).toLocaleString()} />
        <StatPill label="Successful" value={(s.success || 0).toLocaleString()} color="#4ade80" />
        <StatPill label="Failed" value={(s.failed || 0).toLocaleString()} color="#f87171" />
        <StatPill label="Provider failures" value={(s.provider_failures || 0).toLocaleString()} color="#fbbf24" />
        <StatPill label="Avg response" value={s.avg_response_ms !== null && s.avg_response_ms !== undefined ? `${Number(s.avg_response_ms).toFixed(1)}ms` : '—'} color="#a78bfa" />
      </div>

      {/* Per-day + per-endpoint */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="card p-6">
          <h2 className="font-bold mb-4" style={{ color: '#f0f4ff' }}>Requests per day</h2>
          {(data?.per_day || []).length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: '#64748b' }}>No data in this range.</p>
          ) : (
            <LineChart data={data.per_day} valueKey="requests" />
          )}
        </div>
        <div className="card p-6">
          <h2 className="font-bold mb-4" style={{ color: '#f0f4ff' }}>Requests per endpoint</h2>
          {(data?.per_endpoint || []).length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: '#64748b' }}>No data in this range.</p>
          ) : (
            <div className="space-y-3">
              {data.per_endpoint.map(e => (
                <div key={e.endpoint}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <code className="font-mono" style={{ color: '#e2e8f0' }}>{e.endpoint}</code>
                    <span style={{ color: '#94a3b8' }}>{e.count.toLocaleString()} · {e.avg_response_ms !== null ? `${Number(e.avg_response_ms).toFixed(0)}ms` : '—'}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(2,4,9,0.45)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(100, (e.count / Math.max(1, data.per_endpoint[0].count)) * 100)}%`,
                      background: 'linear-gradient(90deg,#2563eb,#60a5fa)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#060b16', borderBottom: '1px solid #1e3a8a' }}>
                {['Request ID', 'Key', 'Endpoint', 'Status', 'Time', 'Provider', 'Error', 'When'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide" style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.requests || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-sm" style={{ color: '#64748b' }}>No requests match the current filters.</p>
                  </td>
                </tr>
              ) : (
                data.requests.map(r => (
                  <tr key={r.request_id} style={{ borderBottom: '1px solid #060b16' }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#64748b' }}>{r.request_id}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>
                      {r.key_name || '—'}
                      {r.key_prefix && <span className="block font-mono text-[10px]" style={{ color: '#475569' }}>{r.key_prefix}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#e2e8f0' }}>{r.endpoint}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold" style={{ color: r.status_code < 400 ? '#4ade80' : '#f87171' }}>{r.status_code}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{r.response_time_ms}ms</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>{r.provider || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: r.error_code ? '#fbbf24' : '#475569' }}>{r.error_code || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>{fmtDate(r.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #1e3a8a', backgroundColor: '#060b16' }}>
            <span className="text-xs" style={{ color: '#64748b' }}>
              Page {meta.page} of {meta.total_pages} · {meta.total.toLocaleString()} requests
            </span>
            <div className="flex gap-2">
              <button disabled={meta.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ border: '1px solid #1e3a8a', color: meta.page <= 1 ? '#475569' : '#94a3b8', cursor: meta.page <= 1 ? 'not-allowed' : 'pointer' }}>
                ← Prev
              </button>
              <button disabled={meta.page >= meta.total_pages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ border: '1px solid #1e3a8a', color: meta.page >= meta.total_pages ? '#475569' : '#94a3b8', cursor: meta.page >= meta.total_pages ? 'not-allowed' : 'pointer' }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
