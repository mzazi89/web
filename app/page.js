import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import { unstable_noStore as noStore } from 'next/cache';
import AuthSwap from '@/components/AuthSwap';
import PwaInstallButton from '@/components/PwaInstallButton';
import { fmtMtc, fmtMtcValue, mtcToKsh } from '@/lib/currency';

export const dynamic = 'force-dynamic';

const STATS = [
  { value: '500+',   label: 'Active Panels' },
  { value: '99.9%',  label: 'Uptime' },
  { value: '24/7',   label: 'Support' },
  { value: '1,000+', label: 'Happy Clients' },
];

const FEATURES = [
  {
    icon: '🖥️',
    title: 'Pterodactyl Panels',
    desc: 'Deploy game servers instantly with full Pterodactyl panel access. Choose your resources and go live in minutes.',
    href: '/products',
    cta: 'View Plans',
  },
  {
    icon: '🤖',
    title: 'WhatsApp Bot',
    desc: 'Link your WhatsApp via Telegram bot pairing. Send /pair 254XXXXXXXXX to connect your number instantly.',
    href: '/whatsapp-bot',
    cta: 'Learn More',
  },
  {
    icon: '💳',
    title: 'Wallet System',
    desc: 'Top up via M-Pesa or card and deploy panels instantly — no repeated checkout, just one balance for everything.',
    href: '/wallet',
    cta: 'Top Up',
  },
  {
    icon: '🔌',
    title: 'MZAZI API',
    desc: 'One API. Multiple services. Downloads, AI, search, tools and more — 200+ live endpoints with one key.',
    href: '/api',
    cta: 'Explore API',
  },
];

function fmtCpu(v)  { const n = parseInt(v); return n === 0 ? 'Unlimited CPU'  : `${n}% CPU`; }
function fmtRam(v)  { const n = parseInt(v); return n === 0 ? 'Unlimited RAM'  : n >= 1024 ? `${n / 1024} GB RAM`  : `${n} MB RAM`; }
function fmtDisk(v) { const n = parseInt(v); return n === 0 ? 'Unlimited Disk' : n >= 1024 ? `${n / 1024} GB Disk` : `${n} GB`; }

