import Link from 'next/link';
import Logo from '@/components/Logo';

const FEATURES = [
  {
    num: '01',
    title: 'Pterodactyl panels',
    desc: 'Game servers and apps, provisioned in minutes. Four tiers from KES 50 — panel, egg and nest selected live from the API.',
    tag: 'From KES 50/mo',
    href: '/products',
  },
  {
    num: '02',
    title: 'WhatsApp automation',
    desc: 'Pair your number with the MZAZI bot, run commands from WhatsApp or Telegram, manage every device from one dashboard.',
    tag: 'Pair in 2 min',
    href: '/whatsapp-bot',
  },
  {
    num: '03',
    title: 'Developer API',
    desc: 'One key, two providers, a live explorer and a status page. Rate-limited, logged, and ready for production traffic.',
    tag: 'Free API keys',
    href: '/api',
  },
  {
    num: '04',
    title: 'Wallet & referrals',
    desc: 'Top up with Paystack, pay for panels from your balance, and earn commission on every friend you bring in.',
    tag: 'KES wallet',
    href: '/wallet',
  },
];

const STATS = [
  { value: '99.9%', label: 'Uptime target' },
  { value: '2 min', label: 'Panel deploy time' },
  { value: '24/7', label: 'Support coverage' },
  { value: 'KES', label: 'Local wallet' },
];

