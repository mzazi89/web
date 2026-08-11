import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import ApiTester from '@/components/api/ApiTester';
import AuthSwap from '@/components/AuthSwap';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

const FEATURES = [
  { icon: '⚡', title: 'Fast', desc: 'Low-latency responses backed by reliable infrastructure.' },
  { icon: '🔒', title: 'Secure', desc: 'Hashed API keys, rate limiting, and strict validation on every request.' },
  { icon: '🧑‍💻', title: 'Developer-friendly', desc: 'Clean JSON envelopes, predictable errors, and clear documentation.' },
  { icon: '🔑', title: 'API Key Authentication', desc: 'Generate, revoke and rotate keys from your dashboard in seconds.' },
  { icon: '📊', title: 'Usage Analytics', desc: 'Real-time request logs, response times and quota tracking.' },
  { icon: '🛡️', title: 'Reliable Infrastructure', desc: 'Built on Neon PostgreSQL and deployed on Vercel.' },
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
    <div style={{ backgroundColor: '#0a0a0f' }}>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg,rgba(7,20,40,0.98) 0%,rgba(10,10,15,1) 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.06) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-10 right-1/4 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(37,99,235,0.18) 0%,transparent 70%)', filter: 'blur(48px)' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide" style={{ color: '#60a5fa' }}>MZAZI TECH · Developer Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
            <span className="gradient-text">MZAZI API</span>
          </h1>
          <p className="text-lg sm:text-2xl font-medium mb-3" style={{ color: '#f0f4ff' }}>
            One API. Multiple services.
          </p>
          <p className="text-sm sm:text-base max-w-2xl mx-auto mb-6" style={{ color: '#94a3b8' }}>
            {stats.active} live endpoints across downloads, AI, search, tools, games, news and more —
            one key, one envelope, real data. Built by MZAZI TECH.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {stats.categories.map(c => (
              <a key={c.category} href={`/api/docs#cat-${encodeURIComponent(c.category)}`}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ color: '#60a5fa', border: '1px solid rgba(37,99,235,0.25)', backgroundColor: 'rgba(37,99,235,0.06)', textDecoration: 'none' }}>
                {CATEGORY_LABELS[c.category] || c.category} · {parseInt(c.active, 10) || 0}
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <AuthSwap
              signedOut={
                <Link href="/signup"
                  className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 0 24px rgba(37,99,235,0.35)', textDecoration: 'none' }}>
                  GET STARTED
                </Link>
              }
              signedIn={
                <Link href="/api/dashboard/keys"
                  className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 0 24px rgba(37,99,235,0.35)', textDecoration: 'none' }}>
                  CREATE API KEY
                </Link>
              }
            />
            <Link href="/api/explorer"
              className="px-6 py-3 rounded-xl font-semibold transition-all"
              style={{ color: '#a78bfa', border: '1px solid rgba(167,139,250,0.35)', textDecoration: 'none' }}>
              EXPLORE APIs
            </Link>
            <Link href="/api/docs"
              className="px-6 py-3 rounded-xl font-semibold transition-all"
              style={{ color: '#60a5fa', border: '1px solid rgba(37,99,235,0.35)', textDecoration: 'none' }}>
              DOCUMENTATION
            </Link>
            <Link href="/api/dashboard"
              className="px-6 py-3 rounded-xl font-semibold transition-all"
              style={{ color: '#94a3b8', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
              DASHBOARD
            </Link>
            <Link href="/api/dashboard/keys"
              className="px-6 py-3 rounded-xl font-semibold transition-all"
              style={{ color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', textDecoration: 'none' }}>
              + CREATE API KEY
            </Link>
          </div>

          {/* Live example */}
          <div className="mt-12 text-left max-w-2xl mx-auto">
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <div className="px-4 py-2 flex items-center gap-2 border-b" style={{ borderColor: '#1e2d4a' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f87171' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#fbbf24' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
                <span className="ml-2 text-xs font-mono" style={{ color: '#475569' }}>GET /api/download/play</span>
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed" style={{ color: '#cbd5e1' }}>
{`curl "https://mzazi.shop/api/download/play?query=Faded%20Alan%20Walker&apikey=mzazi_xxxxxxxxxxxxxxxxxxxxxxxxx"`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Try the API ── */}
      <section className="container-site py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="gradient-text">Try It Right Now</span>
          </h2>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Enter a song name and hit send. API key is <strong style={{ color: '#4ade80' }}>optional</strong> —
            without one you'll see the JSON error, with one you get live results.
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <ApiTester />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="container-site py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          <span className="gradient-text">Why MZAZI API?</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-6 transition-transform hover:-translate-y-1">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold mb-1.5" style={{ color: '#f0f4ff' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Endpoints ── */}
      <section className="container-site py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">API Endpoints</span>
          </h2>
          <Link href="/api/status" className="text-sm font-semibold" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            System status →
          </Link>
        </div>

        {activeEndpoints.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm" style={{ color: '#475569' }}>Endpoint registry unavailable — run database initialization first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEndpoints.map(e => (
              <div key={e.path} className="card p-5"
                style={{ opacity: e.is_active ? 1 : 0.55 }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide"
                    style={{ backgroundColor: 'rgba(37,99,235,0.12)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)' }}>
                    {CATEGORY_LABELS[e.category] || e.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: '#4ade80' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
                    LIVE
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1e3a8a', color: '#93c5fd' }}>
                    {e.method}
                  </span>
                  <code className="text-xs font-mono" style={{ color: '#e2e8f0' }}>{e.path}</code>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#f0f4ff' }}>{e.name}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{e.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="container-site py-16 pb-24">
        <div className="card p-10 sm:p-14 text-center"
          style={{ background: 'linear-gradient(135deg,rgba(37,99,235,0.08),rgba(10,10,15,0.9))' }}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Start building with MZAZI API</h2>
          <p className="text-sm mb-8" style={{ color: '#94a3b8' }}>
            Create your free account, generate an API key, and make your first request in minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <AuthSwap
              signedOut={
                <Link href="/signup"
                  className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
                  Get Started Free
                </Link>
              }
              signedIn={
                <Link href="/api/dashboard"
                  className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
                  Open API Dashboard
                </Link>
              }
            />
            <Link href="/api/docs"
              className="px-6 py-3 rounded-xl font-semibold transition-all"
              style={{ color: '#60a5fa', border: '1px solid rgba(37,99,235,0.35)', textDecoration: 'none' }}>
              Read the Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
