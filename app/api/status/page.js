import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS = {
  DOWNLOAD: 'Download',
  SEARCH: 'Search',
  AI: 'AI',
  'AI MUSIC': 'AI Music',
  ANIME: 'Anime',
  CANVAS: 'Canvas',
  FUN: 'Fun',
  GAMES: 'Games',
  'IMAGE GENERATION': 'Image Generation',
  TOOLS: 'Tools',
  MEDIA: 'Media',
  SOCIAL: 'Social',
  UTILITY: 'Utility',
  MOVIES: 'Movies',
  NEWS: 'News',
  RANDOM: 'Random',
  STALK: 'Stalk',
  SPORTS: 'Sports',
  UPLOADER: 'Uploader',
  'URL SHORTENER': 'URL Shortener',
};

async function getData() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [providers, activeEndpoints, avg, today] = await Promise.all([
      sql`SELECT name, display_name, base_url, api_key_configured, status, avg_response_ms, failure_rate,
                 total_requests, total_failures, last_success_at, last_failure_at, last_error
          FROM providers ORDER BY name`,
      sql`SELECT path, method, category, name, provider FROM endpoints WHERE is_active = true ORDER BY category, path`,
      sql`SELECT AVG(response_time_ms)::numeric(10,1) AS avg_ms FROM api_requests WHERE status_code < 400`,
      sql`SELECT COUNT(*) AS cnt FROM api_requests WHERE created_at >= CURRENT_DATE`,
    ]);
    return { providers, activeEndpoints, avgMs: avg[0]?.avg_ms ? Number(avg[0].avg_ms) : null, todayCount: parseInt(today[0].cnt, 10) || 0 };
  } catch {
    return { providers: [], activeEndpoints: [], avgMs: null, todayCount: 0 };
  }
}

async function measureDb() {
  const started = Date.now();
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`SELECT 1`;
    return { ok: true, ms: Date.now() - started };
  } catch {
    return { ok: false, ms: Date.now() - started };
  }
}

export default async function ApiStatus() {
  noStore();
  const db = await measureDb();
  const { providers, activeEndpoints, avgMs, todayCount } = await getData();

  const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
  const providerLabel = (name) => {
    const p = providers.find(x => x.name === name);
    return (p && p.display_name) || name || '—';
  };

  return (
    <div className="container-site py-12" style={{ minHeight: '70vh' }}>
      <div className="mb-8">
        <Link href="/api" className="text-xs font-semibold" style={{ color: '#475569', textDecoration: 'none' }}>← Back to API</Link>
        <h1 className="text-3xl font-extrabold mt-2"><span className="gradient-text">MZAZI API Status</span></h1>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>System health, provider and endpoint status.</p>
      </div>

      {/* System health */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: db.ok ? '#4ade80' : '#f87171' }} />
            <span className="text-sm font-bold" style={{ color: '#f0f4ff' }}>Database</span>
          </div>
          <p className="text-xs" style={{ color: '#94a3b8' }}>{db.ok ? 'Operational' : 'Unreachable'} · {db.ms}ms</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
            <span className="text-sm font-bold" style={{ color: '#f0f4ff' }}>API Service</span>
          </div>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Operational · v1.0.0</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: avgMs !== null ? '#4ade80' : '#64748b' }} />
            <span className="text-sm font-bold" style={{ color: '#f0f4ff' }}>Avg Response</span>
          </div>
          <p className="text-xs" style={{ color: '#94a3b8' }}>{avgMs !== null ? `${avgMs}ms` : 'No requests yet'}</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#60a5fa' }} />
            <span className="text-sm font-bold" style={{ color: '#f0f4ff' }}>Requests Today</span>
          </div>
          <p className="text-xs" style={{ color: '#94a3b8' }}>{todayCount.toLocaleString()} · {activeEndpoints.length} active endpoints</p>
        </div>
      </div>

      {/* Providers */}
      <h2 className="text-xl font-bold mb-4" style={{ color: '#f0f4ff' }}>Providers</h2>
      <div className="space-y-3 mb-10">
        {providers.length === 0 && (
          <div className="card p-6 text-center text-sm" style={{ color: '#64748b' }}>Provider registry unavailable.</div>
        )}
        {providers.map(p => (
          <div key={p.name} className="card p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.status === 'active' ? '#4ade80' : p.status === 'offline' ? '#f87171' : '#fbbf24' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#f0f4ff' }}>{p.display_name || p.name}</p>
                <p className="text-xs font-mono" style={{ color: '#64748b' }}>{p.base_url}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-1 text-xs" style={{ color: '#94a3b8' }}>
              <span>Avg: <strong style={{ color: '#f0f4ff' }}>{p.avg_response_ms !== null ? `${Number(p.avg_response_ms).toFixed(0)}ms` : '—'}</strong></span>
              <span>Failures: <strong style={{ color: '#f0f4ff' }}>{p.total_failures}</strong> / {p.total_requests}</span>
              <span>Last OK: <strong style={{ color: '#f0f4ff' }}>{fmt(p.last_success_at)}</strong></span>
              <span>Last error: <strong style={{ color: '#f87171' }}>{p.last_error || '—'}</strong></span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md"
              style={{
                backgroundColor: p.status === 'active' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                color: p.status === 'active' ? '#4ade80' : '#f87171',
                border: `1px solid ${p.status === 'active' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
              }}>
              {p.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Active endpoints */}
      <h2 className="text-xl font-bold mb-4" style={{ color: '#f0f4ff' }}>Active Endpoints ({activeEndpoints.length})</h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#060b16', borderBottom: '1px solid #1e3a8a' }}>
                {['Endpoint', 'Category', 'Provider', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeEndpoints.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm" style={{ color: '#64748b' }}>No active endpoints yet.</td></tr>
              )}
              {activeEndpoints.map(e => (
                <tr key={e.path} style={{ borderBottom: '1px solid #060b16' }}>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mr-2" style={{ backgroundColor: '#1e3a8a', color: '#93c5fd' }}>{e.method}</span>
                    <code className="text-xs font-mono" style={{ color: '#e2e8f0' }}>{e.path}</code>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#94a3b8' }}>{CATEGORY_LABELS[e.category] || e.category}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#64748b' }}>{providerLabel(e.provider)}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#4ade80' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />Operational
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
