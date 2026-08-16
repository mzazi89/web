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

function StatCell({ label, value, tone = '#AEB5BD' }) {
  return (
    <div className="card p-4">
      <p className="mono text-[10px] uppercase tracking-[0.14em] mb-1.5" style={{ color: '#4C535B' }}>{label}</p>
      <p className="display font-bold text-xl" style={{ color: tone }}>{value}</p>
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
      <p className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A' }}>Loading usage…</p>
    </div>
  );

  const s = data?.summary || {};
  const meta = data?.meta || {};

  return (
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)', minHeight: '70vh' }}>
      <section className="section" style={{ paddingTop: 64, paddingBottom: 110 }}>
        <div className="container-site max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="eyebrow">Request log</p>
              <h1 className="headline mt-4" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)' }}>
                Usage analytics<span className="accent">.</span>
              </h1>
              <p className="text-sm mt-3" style={{ color: '#79818A' }}>
                Requests per day, per endpoint, success and failure rates.
              </p>
            </div>
            <Link href="/api/dashboard" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A', textDecoration: 'none' }}>
              ← Back to dashboard
            </Link>
          </div>

          {/* Filters */}
          <div className="card card-pad mb-8" style={{ padding: '20px' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="label">Endpoint</label>
                <select value={filters.endpoint} onChange={e => setFilters(f => ({ ...f, endpoint: e.target.value, page: 1 }))} className="input">
                  <option value="">All endpoints</option>
                  {endpoints.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))} className="input">
                  <option value="">All</option>
                  <option value="success">Success (2xx/3xx)</option>
                  <option value="failed">Failed (4xx/5xx)</option>
                </select>
              </div>
              <button onClick={() => setFilters(f => ({ ...f, page: 1 }))} className="btn btn-primary" style={{ cursor: 'pointer' }}>
                Apply
              </button>
            </div>
          </div>

          {/* Summary ledger */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px card overflow-hidden mb-10" style={{ background: '#262C33' }}>
            <StatCell label="Total" value={(s.total || 0).toLocaleString()} />
            <StatCell label="Successful" value={(s.success || 0).toLocaleString()} tone="#3ECF8E" />
            <StatCell label="Failed" value={(s.failed || 0).toLocaleString()} tone="#E5484D" />
            <StatCell label="Provider failures" value={(s.provider_failures || 0).toLocaleString()} tone="#F2A93B" />
            <StatCell label="Avg response" value={s.avg_response_ms !== null && s.avg_response_ms !== undefined ? `${Number(s.avg_response_ms).toFixed(1)}ms` : '—'} tone="#4C7DFC" />
          </div>

          {/* Per-day + per-endpoint */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
            <div className="card card-pad">
              <h2 className="section-title text-xl mb-6" style={{ color: '#E9E7E2' }}>Requests per day</h2>
              {(data?.per_day || []).length === 0 ? (
                <p className="text-sm py-10 text-center" style={{ color: '#79818A' }}>No data in this range.</p>
              ) : (
                <LineChart data={data.per_day} valueKey="requests" />
              )}
            </div>
            <div className="card card-pad">
              <h2 className="section-title text-xl mb-6" style={{ color: '#E9E7E2' }}>Requests per endpoint</h2>
              {(data?.per_endpoint || []).length === 0 ? (
                <p className="text-sm py-10 text-center" style={{ color: '#79818A' }}>No data in this range.</p>
              ) : (
                <div className="space-y-4">
                  {data.per_endpoint.map(e => (
                    <div key={e.endpoint}>
                      <div className="flex items-center justify-between gap-3 mono text-[11px] mb-1.5">
                        <code className="truncate" style={{ color: '#E9E7E2' }}>{e.endpoint}</code>
                        <span className="flex-shrink-0" style={{ color: '#79818A' }}>
                          {e.count.toLocaleString()} · {e.avg_response_ms !== null ? `${Number(e.avg_response_ms).toFixed(0)}ms` : '—'}
                        </span>
                      </div>
                      <div className="h-1" style={{ background: '#1B2026' }}>
                        <div className="h-full" style={{
                          width: `${Math.min(100, (e.count / Math.max(1, data.per_endpoint[0].count)) * 100)}%`,
                          background: '#F2A93B',
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
            <div className="scroll-x">
              <table className="table-plain table-responsive">
                <thead>
                  <tr>
                    {['Request ID', 'Key', 'Endpoint', 'Status', 'Time', 'Provider', 'Error', 'When'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.requests || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center" style={{ color: '#79818A', padding: '44px 0' }}>
                        No requests match the current filters.
                      </td>
                    </tr>
                  ) : (
                    data.requests.map(r => (
                      <tr key={r.request_id} data-label="Endpoint">
                        <td data-label="Request ID" className="mono text-[11px]" style={{ color: '#79818A' }}>{r.request_id}</td>
                        <td data-label="Key" style={{ color: '#AEB5BD' }}>
                          {r.key_name || '—'}
                          {r.key_prefix && <span className="block mono text-[10px]" style={{ color: '#4C535B' }}>{r.key_prefix}</span>}
                        </td>
                        <td data-label="Endpoint" className="mono text-[12px]" style={{ color: '#E9E7E2' }}>{r.endpoint}</td>
                        <td data-label="Status">
                          <span className="mono text-[12px] font-semibold" style={{ color: r.status_code < 400 ? '#3ECF8E' : '#E5484D' }}>{r.status_code}</span>
                        </td>
                        <td data-label="Time" style={{ color: '#AEB5BD' }}>{r.response_time_ms}ms</td>
                        <td data-label="Provider" style={{ color: '#79818A' }}>{r.provider || '—'}</td>
                        <td data-label="Error" style={{ color: r.error_code ? '#F2A93B' : '#4C535B' }}>{r.error_code || '—'}</td>
                        <td data-label="When" style={{ color: '#79818A' }}>{fmtDate(r.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.total_pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3" style={{ borderTop: '1px solid #1B2026' }}>
                <span className="mono text-[11px]" style={{ color: '#79818A' }}>
                  Page {meta.page} of {meta.total_pages} · {meta.total.toLocaleString()} requests
                </span>
                <div className="flex gap-2">
                  <button disabled={meta.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                    className="btn btn-ghost" style={{ padding: '9px 16px', fontSize: 10, cursor: meta.page <= 1 ? 'not-allowed' : 'pointer' }}>
                    ← Prev
                  </button>
                  <button disabled={meta.page >= meta.total_pages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                    className="btn btn-ghost" style={{ padding: '9px 16px', fontSize: 10, cursor: meta.page >= meta.total_pages ? 'not-allowed' : 'pointer' }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
