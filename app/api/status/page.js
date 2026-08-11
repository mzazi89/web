import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import { isConfigured as youtubeConfigured, missingEnvVars as youtubeMissing } from '@/lib/api/providers/youtube/play';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS = {
  DOWNLOAD: 'Download',
  SEARCH: 'Search',
  AI: 'AI',
  SOCIAL: 'Social',
  MEDIA: 'Media',
  TOOLS: 'Tools',
  UTILITY: 'Utility',
};

// Measure a real DB round-trip
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

async function getData() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [endpoints, avg] = await Promise.all([
      sql`SELECT path, method, category, name, provider, is_active FROM endpoints ORDER BY category, path`,
      sql`SELECT AVG(response_time_ms)::numeric(10,1) AS avg_ms FROM api_requests WHERE status_code < 400`,
    ]);
    return {
      endpoints,
      avgMs: avg[0]?.avg_ms ? Number(avg[0].avg_ms) : null,
    };
  } catch {
    return { endpoints: [], avgMs: null };
  }
}

export default async function ApiStatus() {
  const db = await measureDb();
  const { endpoints, avgMs } = await getData();

  const providers = [
    {
      name: 'YouTube (play)',
      key: 'youtube',
      configured: youtubeConfigured(),
      missing: youtubeMissing(),
    },
  ];

  return (
    <div className="container-site py-12" style={{ minHeight: '70vh' }}>
      <div className="mb-8">
        <Link href="/api" className="text-xs font-semibold" style={{ color: '#475569', textDecoration: 'none' }}>← Back to API</Link>
        <h1 className="text-3xl font-extrabold mt-2"><span className="gradient-text">MZAZI API Status</span></h1>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>System health, endpoint and provider status.</p>
      </div>

      {/* System health */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: db.ok ? '#4ade80' : '#f87171' }} />
            <span className="text-sm font-bold" style={{ color: '#f0f4ff' }}>Database</span>
          </div>
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            {db.ok ? 'Operational' : 'Unreachable'} · {db.ms}ms
          </p>
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
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            {avgMs !== null ? `${avgMs}ms` : 'No requests yet'}
          </p>
        </div>
      </div>

      {/* Providers */}
      <h2 className="text-xl font-bold mb-4" style={{ color: '#f0f4ff' }}>Providers</h2>
      <div className="space-y-3 mb-10">
        {providers.map(p => (
          <div key={p.key} className="card p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.configured ? '#4ade80' : '#fbbf24' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#f0f4ff' }}>{p.name}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  {p.configured
                    ? 'Configured and ready'
                    : `Missing: ${p.missing.join(', ')}`}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md"
              style={{
                backgroundColor: p.configured ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)',
                color: p.configured ? '#4ade80' : '#fbbf24',
                border: `1px solid ${p.configured ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`,
              }}>
              {p.configured ? 'OPERATIONAL' : 'NOT CONFIGURED'}
            </span>
          </div>
        ))}
      </div>

      {/* Endpoints */}
      <h2 className="text-xl font-bold mb-4" style={{ color: '#f0f4ff' }}>Endpoints</h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#0f1629', borderBottom: '1px solid #1e2d4a' }}>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#64748b' }}>Endpoint</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#64748b' }}>Category</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#64748b' }}>Provider</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#64748b' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm" style={{ color: '#64748b' }}>
                  Endpoint registry unavailable — run database initialization.
                </td></tr>
              )}
              {endpoints.map(e => (
                <tr key={e.path} style={{ borderBottom: '1px solid #0f1629' }}>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mr-2" style={{ backgroundColor: '#1e3a8a', color: '#93c5fd' }}>
                      {e.method}
                    </span>
                    <code className="text-xs font-mono" style={{ color: '#e2e8f0' }}>{e.path}</code>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#94a3b8' }}>{CATEGORY_LABELS[e.category] || e.category}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#64748b' }}>{e.provider || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: e.is_active ? '#4ade80' : '#64748b' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.is_active ? '#4ade80' : '#475569' }} />
                      {e.is_active ? 'Operational' : 'Disabled'}
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
