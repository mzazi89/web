'use client';
import { useState, useMemo } from 'react';
import EndpointTester from './EndpointTester';
import CodeBlock from './CodeBlock';

const CATEGORY_LABELS = {
  DOWNLOAD: 'Download', SEARCH: 'Search', AI: 'AI', 'AI MUSIC': 'AI Music', ANIME: 'Anime',
  CANVAS: 'Canvas', FUN: 'Fun', GAMES: 'Games', 'IMAGE GENERATION': 'Image Generation',
  TOOLS: 'Tools', MEDIA: 'Media', SOCIAL: 'Social', UTILITY: 'Utility', MOVIES: 'Movies',
  NEWS: 'News', RANDOM: 'Random', STALK: 'Stalk', SPORTS: 'Sports', UPLOADER: 'Uploader',
  'URL SHORTENER': 'URL Shortener',
};
// two-letter mono codes used in place of icon glyphs
const CATEGORY_CODES = {
  DOWNLOAD: 'DL', SEARCH: 'SR', AI: 'AI', 'AI MUSIC': 'AM', ANIME: 'AN', CANVAS: 'CV',
  FUN: 'FN', GAMES: 'GM', 'IMAGE GENERATION': 'IG', TOOLS: 'TL', MEDIA: 'MD', SOCIAL: 'SC',
  UTILITY: 'UT', MOVIES: 'MV', NEWS: 'NW', RANDOM: 'RD', STALK: 'SK', SPORTS: 'SP',
  UPLOADER: 'UP', 'URL SHORTENER': 'US',
};

const GUIDES = [
  {
    id: 'auth', title: 'Authentication',
    body: `All data endpoints require a MZAZI API key. Pass it as the apikey query parameter or as an Authorization: Bearer header. Create keys from the dashboard — full keys are shown only once.`,
    code: `GET ${typeof window !== 'undefined' ? window.location.origin : 'https://mzazi.shop'}/api/search/google?q=music&apikey=mzazi_xxxxxxxxx`,
  },
  {
    id: 'rate-limits', title: 'Rate Limits',
    body: `Every key has a daily quota by plan: FREE 100, PREMIUM 10,000, BUSINESS 100,000, ADMIN unlimited. Responses include X-RateLimit-Limit, X-RateLimit-Remaining and X-RateLimit-Reset headers.`,
    code: null,
  },
  {
    id: 'errors', title: 'Errors',
    body: `Errors always use the same envelope: { "status": false, "creator": "MZAZI TECH", "error": "CODE", "message": "..." }. Common codes: MISSING_API_KEY (401), INVALID_API_KEY (401), MISSING_PARAMETER (400), RATE_LIMITED (429), PROVIDER_ERROR (502), PROVIDER_TIMEOUT (504), ENDPOINT_DISABLED (404), INTERNAL_ERROR (500).`,
    code: `{"status": false, "creator": "MZAZI TECH", "error": "INVALID_API_KEY", "message": "The provided API key is invalid."}`,
  },
];

