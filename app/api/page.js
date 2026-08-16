import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import ApiTester from '@/components/api/ApiTester';
import AuthSwap from '@/components/AuthSwap';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

const FEATURES = [
  { title: 'Fast', desc: 'Low-latency responses backed by reliable infrastructure.' },
  { title: 'Secure', desc: 'Hashed API keys, rate limiting, and strict validation on every request.' },
  { title: 'Developer-friendly', desc: 'Clean JSON envelopes, predictable errors, and clear documentation.' },
  { title: 'API Key Authentication', desc: 'Generate, revoke and rotate keys from your dashboard in seconds.' },
  { title: 'Usage Analytics', desc: 'Real-time request logs, response times and quota tracking.' },
  { title: 'Reliable Infrastructure', desc: 'Built on Neon PostgreSQL and deployed on Vercel.' },
];

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

async function getEndpoints() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT path, method, category, name, description, is_active
      FROM endpoints ORDER BY is_active DESC, category ASC, path ASC
    `;
    return rows;
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [counts, cats] = await Promise.all([
      sql`SELECT COUNT(*) AS total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active FROM endpoints`,
      sql`SELECT category, COUNT(*) AS total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active
          FROM endpoints WHERE is_active = true GROUP BY category ORDER BY active DESC LIMIT 12`,
    ]);
    return {
      total: parseInt(counts[0].total, 10) || 0,
      active: parseInt(counts[0].active, 10) || 0,
      categories: cats,
    };
  } catch {
    return { total: 0, active: 0, categories: [] };
  }
}

export default async function ApiLanding() {
  noStore();
  const endpoints = await getEndpoints();
  const stats = await getStats();
  const activeEndpoints = endpoints.filter(e => e.is_active);

  return (
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)' }}>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none grid-bg" style={{ maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 75%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 75%)' }} />
        <div className="absolute top-10 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(242,169,59,0.07) 0%, transparent 70%)', filter: 'blur(56px)' }} />

        <div className="container-site relative pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Copy */}
            <div className="lg:col-span-7">
              <p className="eyebrow anim-fade-up">Developer platform</p>
              <h1 className="headline anim-fade-up d1 mt-5" style={{ color: '#E9E7E2' }}>
                One API.<br />Every service<span className="accent">.</span>
              </h1>
              <p className="lede anim-fade-up d2 mt-6 max-w-xl">
                {stats.active} live endpoints across downloads, AI, search, tools, games, news and more —
                one key, one envelope, real data. Built by MZAZI TECH.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-9 anim-fade-up d3">
                <AuthSwap
                  signedOut={
                    <Link href="/signup" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                      Get started
                    </Link>
                  }
                  signedIn={
                    <Link href="/api/dashboard/keys" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                      Create API key
                    </Link>
                  }
                />
                <Link href="/api/explorer" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Explore APIs</Link>
                <Link href="/api/docs" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Documentation</Link>
              </div>

              <div className="flex flex-wrap gap-2 mt-10 anim-fade-up d3">
                {stats.categories.map(c => (
                  <a key={c.category} href={`/api/docs#cat-${encodeURIComponent(c.category)}`}
                    className="tag"
                    style={{ color: '#AEB5BD', textDecoration: 'none' }}>
                    {CATEGORY_LABELS[c.category] || c.category}
                    <strong style={{ color: '#F2A93B' }}>{parseInt(c.active, 10) || 0}</strong>
                  </a>
                ))}
              </div>
            </div>

            {/* Live example */}
            <div className="lg:col-span-5 anim-fade-up d2">
              <div className="card overflow-hidden" style={{ background: '#0F1215' }}>
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #1B2026' }}>
                  <span className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: '#4C535B' }}>
                    Quickstart
                  </span>
                  <span className="tag tag-green"><span className="dot anim-pulse" /> Live API</span>
                </div>
                <div className="p-4 overflow-x-auto">
                  <p className="mono text-[10px] uppercase tracking-[0.14em] mb-2" style={{ color: '#4C535B' }}>GET /api/download/play</p>
                  <pre className="mono text-xs leading-relaxed" style={{ color: '#AEB5BD' }}>
{`curl "https://mzazi.shop/api/download/play?query=Faded%20Alan%20Walker&apikey=mzazi_xxxxxxxxxxxxxxxxxxxxxxxxx"`}
                  </pre>
                </div>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #1B2026', background: 'rgba(242,169,59,0.04)' }}>
                  <span className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: '#F2A93B' }}>No key? Test it below</span>
                  <span style={{ color: '#4C535B' }}>→</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 sm:mt-20 pt-10" style={{ borderTop: '1px solid #1B2026' }}>
            {[
              { value: stats.active, label: 'Live endpoints' },
              { value: stats.total, label: 'Total registered' },
              { value: stats.categories.length, label: 'Categories' },
              { value: '1 key', label: 'All services' },
            ].map(s => (
              <div key={s.label}>
                <div className="stat-num" style={{ color: '#E9E7E2' }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Try the API ── */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container-site max-w-4xl">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-32">
              <p className="eyebrow">Live test</p>
              <h2 className="section-title text-3xl mt-4" style={{ color: '#E9E7E2' }}>
                Try it right now
                <span className="bar" />
              </h2>
              <p className="text-sm mt-5 leading-relaxed" style={{ color: '#79818A' }}>
                Enter a song name and hit send. The API key is{' '}
                <strong style={{ color: '#3ECF8E' }}>optional</strong> — without one you see the
                proper JSON error, with one you get live results.
              </p>
            </div>
            <div className="lg:col-span-8">
              <ApiTester />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section" style={{ background: 'rgba(255,255,255,0.014)' }}>
        <div className="container-site">
          <div className="max-w-3xl mb-12">
            <p className="eyebrow">Why MZAZI API</p>
            <h2 className="section-title text-3xl sm:text-4xl mt-4" style={{ color: '#E9E7E2' }}>
              Built for production traffic
              <span className="bar" />
            </h2>
          </div>

          <div>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="row-item">
                <span className="row-num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 style={{ color: '#E9E7E2' }}>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
                <span className="row-tag" style={{ color: '#4C535B' }}>—</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Endpoints ── */}
      <section className="section">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="eyebrow">Registry</p>
              <h2 className="section-title text-3xl sm:text-4xl mt-4" style={{ color: '#E9E7E2' }}>
                API endpoints
                <span className="bar" />
              </h2>
            </div>
            <Link href="/api/status" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#F2A93B', textDecoration: 'none' }}>
              System status →
            </Link>
          </div>

          {activeEndpoints.length === 0 ? (
            <div className="card card-pad text-center">
              <p className="text-sm" style={{ color: '#4C535B' }}>Endpoint registry unavailable — run database initialization first.</p>
            </div>
          ) : (
            <div className="card overflow-hidden scroll-x">
              <table className="table-plain table-responsive">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {activeEndpoints.map(e => (
                    <tr key={e.path} data-label="Endpoint">
                      <td data-label="Method">
                        <span className="mono text-[10px] font-bold px-1.5 py-0.5"
                          style={{ background: e.method === 'GET' ? 'rgba(76,125,252,0.12)' : 'rgba(242,169,59,0.1)', color: e.method === 'GET' ? '#4C7DFC' : '#F2A93B', border: `1px solid ${e.method === 'GET' ? 'rgba(76,125,252,0.35)' : 'rgba(242,169,59,0.3)'}` }}>
                          {e.method}
                        </span>
                      </td>
                      <td data-label="Endpoint"><code className="mono text-[12px]" style={{ color: '#E9E7E2' }}>{e.path}</code></td>
                      <td data-label="Name" className="font-semibold" style={{ color: '#E9E7E2' }}>{e.name}</td>
                      <td data-label="Category"><span className="tag">{CATEGORY_LABELS[e.category] || e.category}</span></td>
                      <td data-label="Description" style={{ color: '#79818A' }}>{e.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section" style={{ paddingBottom: 110 }}>
        <div className="container-site">
          <div className="card card-pad text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #14181D 0%, #0F1215 100%)' }}>
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(242,169,59,0.08) 0%, transparent 55%)' }} />
            <div className="relative">
              <p className="eyebrow center">Start building</p>
              <h2 className="headline mt-6" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
                First request in minutes<span className="accent">.</span>
              </h2>
              <p className="lede max-w-lg mx-auto mt-4 text-sm">
                Create your free account, generate an API key, and make your first request — no tickets, no waiting.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <AuthSwap
                  signedOut={
                    <Link href="/signup" className="btn btn-primary" style={{ textDecoration: 'none' }}>Get started free</Link>
                  }
                  signedIn={
                    <Link href="/api/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>Open API dashboard</Link>
                  }
                />
                <Link href="/api/docs" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Read the docs</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