async function getPackages() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT id, name, price, cpu, ram, disk, popular, accent
      FROM packages
      WHERE active = true
      ORDER BY sort_order ASC, id ASC
    `;
    return rows;
  } catch {
    return [];
  }
}

async function getApiStats() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [endpoints, requests, providers] = await Promise.all([
      sql`SELECT COUNT(*) AS total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active FROM endpoints`,
      sql`SELECT COUNT(*) AS cnt FROM api_requests`,
      sql`SELECT COUNT(*) AS cnt FROM providers WHERE status = 'active'`,
    ]);
    return {
      endpoints: parseInt(endpoints[0].active, 10) || 0,
      total: parseInt(endpoints[0].total, 10) || 0,
      requests: parseInt(requests[0].cnt, 10) || 0,
      providers: parseInt(providers[0].cnt, 10) || 0,
    };
  } catch {
    return { endpoints: 0, total: 0, requests: 0, providers: 0 };
  }
}

export default async function Home() {
  noStore();
  const packages = await getPackages();
  const api = await getApiStats();

  return (
    <div style={{ backgroundColor: '#0a0a0f' }}>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg,rgba(7,20,40,0.98) 0%,rgba(10,10,15,1) 100%)' }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.06) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Glow blobs */}
        <div className="absolute top-16 left-1/4 w-64 sm:w-96 h-64 sm:h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(37,99,235,0.18) 0%,transparent 70%)', filter: 'blur(48px)' }} />
        <div className="absolute bottom-0 right-1/4 w-56 sm:w-80 h-56 sm:h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(29,78,216,0.12) 0%,transparent 70%)', filter: 'blur(48px)' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 sm:mb-8"
            style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold" style={{ color: '#60a5fa' }}>Kenya&apos;s #1 Panel Hosting Provider</span>
          </div>

          {/* Headline */}
          <h1 className="font-extrabold mb-5 sm:mb-6 leading-tight"
            style={{ fontSize: 'clamp(2.2rem, 7vw, 4.5rem)', color: '#f0f4ff' }}>
            Power Your{' '}
            <span style={{ background: 'linear-gradient(135deg,#60a5fa,#2563eb,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Digital World
            </span>
          </h1>

          <p className="mb-8 sm:mb-10 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed px-2" style={{ color: '#64748b' }}>
            Pterodactyl panel hosting, WhatsApp automation bots, and tech solutions — all under one roof. Powered by Mzazi Tech Inc.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
            <Link href="/products"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-white text-base transition-all"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 0 28px rgba(37,99,235,0.45)', textDecoration: 'none' }}>
              🚀 Deploy a Panel
            </Link>
            <Link href="/whatsapp-bot"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#f0f4ff', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
              🤖 WhatsApp Bot
            </Link>
            <PwaInstallButton />
          </div>

          {/* Trust strip */}
          <div className="mt-10 sm:mt-14 flex flex-wrap justify-center gap-4 sm:gap-8">
            {[
              { icon: '⚡', text: 'Instant Deployment' },
              { icon: '🔒', text: 'Secure & Reliable' },
              { icon: '💬', text: '24/7 Support' },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: '#475569' }}>
                <span>{t.icon}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-10 sm:py-14" style={{ backgroundColor: '#0a0a0f', borderTop: '1px solid #0d1120', borderBottom: '1px solid #0d1120' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="font-extrabold mb-1" style={{ fontSize: 'clamp(1.6rem,4vw,2rem)', color: '#f0f4ff' }}>{s.value}</p>
                <p className="text-xs sm:text-sm" style={{ color: '#475569' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-16 sm:py-24" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#3b82f6' }}>What We Offer</p>
            <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.6rem,4vw,2.5rem)', color: '#f0f4ff' }}>
              Everything You Need
            </h2>
            <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: '#64748b' }}>
              From game servers to WhatsApp bots — deploy, manage, and scale your digital infrastructure in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {FEATURES.map(f => (
              <div key={f.title}
                className="rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 group"
                style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-base sm:text-lg mb-2" style={{ color: '#f0f4ff' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#64748b' }}>{f.desc}</p>
                <Link href={f.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold transition-all"
                  style={{ color: '#3b82f6', textDecoration: 'none' }}>
                  {f.cta} <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MZAZI API ─── */}
      <section className="py-16 sm:py-24" style={{ backgroundColor: '#0d0d1a' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(37,99,235,0.25)', background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(10,10,15,0.9) 55%)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 p-8 sm:p-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5"
                  style={{ backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>MZAZI API · One API. Multiple services.</span>
                </div>
                <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.6rem,4vw,2.5rem)', color: '#f0f4ff' }}>
                  Power Your Apps with{' '}
                  <span style={{ background: 'linear-gradient(135deg,#60a5fa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>200+ Live APIs</span>
                </h2>
                <p className="text-sm sm:text-base leading-relaxed mb-6" style={{ color: '#94a3b8' }}>
                  Downloads, AI chat, image generation, search, games, news, tools and more — behind one key,
                  one JSON envelope, with rate limits, usage analytics and a full developer dashboard.
                </p>
                <ul className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    { icon: '⚡', label: `${api.endpoints} live endpoints` },
                    { icon: '🤖', label: `${api.providers} providers integrated` },
                    { icon: '🔑', label: 'API key authentication' },
                    { icon: '📊', label: `${api.requests.toLocaleString()}+ requests served` },
                  ].map(x => (
                    <li key={x.label} className="flex items-center gap-2 text-sm" style={{ color: '#cbd5e1' }}>
                      <span>{x.icon}</span><span>{x.label}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Link href="/api"
                    className="px-6 py-3 rounded-xl font-bold text-white text-sm"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
                    Explore MZAZI API
                  </Link>
                  <Link href="/api/docs"
                    className="px-6 py-3 rounded-xl font-semibold text-sm"
                    style={{ color: '#60a5fa', border: '1px solid rgba(37,99,235,0.35)', textDecoration: 'none' }}>
                    Documentation
                  </Link>
                  <Link href="/api/dashboard/keys"
                    className="px-6 py-3 rounded-xl font-semibold text-sm"
                    style={{ color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', textDecoration: 'none' }}>
                    + Get an API Key
                  </Link>
                </div>
              </div>

              {/* Code preview */}
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a' }}>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid #1e2d4a' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f87171' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#fbbf24' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
                  <span className="ml-2 text-xs font-mono" style={{ color: '#475569' }}>GET /api/download/play</span>
                </div>
                <pre className="p-5 overflow-x-auto text-xs leading-relaxed font-mono" style={{ color: '#cbd5e1' }}>
{`{
  "status": true,
  "creator": "MZAZI TECH",
  "result": {
    "title": "Alan Walker - Faded",
    "duration": "3:33",
    "views": 4010656945,
    "download_url": "https://...",
    "video_url": "https://..."
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-16 sm:py-24" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#3b82f6' }}>Panel Plans</p>
            <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.6rem,4vw,2.5rem)', color: '#f0f4ff' }}>
              Simple, Honest Pricing
            </h2>
            <p className="text-sm sm:text-base" style={{ color: '#64748b' }}>Pay per month. Cancel anytime. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
            {packages.map(pkg => (
              <div key={pkg.id}
                className="relative rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: pkg.popular ? '#0f1a35' : '#0f1629',
                  border: `1px solid ${pkg.popular ? (pkg.accent || '#2563eb') : '#1e2d4a'}`,
                  boxShadow: pkg.popular ? `0 0 30px rgba(37,99,235,0.2)` : 'none',
                }}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <p className="font-bold text-base sm:text-lg mb-1" style={{ color: '#f0f4ff' }}>{pkg.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-extrabold" style={{ fontSize: 'clamp(1.8rem,5vw,2.25rem)', color: pkg.popular ? '#60a5fa' : '#f0f4ff' }}>
                      {fmtMtc(pkg.price)}
                    </span>
                    <span className="text-xs" style={{ color: '#475569' }}>/mo</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {[fmtCpu(pkg.cpu), fmtRam(pkg.ram), fmtDisk(pkg.disk), ...(pkg.expires_after_hours ? [`Auto-removed after ${pkg.expires_after_hours}h`] : [])].map(spec => (
                    <li key={spec} className="flex items-center gap-2.5 text-sm" style={{ color: '#94a3b8' }}>
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {spec}
                    </li>
                  ))}
                </ul>

                <Link href="/products"
                  className="block w-full py-2.5 rounded-xl text-sm font-bold text-center transition-all"
                  style={{
                    background: pkg.popular ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'transparent',
                    color: pkg.popular ? '#fff' : '#60a5fa',
                    border: pkg.popular ? 'none' : '1px solid rgba(37,99,235,0.35)',
                    textDecoration: 'none',
                  }}>
                  {pkg.popular ? 'Get Started' : 'Choose Plan'}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs mt-8" style={{ color: '#374151' }}>
            🛡️ 2-week panel replacement warranty included on all plans
          </p>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg,rgba(37,99,235,0.15) 0%,rgba(10,10,15,1) 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.5rem,4vw,2.2rem)', color: '#f0f4ff' }}>
            Ready to get started?
          </h2>
          <p className="mb-8 text-sm sm:text-base" style={{ color: '#64748b' }}>
            Create your free account, top up your wallet, and deploy your first panel in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <AuthSwap
              signedOut={
                <>
                  <Link href="/signup"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white text-base"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 0 28px rgba(37,99,235,0.4)', textDecoration: 'none' }}>
                    Create Free Account
                  </Link>
                  <Link href="/contact"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm"
                    style={{ color: '#94a3b8', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
                    Talk to Support
                  </Link>
                </>
              }
              signedIn={
                <>
                  <Link href="/dashboard"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white text-base"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 0 28px rgba(37,99,235,0.4)', textDecoration: 'none' }}>
                    Go to Dashboard
                  </Link>
                  <Link href="/api/dashboard"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm"
                    style={{ color: '#a78bfa', border: '1px solid rgba(167,139,250,0.35)', textDecoration: 'none' }}>
                    Open API Dashboard
                  </Link>
                </>
              }
            />
          </div>
        </div>
      </section>

    </div>
  );
}