export default function DocsApp({ endpoints }) {
  const [tab, setTab] = useState('endpoints');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  const activeCount = endpoints.filter(e => e.is_active).length;

  const categories = useMemo(() => {
    const map = new Map();
    for (const e of endpoints) {
      const c = e.category || 'UTILITY';
      const cur = map.get(c) || { total: 0, active: 0 };
      cur.total += 1;
      if (e.is_active) cur.active += 1;
      map.set(c, cur);
    }
    return [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.active - a.active);
  }, [endpoints]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return endpoints.filter(e => {
      if (activeCategory !== 'ALL' && e.category !== activeCategory) return false;
      if (!q) return true;
      return e.path.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q);
    });
  }, [endpoints, search, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      const c = e.category || 'UTILITY';
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(e);
    }
    return [...map.entries()];
  }, [filtered]);

  const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://mzazi.shop';

  return (
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)', minHeight: '70vh' }}>
      <section className="relative overflow-hidden" style={{ paddingTop: 64, paddingBottom: 32 }}>
        <div className="absolute inset-0 pointer-events-none grid-bg" style={{ maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)' }} />
        <div className="container-site relative">
          <div className="max-w-3xl">
            <a href="/api" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A', textDecoration: 'none' }}>← Back to API</a>
            <p className="eyebrow mt-8">Reference</p>
            <h1 className="headline mt-4" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.2rem)' }}>
              API documentation<span className="accent">.</span>
            </h1>
            <p className="lede mt-5 max-w-xl">
              {activeCount} live endpoints · every endpoint below calls the real API.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-10">
            {[['endpoints', 'Endpoints'], ['guides', 'Guides']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className="mono text-[11px] uppercase tracking-[0.1em] px-4 py-2.5"
                style={{
                  background: tab === id ? '#F2A93B' : 'transparent',
                  color: tab === id ? '#14100A' : '#79818A',
                  border: `1px solid ${tab === id ? '#F2A93B' : '#262C33'}`,
                  cursor: 'pointer',
                  borderRadius: 2,
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 24, paddingBottom: 110 }}>
        <div className="container-site">
          {tab === 'guides' ? (
            <div className="max-w-3xl space-y-6">
              {GUIDES.map(g => (
                <section key={g.id} className="card card-pad">
                  <p className="eyebrow">{g.id}</p>
                  <h2 className="section-title text-2xl mt-3 mb-3" style={{ color: '#E9E7E2' }}>{g.title}</h2>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: '#AEB5BD' }}>{g.body}</p>
                  {g.code && <CodeBlock label={g.title} code={g.code} />}
                </section>
              ))}
              <section className="card card-pad">
                <h2 className="section-title text-2xl mb-3" style={{ color: '#E9E7E2' }}>Support</h2>
                <p className="text-sm" style={{ color: '#AEB5BD' }}>
                  Need help? Check the <a href="/api/status" className="link">status page</a>, the
                  {' '}<a href="/api/explorer" className="link">explorer</a>, or the
                  {' '}<a href="/contact" className="link">contact page</a>.
                </p>
              </section>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <div className="card card-pad lg:sticky lg:top-32" style={{ padding: '20px' }}>
                  <label className="label">Search</label>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="youtube, download, ai…"
                    className="input mb-4"
                  />
                  <button onClick={() => { setActiveCategory('ALL'); setSearch(''); }}
                    className="w-full text-left px-3 py-2 mono text-[11px] uppercase tracking-[0.1em]"
                    style={{ background: activeCategory === 'ALL' ? 'rgba(242,169,59,0.08)' : 'transparent', color: activeCategory === 'ALL' ? '#F2A93B' : '#79818A', border: 'none', cursor: 'pointer' }}>
                    All categories <span style={{ color: '#4C535B' }}>({activeCount} live)</span>
                  </button>
                  <div style={{ borderTop: '1px solid #1B2026', marginTop: 8, paddingTop: 8 }}>
                    {categories.map(c => (
                      <button key={c.name} onClick={() => setActiveCategory(activeCategory === c.name ? 'ALL' : c.name)}
                        className="w-full text-left px-3 py-2 mono text-[11px]"
                        style={{ background: activeCategory === c.name ? 'rgba(242,169,59,0.08)' : 'transparent', color: activeCategory === c.name ? '#F2A93B' : '#79818A', border: 'none', cursor: 'pointer' }}>
                        <span className="mr-2" style={{ color: activeCategory === c.name ? '#F2A93B' : '#4C535B' }}>{CATEGORY_CODES[c.name] || '??'}</span>
                        {CATEGORY_LABELS[c.name] || c.name}
                        <span className="ml-1" style={{ color: '#4C535B' }}>{c.active}/{c.total}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Endpoint list */}
              <div className="lg:col-span-3 space-y-10">
                {grouped.length === 0 && (
                  <div className="card card-pad text-center py-14">
                    <p className="text-sm" style={{ color: '#79818A' }}>No endpoints match your search.</p>
                  </div>
                )}
                {grouped.map(([cat, eps]) => (
                  <section key={cat} id={`cat-${encodeURIComponent(cat)}`} className="scroll-mt-32">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="mono text-[11px] font-bold px-2 py-1"
                        style={{ color: '#F2A93B', border: '1px solid rgba(242,169,59,0.4)' }}>
                        {CATEGORY_CODES[cat] || '??'}
                      </span>
                      <h2 className="section-title text-xl" style={{ color: '#E9E7E2' }}>
                        {CATEGORY_LABELS[cat] || cat}
                      </h2>
                      <span className="mono text-[10px] uppercase tracking-[0.1em]" style={{ color: '#4C535B' }}>
                        {eps.filter(e => e.is_active).length} live · {eps.length} total
                      </span>
                    </div>
                    <div className="space-y-2">
                      {eps.map(e => {
                        const isOpen = expanded === e.path;
                        const req = (e.parameters?.required || []).map(p => (typeof p === 'string' ? p : p.name));
                        const opt = (e.parameters?.optional || []).map(p => (typeof p === 'string' ? p : p.name));
                        return (
                          <div key={e.path} className="card overflow-hidden" style={{ opacity: e.is_active ? 1 : 0.55 }}>
                            <button onClick={() => setExpanded(isOpen ? null : e.path)}
                              className="w-full flex flex-wrap items-center gap-3 px-5 py-3.5 text-left" style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}>
                              <span className="mono text-[10px] font-bold px-1.5 py-0.5"
                                style={{ background: e.method === 'GET' ? 'rgba(76,125,252,0.12)' : 'rgba(242,169,59,0.1)', color: e.method === 'GET' ? '#4C7DFC' : '#F2A93B', border: `1px solid ${e.method === 'GET' ? 'rgba(76,125,252,0.35)' : 'rgba(242,169,59,0.3)'}` }}>
                                {e.method}
                              </span>
                              <code className="mono text-xs flex-1" style={{ color: '#E9E7E2' }}>{e.path}</code>
                              <span className="text-xs font-semibold hidden sm:block" style={{ color: '#79818A' }}>{e.name}</span>
                              <span className={`tag ${e.is_active ? 'tag-green' : 'tag'}`}>
                                {e.is_active ? 'Live' : 'Not configured'}
                              </span>
                              <span className="mono text-xs" style={{ color: '#4C535B' }}>{isOpen ? '−' : '+'}</span>
                            </button>

                            {isOpen && (
                              <div className="px-5 pb-5 space-y-5" style={{ borderTop: '1px solid #1B2026' }}>
                                <p className="text-sm pt-4" style={{ color: '#AEB5BD' }}>
                                  {e.description || e.name} · Provider: <code className="mono text-xs" style={{ color: '#F2A93B' }}>{e.provider || '—'}</code>
                                </p>

                                {(req.length > 0 || opt.length > 0) && (
                                  <div className="scroll-x">
                                    <table className="table-plain">
                                      <thead>
                                        <tr>
                                          <th>Parameter</th>
                                          <th>Required</th>
                                          <th>Example</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {[...req.map(n => ({ n, req: true })), ...opt.map(n => ({ n, req: false }))].map(({ n, req: isReq }) => {
                                          const def = (e.parameters?.required || []).concat(e.parameters?.optional || []).find(p => (typeof p === 'string' ? p : p.name) === n);
                                          const example = typeof def === 'object' ? def.example : null;
                                          return (
                                            <tr key={n}>
                                              <td className="mono text-xs" style={{ color: '#E9E7E2' }}>{n}</td>
                                              <td style={{ color: isReq ? '#E5484D' : '#4C535B' }}>{isReq ? 'Yes' : 'No'}</td>
                                              <td className="mono text-xs break-all" style={{ color: '#79818A' }}>{example || '—'}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                <div>
                                  <p className="mono text-[10px] uppercase tracking-[0.14em] mb-2" style={{ color: '#4C535B' }}>Example request</p>
                                  <CodeBlock label="curl" code={`curl "${BASE}${e.path}?${[...req, ...opt].map(n => `${n}=YOUR_VALUE`).join('&')}${(req.length || opt.length) ? '&' : ''}apikey=YOUR_API_KEY"`} />
                                </div>

                                {e.is_active ? (
                                  <div>
                                    <p className="mono text-[10px] uppercase tracking-[0.14em] mb-2" style={{ color: '#4C535B' }}>Live tester</p>
                                    <EndpointTester endpoint={e} />
                                  </div>
                                ) : (
                                  <p className="text-xs" style={{ color: '#F2A93B' }}>
                                    Endpoint is registered but not yet configured — it returns <code className="mono">ENDPOINT_DISABLED</code> until enabled with a verified upstream.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
