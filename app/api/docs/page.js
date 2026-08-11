'use client';
import Link from 'next/link';
import CodeBlock from '@/components/api/CodeBlock';
import ApiTester from '@/components/api/ApiTester';

const BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://mzazi.shop';

const SECTIONS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'rate-limits', label: 'Rate Limits' },
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'play', label: 'Play Endpoint' },
  { id: 'errors', label: 'Errors' },
  { id: 'status-codes', label: 'HTTP Status Codes' },
  { id: 'examples', label: 'Examples' },
  { id: 'support', label: 'Support' },
];

const ERROR_EXAMPLES = [
  { code: 'MISSING_API_KEY', status: 401, body: '{"status": false, "creator": "MZAZI TECH", "error": "MISSING_API_KEY", "message": "API key is required."}' },
  { code: 'INVALID_API_KEY', status: 401, body: '{"status": false, "creator": "MZAZI TECH", "error": "INVALID_API_KEY", "message": "The provided API key is invalid."}' },
  { code: 'MISSING_QUERY', status: 400, body: '{"status": false, "creator": "MZAZI TECH", "error": "MISSING_QUERY", "message": "The query parameter is required."}' },
  { code: 'RATE_LIMITED', status: 429, body: '{"status": false, "creator": "MZAZI TECH", "error": "RATE_LIMITED", "message": "Rate limit exceeded. Please try again later."}' },
];

const EXAMPLE_RESPONSE = `{
  "status": true,
  "creator": "MZAZI TECH",
  "result": {
    "title": "Faded - Alan Walker",
    "thumbnail": "https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg",
    "duration": "3:32",
    "views": 123456789,
    "download_url": "https://cdn.example.com/media/faded.mp3",
    "video_url": "https://www.youtube.com/watch?v=60ItHLz5WEA"
  }
}`;

const EXAMPLE_CURL = `curl "${BASE_URL}/api/download/play?query=Faded%20Alan%20Walker&apikey=YOUR_API_KEY"`;

const EXAMPLE_NODE = `const res = await fetch(
  '${BASE_URL}/api/download/play?query=Faded%20Alan%20Walker&apikey=YOUR_API_KEY'
);
const data = await res.json();
console.log(data.status);   // true
console.log(data.result);   // { title, thumbnail, duration, views, download_url, video_url }`;

function Section({ id, title, children }) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="text-xl font-bold mb-4" style={{ color: '#f0f4ff' }}>{title}</h2>
      {children}
    </section>
  );
}

