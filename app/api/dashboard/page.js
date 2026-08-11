'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart, LineChart } from '@/components/api/Charts';

function StatCard({ label, value, sub, color = '#60a5fa' }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: '#64748b' }}>{label}</p>
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#475569' }}>{sub}</p>}
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
      <p className="text-sm" style={{ color: '#64748b' }}>Loading dashboard…</p>
    </div>
  );

  if (error) return (
    <div className="container-site py-24 text-center">
      <p className="text-sm mb-4" style={{ color: '#f87171' }}>{error}</p>
      <button onClick={() => location.reload()} className="px-4 py-2 rounded-lg text-sm font-semibold"
        style={{ border: '1px solid #1e2d4a', color: '#94a3b8', cursor: 'pointer' }}>Retry</button>
    </div>
  );

  if (!data) return null;

  const s = data.stats;

  return (
    <div className="container-site py-12" style={{ minHeight: '70vh' }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold"><span className="gradient-text">Developer Dashboard</span></h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Real-time statistics from your MZAZI API usage.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/api/dashboard/keys"
            className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
            + CREATE API KEY
          </Link>
          <Link href="/api/dashboard/usage"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ color: '#60a5fa', border: '1px solid rgba(37,99,235,0.35)', textDecoration: 'none' }}>
            Usage Logs
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Requests" value={s.total_requests.toLocaleString()} color="#60a5fa" />
        <StatCard label="Requests Today" value={s.requests_today.toLocaleString()} sub={`${s.success_today} ok · ${s.failed_today} failed`} color="#93c5fd" />
        <StatCard label="Success Rate" value={s.total_requests ? `${Math.round(s.successful_requests / s.total_requests * 100)}%` : '—'} sub={`${s.successful_requests.toLocaleString()} succeeded`} color="#4ade80" />
        <StatCard label="Avg Response" value={fmtMs(s.avg_response_ms)} sub={`${s.failed_requests.toLocaleString()} failed total`} color="#fbbf24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Active API Keys" value={s.active_keys} sub={<Link href="/api/dashboard/keys" style={{ color: '#60a5fa', textDecoration: 'none' }}>manage keys →</Link>} color="#a78bfa" />
        <StatCard label="Most Used Endpoint" value={s.most_used_endpoint || '—'} sub="by request count" color="#f472b6" />
        <StatCard label="Quota Remaining (today)" value={
          data.quotas.length === 0 ? '—' : data.quotas.some(q => q.remaining === -1) ? 'Unlimited' : data.quotas.reduce((a, q) => a + q.remaining, 0).toLocaleString()
        } sub={`${data.quotas.length} active key${data.quotas.length === 1 ? '' : 's'}`} color="#34d399" />
      </div>

      {/* Chart */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ color: '#f0f4ff' }}>Requests — last 14 days</h2>
          <div className="flex items-center gap-4 text-xs" style={{ color: '#94a3b8' }}>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#3b82f6' }} /> requests</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#4ade80' }} /> success</span>
          </div>
        </div>
        {data.daily_series.every(d => d.requests === 0) ? (
          <p className="text-sm py-10 text-center" style={{ color: '#64748b' }}>
            No requests recorded yet — make your first API call and it will show up here.
          </p>
        ) : (
          <>
            <BarChart data={data.daily_series} valueKey="requests" />
            <div className="mt-4">
              <LineChart data={data.daily_series} valueKey="success" color="#4ade80" />
            </div>
          </>
        )}
      </div>

      {/* Quota per key */}
      <div className="card p-6 mb-8">
        <h2 className="font-bold mb-4" style={{ color: '#f0f4ff' }}>API Keys — quota</h2>
        {data.quotas.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm mb-3" style={{ color: '#64748b' }}>You don't have any active API keys yet.</p>
            <Link href="/api/dashboard/keys"
              className="px-4 py-2 rounded-lg text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
              Create your first key
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#0f1629', borderBottom: '1px solid #1e2d4a' }}>
                  {['Name', 'Key', 'Plan', 'Used today', 'Daily limit', 'Remaining'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.quotas.map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid #0f1629' }}>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#f0f4ff' }}>{q.name}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#94a3b8' }}>{q.prefix}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(37,99,235,0.12)', color: '#60a5fa' }}>
                        {q.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{q.used_today.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{q.daily_limit < 0 ? '∞' : q.daily_limit.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: q.remaining === 0 ? '#f87171' : '#4ade80' }}>
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
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ color: '#f0f4ff' }}>Recent Requests</h2>
          <Link href="/api/dashboard/usage" className="text-xs font-semibold" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
        {data.recent_requests.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: '#64748b' }}>No requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#0f1629', borderBottom: '1px solid #1e2d4a' }}>
                  {['Request ID', 'Endpoint', 'Status', 'Time', 'When'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent_requests.map(r => (
                  <tr key={r.request_id} style={{ borderBottom: '1px solid #0f1629' }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#64748b' }}>{r.request_id}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: '#e2e8f0' }}>{r.endpoint}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold" style={{ color: r.status_code < 400 ? '#4ade80' : '#f87171' }}>{r.status_code}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{r.response_time_ms}ms</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
