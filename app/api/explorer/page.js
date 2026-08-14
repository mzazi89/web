import Link from 'next/link';
import TypingHeading from '@/components/TypingHeading';
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

const CATEGORY_ICONS = {
  DOWNLOAD: '⬇️', SEARCH: '🔍', AI: '🤖', 'AI MUSIC': '🎵', ANIME: '🎌', CANVAS: '🎨',
  FUN: '🎉', GAMES: '🎮', 'IMAGE GENERATION': '🖼️', TOOLS: '🛠️', MEDIA: '🎬', SOCIAL: '📱',
  UTILITY: '⚙️', MOVIES: '🎥', NEWS: '📰', RANDOM: '🎲', STALK: '🕵️', SPORTS: '🏆',
  UPLOADER: '📤', 'URL SHORTENER': '🔗',
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

  return (
    <div className="container-site py-12" style={{ minHeight: '70vh' }}>
      <div className="mb-8">
        <Link href="/api" className="text-xs font-semibold" style={{ color: '#475569', textDecoration: 'none' }}>← Back to API</Link>
        <h1 className="text-3xl font-extrabold mt-2"><TypingHeading as="span" text="API Explorer" speed={45} className="gradient-text" /></h1>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          Browse all MZAZI API categories — {categories.reduce((a, c) => a + c.active, 0)} active endpoints across {categories.length} categories.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map(c => (
          <Link key={c.category} href={`/api/docs#cat-${encodeURIComponent(c.category)}`}
            className="card p-6 transition-transform hover:-translate-y-1" style={{ textDecoration: 'none' }}>
            <div className="text-3xl mb-3">{CATEGORY_ICONS[c.category] || '📦'}</div>
            <h3 className="font-bold mb-1" style={{ color: '#f0f4ff' }}>{CATEGORY_LABELS[c.category] || c.category}</h3>
            <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
              {c.active} active · {c.total} total
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: '#60a5fa' }}>Explore →</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: c.active > 0 ? 'rgba(74,222,128,0.1)' : 'rgba(100,116,139,0.1)', color: c.active > 0 ? '#4ade80' : '#64748b' }}>
                {c.active > 0 ? 'LIVE' : 'INACTIVE'}
              </span>
            </div>
            {c.requests > 0 && (
              <p className="text-[10px] mt-2" style={{ color: '#475569' }}>{c.requests.toLocaleString()} requests (14d)</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
