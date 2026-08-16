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

// two-letter mono codes used in place of icon glyphs
const CATEGORY_CODES = {
  DOWNLOAD: 'DL', SEARCH: 'SR', AI: 'AI', 'AI MUSIC': 'AM', ANIME: 'AN', CANVAS: 'CV',
  FUN: 'FN', GAMES: 'GM', 'IMAGE GENERATION': 'IG', TOOLS: 'TL', MEDIA: 'MD', SOCIAL: 'SC',
  UTILITY: 'UT', MOVIES: 'MV', NEWS: 'NW', RANDOM: 'RD', STALK: 'SK', SPORTS: 'SP',
  UPLOADER: 'UP', 'URL SHORTENER': 'US',
};

async function getCategories() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT category, COUNT(*) AS total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active
      FROM endpoints GROUP BY category ORDER BY category
    `;
    const usage = await sql`
      SELECT category, SUM(requests) AS cnt FROM endpoint_usage
      WHERE date >= CURRENT_DATE - 13 AND category IS NOT NULL GROUP BY category
    `;
    const byCat = {};
    usage.forEach(u => { byCat[u.category] = parseInt(u.cnt, 10) || 0; });
    return rows.map(r => ({
      category: r.category,
      total: parseInt(r.total, 10) || 0,
      active: parseInt(r.active, 10) || 0,
      requests: byCat[r.category] || 0,
    })).filter(c => c.total > 0);
  } catch {
    return [];
  }
}

export default async function ApiExplorer() {
  noStore();
  const categories = await getCategories();
  const totalActive = categories.reduce((a, c) => a + c.active, 0);

  return (
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)', minHeight: '70vh' }}>
      <section className="relative overflow-hidden" style={{ paddingTop: 64, paddingBottom: 40 }}>
        <div className="absolute inset-0 pointer-events-none grid-bg" style={{ maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)' }} />
        <div className="container-site relative">
          <div className="max-w-3xl">
            <Link href="/api" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A', textDecoration: 'none' }}>
              ← Back to API
            </Link>
            <p className="eyebrow mt-8">Endpoint explorer</p>
            <h1 className="headline mt-4" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.2rem)' }}>
              Browse the catalog<span className="accent">.</span>
            </h1>
            <p className="lede mt-5 max-w-xl">
              {totalActive} active endpoints across {categories.length} categories — every one of them
              callable from the docs with a single key.
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 24, paddingBottom: 110 }}>
        <div className="container-site">
          {categories.length === 0 ? (
            <div className="card card-pad text-center">
              <p className="text-sm" style={{ color: '#4C535B' }}>Category registry unavailable — run database initialization first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map(c => {
                const live = c.active > 0;
                return (
                  <Link key={c.category} href={`/api/docs#cat-${encodeURIComponent(c.category)}`}
                    className="glow-card card-pad flex flex-col" style={{ textDecoration: 'none', padding: '24px 22px' }}>
                    <div className="flex items-center justify-between mb-5">
                      <span className="mono text-[11px] font-bold"
                        style={{ color: live ? '#F2A93B' : '#4C535B', border: `1px solid ${live ? 'rgba(242,169,59,0.4)' : '#262C33'}`, padding: '4px 8px' }}>
                        {CATEGORY_CODES[c.category] || '??'}
                      </span>
                      <span className={`tag ${live ? 'tag-green' : 'tag'}`}>
                        <span className="dot anim-pulse" style={{ color: live ? '#3ECF8E' : '#4C535B' }} />
                        {live ? 'Live' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="display font-bold text-lg mb-1" style={{ color: '#E9E7E2' }}>
                      {CATEGORY_LABELS[c.category] || c.category}
                    </h3>
                    <p className="mono text-[11px] uppercase tracking-[0.12em] mb-4" style={{ color: '#4C535B' }}>
                      {c.active} live · {c.total} total
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid #1B2026' }}>
                      <span className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: '#F2A93B' }}>
                        Explore →
                      </span>
                      {c.requests > 0 && (
                        <span className="mono text-[10px]" style={{ color: '#4C535B' }}>
                          {c.requests.toLocaleString()} req / 14d
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
