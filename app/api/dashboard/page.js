'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart, LineChart } from '@/components/api/Charts';

function StatCell({ label, value, sub, tone }) {
  return (
    <div className="card p-5">
      <p className="mono text-[10px] uppercase tracking-[0.14em] mb-2" style={{ color: '#4C535B' }}>{label}</p>
      <p className="stat-num" style={{ fontSize: '1.6rem', color: tone || '#E9E7E2' }}>{value}</p>
      {sub && <div className="mono text-[10px] mt-2" style={{ color: '#79818A' }}>{sub}</div>}
    </div>
  );
}

function fmtMs(ms) {
  if (ms === null || ms === undefined) return '—';
  return `${Number(ms).toFixed(1)}ms`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleString();
}

export default function ApiDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.replace('/login?next=/api/dashboard'); return; }
      fetch('/api/dashboard/stats')
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load stats')))
        .then(d => { setData(d); setLoading(false); })
        .catch(e => { setError(e.message); setLoading(false); });
    }).catch(() => router.replace('/login?next=/api/dashboard'));
  }, []);

  if (loading) return (
    <div className="container-site py-24 text-center">
      <div className="spinner mx-auto mb-4" />
      <p className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A' }}>Loading dashboard…</p>
    </div>
  );

  if (error) return (
    <div className="container-site py-24 text-center">
      <p className="text-sm mb-4" style={{ color: '#E5484D' }}>{error}</p>
      <button onClick={() => location.reload()} className="btn btn-ghost">Retry</button>
    </div>
  );

  if (!data) return null;

  const s = data.stats;

  return (
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)', minHeight: '70vh' }}>
      <section className="section" style={{ paddingTop: 64, paddingBottom: 40 }}>
        <div className="container-site">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="eyebrow">Usage console</p>
              <h1 className="headline mt-4" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)' }}>
                Developer dashboard<span className="accent">.</span>
              </h1>
              <p className="text-sm mt-3" style={{ color: '#79818A' }}>
                Real-time statistics from your MZAZI API usage.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/api/dashboard/keys" className="btn btn-primary" style={{ textDecoration: 'none', padding: '11px 18px', fontSize: 11 }}>
                + Create API key
              </Link>
              <Link href="/api/dashboard/usage" className="btn btn-ghost" style={{ textDecoration: 'none', padding: '11px 18px', fontSize: 11 }}>
                Usage logs
              </Link>
            </div>
          </div>

          {/* Stat ledger */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px card overflow-hidden mb-4" style={{ background: '#262C33' }}>
            <StatCell label="Total requests" value={s.total_requests.toLocaleString()} tone="#E9E7E2" />
            <StatCell label="Requests today" value={s.requests_today.toLocaleString()} sub={`${s.success_today} ok · ${s.failed_today} failed`} tone="#4C7DFC" />
            <StatCell label="Success rate" value={s.total_requests ? `${Math.round(s.successful_requests / s.total_requests * 100)}%` : '—'} sub={`${s.successful_requests.toLocaleString()} succeeded`} tone="#3ECF8E" />
            <StatCell label="Avg response" value={fmtMs(s.avg_response_ms)} sub={`${s.failed_requests.toLocaleString()} failed total`} tone="#F2A93B" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px card overflow-hidden mb-10" style={{ background: '#262C33' }}>
            <StatCell label="Total endpoints" value={data.endpoints?.total ?? '—'} sub="in registry" tone="#AEB5BD" />
            <StatCell label="Active endpoints" value={data.endpoints?.active ?? '—'} sub={<Link href="/api/explorer" style={{ color: '#4C7DFC', textDecoration: 'none' }}>explore all →</Link>} tone="#3ECF8E" />
            <StatCell label="Top endpoint (14d)" value={data.top_endpoints?.[0]?.endpoint || '—'} sub={data.top_endpoints?.[0] ? `${data.top_endpoints[0].count.toLocaleString()} requests` : ''} tone="#AEB5BD" />
            <StatCell label="Top category" value={data.top_categories?.[0]?.category || '—'} sub={data.top_categories?.[0] ? `${data.top_categories[0].count.toLocaleString()} requests` : ''} tone="#AEB5BD" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
            <StatCell label="Active API keys" value={s.active_keys} sub={<Link href="/api/dashboard/keys" style={{ color: '#4C7DFC', textDecoration: 'none' }}>manage keys →</Link>} tone="#AEB5BD" />
            <StatCell label="Most used endpoint" value={s.most_used_endpoint || '—'} sub="by request count" tone="#AEB5BD" />
            <StatCell label="Quota remaining (today)" value={
              data.quotas.length === 0 ? '—' : data.quotas.some(q => q.remaining === -1) ? 'Unlimited' : data.quotas.reduce((a, q) => a + q.remaining, 0).toLocaleString()
            } sub={`${data.quotas.length} active key${data.quotas.length === 1 ? '' : 's'}`} tone="#3ECF8E" />
          </div>

          {/* Chart */}
          <div className="card card-pad mb-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="section-title text-xl" style={{ color: '#E9E7E2' }}>Requests — last 14 days</h2>
              <div className="flex items-center gap-4 mono text-[10px] uppercase tracking-[0.12em]" style={{ color: '#79818A' }}>
                <span className="flex items-center gap-1.5"><span className="dot" style={{ color: '#4C7DFC' }} /> requests</span>
                <span className="flex items-center gap-1.5"><span className="dot" style={{ color: '#3ECF8E' }} /> success</span>
              </div>
            </div>
            {data.daily_series.every(d => d.requests === 0) ? (
              <p className="text-sm py-10 text-center" style={{ color: '#79818A' }}>
                No requests recorded yet — make your first API call and it will show up here.
              </p>
            ) : (
              <>
                <BarChart data={data.daily_series} valueKey="requests" />
                <div className="mt-6 pt-6" style={{ borderTop: '1px solid #1B2026' }}>
                  <LineChart data={data.daily_series} valueKey="success" color="#3ECF8E" />
                </div>
              </>
            )}
          </div>

          {/* Quota per key */}
          <div className="card overflow-hidden mb-10">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1B2026' }}>
              <h2 className="section-title text-xl" style={{ color: '#E9E7E2' }}>API keys — quota</h2>
            </div>
            {data.quotas.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm mb-5" style={{ color: '#79818A' }}>You don&apos;t have any active API keys yet.</p>
                <Link href="/api/dashboard/keys" className="btn btn-primary" style={{ textDecoration: 'none', padding: '11px 18px', fontSize: 11 }}>
                  Create your first key
                </Link>
              </div>
            ) : (
              <div className="scroll-x">
                <table className="table-plain table-responsive">
                  <thead>
                    <tr>
                      {['Name', 'Key', 'Plan', 'Used today', 'Daily limit', 'Remaining'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.quotas.map(q => (
                      <tr key={q.id} data-label="Name">
                        <td data-label="Name" className="font-semibold" style={{ color: '#E9E7E2' }}>{q.name}</td>
                        <td data-label="Key" className="mono text-[12px]" style={{ color: '#79818A' }}>{q.prefix}</td>
                        <td data-label="Plan"><span className="tag tag-amber">{q.plan}</span></td>
                        <td data-label="Used today" style={{ color: '#AEB5BD' }}>{q.used_today.toLocaleString()}</td>
                        <td data-label="Daily limit" style={{ color: '#AEB5BD' }}>{q.daily_limit < 0 ? '∞' : q.daily_limit.toLocaleString()}</td>
                        <td data-label="Remaining" className="mono text-[12px] font-semibold" style={{ color: q.remaining === 0 ? '#E5484D' : '#3ECF8E' }}>
                          {q.remaining < 0 ? '∞' : q.remaining.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent requests */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1B2026' }}>
              <h2 className="section-title text-xl" style={{ color: '#E9E7E2' }}>Recent requests</h2>
              <Link href="/api/dashboard/usage" className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: '#F2A93B', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>
            {data.recent_requests.length === 0 ? (
              <p className="text-sm py-10 text-center" style={{ color: '#79818A' }}>No requests yet.</p>
            ) : (
              <div className="scroll-x">
                <table className="table-plain table-responsive">
                  <thead>
                    <tr>
                      {['Request ID', 'Endpoint', 'Status', 'Time', 'When'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_requests.map(r => (
                      <tr key={r.request_id} data-label="Endpoint">
                        <td data-label="Request ID" className="mono text-[11px]" style={{ color: '#79818A' }}>{r.request_id}</td>
                        <td data-label="Endpoint" className="mono text-[12px]" style={{ color: '#E9E7E2' }}>{r.endpoint}</td>
                        <td data-label="Status">
                          <span className="mono text-[12px] font-semibold" style={{ color: r.status_code < 400 ? '#3ECF8E' : '#E5484D' }}>{r.status_code}</span>
                        </td>
                        <td data-label="Time" style={{ color: '#AEB5BD' }}>{r.response_time_ms}ms</td>
                        <td data-label="When" style={{ color: '#79818A' }}>{fmtDate(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