export default function Home() {
  return (
    <>
      {/* ─── Hero — left-aligned editorial ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none grid-bg" style={{ maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 75%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 75%)' }} />

        <div className="container-site relative pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Copy */}
            <div className="lg:col-span-7">
              <p className="eyebrow anim-fade-up">Infrastructure, Kenya-built</p>
              <h1 className="headline anim-fade-up d1 mt-5" style={{ color: '#E9E7E2' }}>
                Power your
                <br />
                digital world<span className="accent">.</span>
              </h1>
              <p className="lede anim-fade-up d2 mt-6 max-w-xl">
                Mzazi Tech is a Nairobi-born infrastructure company. We sell Pterodactyl panels,
                run WhatsApp automation, and expose a developer API — one wallet, one team,
                support that actually answers.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-9 anim-fade-up d3">
                <Link href="/signup" className="btn btn-primary">
                  Create free account
                </Link>
                <Link href="/products" className="btn btn-ghost">
                  Browse panels
                </Link>
              </div>

              <p className="mono text-[11px] uppercase tracking-[0.16em] mt-8" style={{ color: '#4C535B' }}>
                Trusted by hundreds of customers — <span style={{ color: '#79818A' }}>est. Nairobi, Kenya</span>
              </p>
            </div>

            {/* Live status card */}
            <div className="lg:col-span-5">
              <div className="card card-pad anim-fade-up d2" style={{ background: 'rgba(20,24,29,0.85)', backdropFilter: 'blur(8px)' }}>
                <div className="flex items-center justify-between mb-6">
                  <span className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#4C535B' }}>Live status</span>
                  <span className="tag tag-green"><span className="dot anim-pulse" /> Operational</span>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'Pterodactyl API', meta: '4/4 nodes', ok: true },
                    { name: 'WhatsApp pairing', meta: 'MZAZIBOT', ok: true },
                    { name: 'Paystack webhooks', meta: 'verified', ok: true },
                    { name: 'Developer API', meta: '2 providers', ok: true },
                  ].map(s => (
                    <div key={s.name} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #1B2026' }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#E9E7E2' }}>{s.name}</p>
                        <p className="mono text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: '#4C535B' }}>{s.meta}</p>
                      </div>
                      <span className="dot" style={{ color: '#3ECF8E' }} />
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: '#4C535B' }}>Response &lt; 120ms</span>
                  <span className="mono text-[10px] uppercase tracking-[0.14em]" style={{ color: '#F2A93B' }}>Nairobi — KE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 sm:mt-20 pt-10" style={{ borderTop: '1px solid #1B2026' }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div className="stat-num" style={{ color: '#E9E7E2' }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── What we build — numbered rows ─── */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container-site">
          <div className="max-w-3xl mb-12">
            <p className="eyebrow">What we build</p>
            <h2 className="section-title text-3xl sm:text-4xl mt-4" style={{ color: '#E9E7E2' }}>
              Four products, one account
              <span className="bar" />
            </h2>
          </div>

          <div>
            {FEATURES.map(f => (
              <Link key={f.num} href={f.href} className="row-item" style={{ textDecoration: 'none', display: 'grid' }}>
                <span className="row-num">/{f.num}</span>
                <div>
                  <h3 style={{ color: '#E9E7E2' }}>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
                <span className="row-tag">{f.tag} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured — split panels / whatsapp ─── */}
      <section className="section">
        <div className="container-site">
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/products" className="glow-card card-pad flex flex-col justify-between min-h-[280px]" style={{ textDecoration: 'none' }}>
              <div>
                <span className="tag tag-amber mb-6">Pterodactyl hosting</span>
                <h3 className="text-2xl mb-3" style={{ color: '#E9E7E2' }}>A panel in under two minutes</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#79818A' }}>
                  Pick a tier, choose your nest and egg, pay with the wallet — credentials land in your
                  dashboard instantly. Replacement warranty included.
                </p>
              </div>
              <span className="mono text-[11px] uppercase tracking-[0.14em] mt-8" style={{ color: '#F2A93B' }}>
                View plans →
              </span>
            </Link>

            <Link href="/whatsapp-bot" className="glow-card card-pad flex flex-col justify-between min-h-[280px]" style={{ textDecoration: 'none' }}>
              <div>
                <span className="tag tag-green mb-6">WhatsApp automation</span>
                <h3 className="text-2xl mb-3" style={{ color: '#E9E7E2' }}>One bot, every device</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#79818A' }}>
                  Pair numbers from the website or Telegram with the MZAZIBOT keyword. Sessions are
                  managed from the admin — unlink to log out, delete to wipe.
                </p>
              </div>
              <span className="mono text-[11px] uppercase tracking-[0.14em] mt-8" style={{ color: '#3ECF8E' }}>
                How pairing works →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── About — editorial two-column ─── */}
      <section className="section" style={{ background: 'rgba(255,255,255,0.014)' }}>
        <div className="container-site grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">About</p>
            <h2 className="section-title text-3xl mt-4" style={{ color: '#E9E7E2' }}>
              Built in Nairobi,<br />run worldwide
              <span className="bar" />
            </h2>
          </div>
          <div className="lg:col-span-8 space-y-8">
            <p className="lede">
              Mzazi Tech Inc started with a simple frustration — world-class digital infrastructure
              was priced out of reach for most of Africa. So we built the thing we wished existed:
              panels, bots and APIs, sold honestly, supported by humans.
            </p>
            <blockquote className="border-l-2 pl-6 py-2" style={{ borderColor: '#F2A93B' }}>
              <p className="display text-xl sm:text-2xl font-semibold leading-snug" style={{ color: '#E9E7E2' }}>
                “Power your digital world.”
              </p>
              <footer className="mono text-[10px] uppercase tracking-[0.18em] mt-3" style={{ color: '#4C535B' }}>
                The Mzazi motto
              </footer>
            </blockquote>
            <p className="text-sm leading-relaxed" style={{ color: '#79818A' }}>
              Our vision is straightforward: become Africa&apos;s default infrastructure provider.
              Our mission is the daily work — reliable hosting, honest pricing, and support that
              replies within two hours, around the clock.
            </p>
            <Link href="/about" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#F2A93B', textDecoration: 'none' }}>
              Read the full story →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA band ─── */}
      <section className="section" style={{ paddingBottom: 110 }}>
        <div className="container-site">
          <div className="card card-pad text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #14181D 0%, #0F1215 100%)' }}>
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(242,169,59,0.08) 0%, transparent 55%)' }} />
            <div className="relative">
              <Logo size={44} />
              <h2 className="headline mt-6" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
                Start in under two minutes<span className="accent">.</span>
              </h2>
              <p className="lede max-w-lg mx-auto mt-4 text-sm">
                Create an account, top up your wallet, and deploy your first panel — no tickets,
                no waiting.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <Link href="/signup" className="btn btn-primary">Create free account</Link>
                <Link href="/contact" className="btn btn-ghost">Talk to support</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