export default function ApiDocs() {
  return (
    <div className="container-site py-12" style={{ minHeight: '70vh' }}>
      <div className="mb-8">
        <Link href="/api" className="text-xs font-semibold" style={{ color: '#475569', textDecoration: 'none' }}>← Back to API</Link>
        <h1 className="text-3xl font-extrabold mt-2"><span className="gradient-text">MZAZI API Documentation</span></h1>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          Everything you need to build with MZAZI API by MZAZI TECH.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <nav className="card p-4 sticky top-24 space-y-1">
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`}
                className="block px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ color: '#94a3b8', textDecoration: 'none' }}
                onMouseOver={e => e.currentTarget.style.color = '#60a5fa'}
                onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3 space-y-12">

          <Section id="introduction" title="Introduction">
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#94a3b8' }}>
              MZAZI API is a developer platform by <strong style={{ color: '#f0f4ff' }}>MZAZI TECH</strong> that provides
              downloads, search, AI and utility APIs behind a single, consistent JSON interface.
              Every response uses the same envelope so your integration stays simple:
            </p>
            <CodeBlock label="Response envelope" code={`{
  "status": true,              // true = success, false = error
  "creator": "MZAZI TECH",     // platform attribution
  "result": { ... }            // payload (success only)
}`} />
          </Section>

          <Section id="authentication" title="Authentication">
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#94a3b8' }}>
              All data endpoints require an API key. Pass it as the <code className="font-mono text-xs" style={{ color: '#93c5fd' }}>apikey</code> query parameter,
              or as a Bearer token:
            </p>
            <div className="space-y-3">
              <CodeBlock lang="http" label="Query parameter" code={`GET ${BASE_URL}/api/download/play?query=Faded&apikey=mzazi_xxxxxxxxxxxxxxxxxxxxxxxxx`} />
              <CodeBlock lang="http" label="Authorization header" code={`GET ${BASE_URL}/api/download/play?query=Faded
Authorization: Bearer mzazi_xxxxxxxxxxxxxxxxxxxxxxxxx`} />
            </div>
            <p className="text-xs mt-3" style={{ color: '#64748b' }}>
              Create and manage keys from your <Link href="/api/dashboard/keys" style={{ color: '#60a5fa' }}>API dashboard</Link>.
              Keys are shown in full only once — store them securely.
            </p>
          </Section>

          <Section id="rate-limits" title="Rate Limits">
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#94a3b8' }}>
              Every API key has a daily request quota based on its plan. Responses include
              rate-limit headers:
            </p>
            <div className="card p-4 mb-4 font-mono text-xs space-y-1" style={{ color: '#93c5fd' }}>
              <p>X-RateLimit-Limit: 100</p>
              <p>X-RateLimit-Remaining: 87</p>
              <p>X-RateLimit-Reset: 1723359599999</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#0f1629', borderBottom: '1px solid #1e2d4a' }}>
                    <th className="text-left px-4 py-2.5 text-xs font-bold uppercase" style={{ color: '#64748b' }}>Plan</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold uppercase" style={{ color: '#64748b' }}>Requests / day</th>
                  </tr>
                </thead>
                <tbody>
                  {[['FREE', '100'], ['PREMIUM', '10,000'], ['BUSINESS', '100,000'], ['ADMIN', 'Unlimited']].map(r => (
                    <tr key={r[0]} style={{ borderBottom: '1px solid #0f1629' }}>
                      <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: '#f0f4ff' }}>{r[0]}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: '#94a3b8' }}>{r[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="endpoints" title="Endpoints">
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#0f1629', borderBottom: '1px solid #1e2d4a' }}>
                      <th className="text-left px-4 py-2.5 text-xs font-bold uppercase" style={{ color: '#64748b' }}>Method</th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold uppercase" style={{ color: '#64748b' }}>Path</th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold uppercase" style={{ color: '#64748b' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['GET', '/api/health', 'Live'],
                      ['GET', '/api/download/play', 'Live'],
                      ['GET', '/api/download/youtube', 'Coming soon'],
                      ['GET', '/api/download/tiktok', 'Coming soon'],
                      ['GET', '/api/download/facebook', 'Coming soon'],
                      ['GET', '/api/download/instagram', 'Coming soon'],
                      ['GET', '/api/search/youtube', 'Coming soon'],
                      ['GET', '/api/search/google', 'Coming soon'],
                      ['GET', '/api/search/image', 'Coming soon'],
                      ['POST', '/api/ai/chat', 'Coming soon'],
                      ['POST', '/api/ai/generate', 'Coming soon'],
                      ['POST', '/api/ai/imagine', 'Coming soon'],
                      ['GET', '/api/tools/qrcode', 'Coming soon'],
                      ['POST', '/api/tools/translate', 'Coming soon'],
                      ['POST', '/api/tools/shorturl', 'Coming soon'],
                    ].map(r => (
                      <tr key={r[1]} style={{ borderBottom: '1px solid #0f1629' }}>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: r[0] === 'GET' ? '#1e3a8a' : '#4c1d95', color: r[0] === 'GET' ? '#93c5fd' : '#c4b5fd' }}>
                            {r[0]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5"><code className="text-xs font-mono" style={{ color: '#e2e8f0' }}>{r[1]}</code></td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-semibold" style={{ color: r[2] === 'Live' ? '#4ade80' : '#64748b' }}>{r[2]}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          <Section id="play" title="Play Endpoint">
            <div className="card p-5 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-bold px-2 py-1 rounded" style={{ backgroundColor: '#1e3a8a', color: '#93c5fd' }}>GET</span>
                <code className="text-sm font-mono" style={{ color: '#f0f4ff' }}>/api/download/play</code>
                <span className="text-[11px] font-bold px-2 py-1 rounded" style={{ backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>LIVE</span>
              </div>
              <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
                Search and download music by title or artist name.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.25)' }}>required</span>
                  <code className="font-mono text-xs" style={{ color: '#f0f4ff' }}>query</code>
                  <span className="text-xs" style={{ color: '#64748b' }}>— search term, e.g. “Faded Alan Walker”</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.25)' }}>required</span>
                  <code className="font-mono text-xs" style={{ color: '#f0f4ff' }}>apikey</code>
                  <span className="text-xs" style={{ color: '#64748b' }}>— your MZAZI API key</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <CodeBlock lang="bash" label="Example request" code={EXAMPLE_CURL} />
              <CodeBlock lang="json" label="Example response" code={EXAMPLE_RESPONSE} />
              <CodeBlock lang="javascript" label="Node.js example" code={EXAMPLE_NODE} />
            </div>
          </Section>

          <Section id="errors" title="Errors">
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#94a3b8' }}>
              Errors always use the same envelope with a machine-readable <code className="font-mono text-xs" style={{ color: '#93c5fd' }}>error</code> code:
            </p>
            <div className="space-y-3">
              {ERROR_EXAMPLES.map(e => (
                <div key={e.code}>
                  <p className="text-xs font-mono mb-1" style={{ color: '#fca5a5' }}>
                    {e.status} · {e.code}
                  </p>
                  <CodeBlock lang="json" code={e.body} />
                </div>
              ))}
            </div>
          </Section>

          <Section id="status-codes" title="HTTP Status Codes">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#0f1629', borderBottom: '1px solid #1e2d4a' }}>
                    <th className="text-left px-4 py-2.5 text-xs font-bold uppercase" style={{ color: '#64748b' }}>Code</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold uppercase" style={{ color: '#64748b' }}>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [200, 'Success'],
                    [400, 'Bad request — missing/invalid parameters'],
                    [401, 'Missing or invalid API key'],
                    [403, 'Account suspended/banned or forbidden'],
                    [404, 'Endpoint not found or disabled'],
                    [429, 'Rate limit exceeded'],
                    [500, 'Internal error (e.g. provider not configured)'],
                    [502, 'Upstream provider error'],
                    [504, 'Upstream provider timeout'],
                  ].map(r => (
                    <tr key={r[0]} style={{ borderBottom: '1px solid #0f1629' }}>
                      <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#93c5fd' }}>{r[0]}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: '#94a3b8' }}>{r[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="examples" title="Examples">
            <div className="space-y-3">
              <CodeBlock lang="bash" label="cURL" code={EXAMPLE_CURL} />
              <CodeBlock lang="javascript" label="JavaScript" code={EXAMPLE_NODE} />
              <CodeBlock lang="python" label="Python" code={`import requests

url = "${BASE_URL}/api/download/play"
params = {"query": "Faded Alan Walker", "apikey": "YOUR_API_KEY"}
data = requests.get(url, params=params).json()

if data["status"]:
    print(data["result"]["title"])
    print(data["result"]["download_url"])`} />
              <CodeBlock lang="php" label="PHP" code={`$url = "${BASE_URL}/api/download/play?query=" . urlencode("Faded Alan Walker") . "&apikey=YOUR_API_KEY";
$data = json_decode(file_get_contents($url), true);
echo $data["result"]["title"]; // Faded - Alan Walker`} />
            </div>
          </Section>

          <Section id="support" title="Support">
            <div className="card p-6">
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#94a3b8' }}>
                Need help? Reach out through the <Link href="/contact" style={{ color: '#60a5fa' }}>contact page</Link>,
                check <Link href="/api/status" style={{ color: '#60a5fa' }}>system status</Link>, or head to the
                <Link href="/api/dashboard" style={{ color: '#60a5fa' }}> developer dashboard</Link> to monitor your usage.
              </p>
              <p className="text-xs" style={{ color: '#475569' }}>
                MZAZI TECH INC · mzazi.shop
              </p>
            </div>
          </Section>

          {/* ── Live tester ── */}
          <Section id="tester" title="Live API Tester">
            <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
              Try the real endpoint right here — enter a song name and (optionally) your API key, then hit
              <strong style={{ color: '#f0f4ff' }}> SEND REQUEST</strong>. Without a key you'll see the
              proper JSON error; with your key you'll get live results.
            </p>
            <ApiTester />
          </Section>

        </div>
      </div>
    </div>
  );
}
