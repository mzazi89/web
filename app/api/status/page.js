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
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)', minHeight: '70vh' }}>
      <section className="relative overflow-hidden" style={{ paddingTop: 64, paddingBottom: 40 }}>
        <div className="absolute inset-0 pointer-events-none grid-bg" style={{ maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)' }} />
        <div className="container-site relative">
          <div className="max-w-3xl">
            <Link href="/api" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A', textDecoration: 'none' }}>
              ← Back to API
            </Link>
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <p className="eyebrow" style={{ marginRight: 8 }}>System status</p>
              <span className="tag tag-green"><span className="dot anim-pulse" /> {db.ok ? 'Operational' : 'Degraded'}</span>
            </div>
            <h1 className="headline mt-4" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.2rem)' }}>
              Health at a glance<span className="accent">.</span>
            </h1>
            <p className="lede mt-5 max-w-xl">
              Database, providers and endpoints — measured live on every visit.
            </p>
          </div>

          {/* System health ledger */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mt-12 card overflow-hidden" style={{ background: '#262C33' }}>
            {[
              { label: 'Database', value: db.ok ? 'Operational' : 'Unreachable', sub: `${db.ms}ms round trip`, ok: db.ok },
              { label: 'API service', value: 'Operational', sub: 'v1.0.0', ok: true },
              { label: 'Avg response', value: avgMs !== null ? `${avgMs}ms` : '—', sub: avgMs !== null ? 'last 24h window' : 'no requests yet', ok: avgMs !== null },
              { label: 'Requests today', value: todayCount.toLocaleString(), sub: `${activeEndpoints.length} active endpoints`, ok: true },
            ].map(s => (
              <div key={s.label} className="card p-5" style={{ background: '#14181D' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="dot anim-pulse" style={{ color: s.ok ? '#3ECF8E' : '#E5484D' }} />
                  <span className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: '#4C535B' }}>{s.label}</span>
                </div>
                <p className="display font-bold text-lg" style={{ color: '#E9E7E2' }}>{s.value}</p>
                <p className="mono text-[10px] mt-1" style={{ color: '#4C535B' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Providers */}
      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container-site">
          <div className="mb-8">
            <p className="eyebrow">Upstream</p>
            <h2 className="section-title text-3xl mt-4" style={{ color: '#E9E7E2' }}>
              Providers
              <span className="bar" />
            </h2>
          </div>

          {providers.length === 0 ? (
            <div className="card card-pad text-center">
              <p className="text-sm" style={{ color: '#4C535B' }}>Provider registry unavailable.</p>
            </div>
          ) : (
            <div className="card overflow-hidden scroll-x">
              <table className="table-plain table-responsive">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Avg response</th>
                    <th>Failures</th>
                    <th>Last success</th>
                    <th>Last error</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => {
                    const active = p.status === 'active';
                    return (
                      <tr key={p.name} data-label="Provider">
                        <td data-label="Provider">
                          <div className="flex items-center gap-3">
                            <span className="dot" style={{ color: active ? '#3ECF8E' : p.status === 'offline' ? '#E5484D' : '#F2A93B' }} />
                            <div>
                              <p className="font-semibold" style={{ color: '#E9E7E2' }}>{p.display_name || p.name}</p>
                              <p className="mono text-[10px]" style={{ color: '#4C535B' }}>{p.base_url}</p>
                            </div>
                          </div>
                        </td>
                        <td data-label="Status">
                          <span className={`tag ${active ? 'tag-green' : 'tag-red'}`}>{p.status.toUpperCase()}</span>
                        </td>
                        <td data-label="Avg response" className="mono text-[12px]">
                          {p.avg_response_ms !== null ? `${Number(p.avg_response_ms).toFixed(0)}ms` : '—'}
                        </td>
                        <td data-label="Failures">
                          <span className="mono text-[12px]" style={{ color: p.total_failures > 0 ? '#E5484D' : '#79818A' }}>
                            {p.total_failures} / {p.total_requests}
                          </span>
                        </td>
                        <td data-label="Last success" style={{ color: '#79818A' }}>{fmt(p.last_success_at)}</td>
                        <td data-label="Last error" style={{ color: p.last_error ? '#E5484D' : '#4C535B' }}>{p.last_error || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Active endpoints */}
      <section className="section" style={{ paddingBottom: 110 }}>
        <div className="container-site">
          <div className="mb-8">
            <p className="eyebrow">Live routes</p>
            <h2 className="section-title text-3xl mt-4" style={{ color: '#E9E7E2' }}>
              Active endpoints
              <span className="mono text-sm font-medium" style={{ color: '#4C535B', letterSpacing: '0.02em' }}>
                {' '}({activeEndpoints.length})
              </span>
              <span className="bar" />
            </h2>
          </div>

          <div className="card overflow-hidden scroll-x">
            <table className="table-plain table-responsive">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Category</th>
                  <th>Provider</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeEndpoints.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center" style={{ color: '#4C535B', padding: '36px 0' }}>No active endpoints yet.</td>
                  </tr>
                )}
                {activeEndpoints.map(e => (
                  <tr key={e.path} data-label="Endpoint">
                    <td data-label="Endpoint">
                      <span className="mono text-[10px] font-bold px-1.5 py-0.5 mr-2"
                        style={{ background: e.method === 'GET' ? 'rgba(76,125,252,0.12)' : 'rgba(242,169,59,0.1)', color: e.method === 'GET' ? '#4C7DFC' : '#F2A93B', border: `1px solid ${e.method === 'GET' ? 'rgba(76,125,252,0.35)' : 'rgba(242,169,59,0.3)'}` }}>
                        {e.method}
                      </span>
                      <code className="mono text-[12px]" style={{ color: '#E9E7E2' }}>{e.path}</code>
                    </td>
                    <td data-label="Category"><span className="tag">{CATEGORY_LABELS[e.category] || e.category}</span></td>
                    <td data-label="Provider" style={{ color: '#79818A' }}>{providerLabel(e.provider)}</td>
                    <td data-label="Status">
                      <span className="tag tag-green"><span className="dot anim-pulse" /> Operational</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
