import Link from 'next/link';
import { AppBackground, Icons } from '@/components/ui';
import Testimonials from '@/components/Testimonials';

// MZAZI TECH INC — homepage.
//
// Layout rhythm is deliberate: one claim (hero), what we run (services), what
// you can buy today (products), what it costs (pricing), who says so (proof),
// then one door out. Everything is a small card on a midnight field; the neon
// is in the edges, never in the type.
//
// Prices are the live ones: packages seeded in `packages` (KES 5–120/month) and
// the bot plans enforced by /api/pair/plan (KES 100/150/200/250 per 30 days).

export const metadata = {
  title: 'MZAZI TECH INC — Panels, VPS, WhatsApp Bots & API',
  description:
    'Premium infrastructure from Nairobi: managed Pterodactyl panels, NVMe VPS, WhatsApp automation and a 500-endpoint API marketplace. Innovate. Build. Grow.',
};

const SERVICES = [
  {
    href: '/products',
    Icon: Icons.Server,
    title: 'Pterodactyl Panels',
    text: 'Managed game and app servers on our own nodes, provisioned with credentials in minutes.',
    meta: 'From KES 50 / month',
  },
  {
    href: '/vps',
    Icon: Icons.Cpu,
    title: 'VPS Hosting',
    text: 'NVMe-backed KVM instances with full root access, isolated networking and instant resizes.',
    meta: 'Configure to order',
  },
  {
    href: '/api/docs',
    Icon: Icons.Code,
    title: 'API Marketplace',
    text: '525 production endpoints behind one key, one quota and one monthly bill.',
    meta: 'Free tier available',
  },
  {
    href: '/whatsapp-bot',
    Icon: Icons.Bot,
    title: 'WhatsApp Bots',
    text: 'Pair your own number and run automation on always-on infrastructure — no server to babysit.',
    meta: 'KES 100 / 30 days',
  },
  {
    href: '/products',
    Icon: Icons.Box,
    title: 'Digital Products',
    text: 'Panel setups, bot packs and deployment scripts, delivered same day with documentation.',
    meta: 'Instant delivery',
  },
];

const PRODUCTS = [
  { name: 'Panel — Starter', price: 'KES 50', unit: '/ month', note: '2 GB RAM · 10 GB disk' },
  { name: 'WhatsApp Bot — 5 devices', price: 'KES 100', unit: '/ 30 days', note: 'Unlimited commands' },
  { name: 'API key', price: 'Free', unit: 'to start', note: '250 calls / day' },
  { name: 'VPS instance', price: 'Custom', unit: 'specs', note: 'Root · NVMe · Kenya' },
];

const PLANS = [
  {
    name: 'Starter',
    price: '100',
    period: 'per 30 days',
    line: 'For one number and a small team.',
    features: ['5 devices', 'All 1,269 commands', 'Group management', 'Wallet billing', 'Email support'],
    cta: 'Start with 5 devices',
    href: '/signup',
  },
  {
    name: 'Operator',
    price: '150',
    period: 'per 30 days',
    line: 'The usual choice for growing groups.',
    features: ['10 devices', 'Everything in Starter', 'Priority queue on pairings', 'Usage analytics', 'Priority support'],
    cta: 'Choose 10 devices',
    href: '/signup',
    featured: true,
  },
  {
    name: 'Scale',
    price: '200',
    period: 'per 30 days',
    line: 'Agencies and resellers.',
    features: ['20 devices', 'Everything in Operator', 'Bulk pairing', 'Invoice billing', 'Named support contact'],
    cta: 'Talk to us',
    href: '/contact',
  },
];

export default function Home() {
  return (
    <AppBackground orbs>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container-site">
          <div className="hero-shell">
            <div>
              <span className="eyebrow anim-fade-up">MZAZI TECH INC · Nairobi → Global</span>

              <h1 className="hero-title anim-fade-up d1">
                Innovate.<br />
                Build.<br />
                <span className="gradient-text">Grow.</span>
              </h1>

              <p className="hero-sub anim-fade-up d2">
                Infrastructure for the modern internet. Panels, VPS, WhatsApp automation
                and a 500-endpoint API — one account, one wallet, one dashboard.
              </p>

              <div className="hero-cta anim-fade-up d3">
                <Link href="/signup" className="btn btn-primary btn-lg">
                  Get started
                  <Icons.ArrowRight size={15} />
                </Link>
                <Link href="/products" className="btn btn-ghost btn-lg">
                  Browse services
                </Link>
              </div>

              <dl className="hero-meta anim-fade-up d4">
                <div><dt>Uptime target</dt><dd>99.9%</dd></div>
                <div><dt>API endpoints</dt><dd>525</dd></div>
                <div><dt>Bot commands</dt><dd>1,269</dd></div>
                <div><dt>Support</dt><dd>24 / 7</dd></div>
              </dl>
            </div>

            {/* Product in situ — a control panel, not an illustration. */}
            <div className="panel-mock anim-fade-up d2" aria-hidden="true">
              <div className="panel-mock-bar">
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--dim)' }}>
                  Control panel
                </span>
                <span className="tag tag-green" style={{ fontSize: 9.5 }}>
                  <span className="dot-live" /> Live
                </span>
              </div>

              <div className="panel-mock-body">
                {[
                  ['WhatsApp bot', '5 of 10 devices', 'Online'],
                  ['Panel — Standard', 'Frankfurt · 4 GB', 'Active'],
                  ['API key · production', '2,140 / 25,000 calls', 'Healthy'],
                  ['Wallet', 'KES 1,250.00', 'Funded'],
                ].map(([name, note, value]) => (
                  <div className="pv-row" key={name}>
                    <span className="dot-live" />
                    <span>
                      <span className="pv-name">{name}</span>
                      <span className="pv-note" style={{ display: 'block' }}>{note}</span>
                    </span>
                    <span className="pv-val">{value}</span>
                  </div>
                ))}
              </div>

              <div className="panel-spark">
                {[38, 52, 44, 66, 58, 74, 62, 81, 70, 88, 79, 94].map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <section className="section" id="services">
        <div className="container-site">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, marginBottom: 14 }}>
            <div>
              <span className="eyebrow">Services</span>
              <h2 className="section-title" style={{ margin: '8px 0 0', fontSize: 'var(--text-3xl)' }}>
                Everything we run
              </h2>
            </div>
            <Link href="/products" className="btn btn-ghost" style={{ flexShrink: 0 }}>
              All products
            </Link>
          </div>

          <div className="svc-grid">
            {SERVICES.map(({ href, Icon, title, text, meta }) => (
              <Link href={href} key={title} className="svc-card">
                <span className="svc-ico"><Icon size={16} /></span>
                <h3 className="svc-title">{title}</h3>
                <p className="svc-text">{text}</p>
                <span className="svc-foot">
                  <span>{meta}</span>
                  <span className="go">Open <Icons.ArrowUpRight size={12} /></span>
                </span>
              </Link>
            ))}

            <Link href="/contact" className="svc-card" style={{ justifyContent: 'space-between' }}>
              <span className="svc-ico" style={{ color: 'var(--brand-bright)' }}><Icons.Layers size={16} /></span>
              <h3 className="svc-title">Custom engineering</h3>
              <p className="svc-text">
                Something that does not fit a template — integrations, internal tools, automation at scale.
              </p>
              <span className="svc-foot">
                <span>Scoped per project</span>
                <span className="go">Talk to us <Icons.ArrowUpRight size={12} /></span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ─────────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-site">
          <span className="eyebrow">Buy today</span>
          <div className="prod-grid" style={{ marginTop: 10 }}>
            {PRODUCTS.map((p) => (
              <div className="prod-card" key={p.name}>
                <span className="prod-name">{p.name}</span>
                <span className="prod-price">
                  {p.price} <span>{p.unit}</span>
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--dim)' }}>{p.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="section" id="pricing" style={{ paddingTop: 0 }}>
        <div className="container-site">
          <span className="eyebrow">Pricing</span>
          <h2 className="section-title" style={{ margin: '8px 0 4px', fontSize: 'var(--text-3xl)' }}>
            Pay for infrastructure, not seats
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--muted)', maxWidth: '52ch' }}>
            Billed in Kenyan shillings from your wallet. No setup fee, no lock-in — upgrade, downgrade or stop at renewal.
          </p>

          <div className="price-grid">
            {PLANS.map((plan) => (
              <div className={`price-card ${plan.featured ? 'is-featured' : ''}`} key={plan.name}>
                {plan.featured && <span className="price-tag">Most popular</span>}
                <span className="price-name">{plan.name}</span>
                <p className="price-amount">
                  <small style={{ fontSize: 11, marginRight: 3 }}>KES</small>
                  {plan.price}
                  <small>{plan.period}</small>
                </p>
                <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--muted)' }}>{plan.line}</p>

                <ul className="price-list">
                  {plan.features.map((f) => (
                    <li key={f}><Icons.Check size={12} /> {f}</li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`btn ${plan.featured ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--dim)' }}>
            Unlimited devices are available at KES 250 / 30 days. Panel hosting is sold separately, from KES 50 / month.
          </p>
        </div>
      </section>

      {/* ── PROOF ────────────────────────────────────────────────────────── */}
      <Testimonials />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-site">
          <div className="cta-band">
            <span className="eyebrow" style={{ justifyContent: 'center' }}>Ready when you are</span>
            <h2 className="section-title" style={{ margin: '10px 0 0', fontSize: 'var(--text-3xl)' }}>
              Ship your first bot tonight
            </h2>
            <p style={{ margin: '8px auto 0', maxWidth: '46ch', fontSize: 12.5, color: 'var(--muted)' }}>
              Create an account, top up the wallet with M-PESA, pair a number. Most people are live in under five minutes.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
              <Link href="/signup" className="btn btn-primary btn-lg">
                Create account <Icons.ArrowRight size={15} />
              </Link>
              <Link href="/contact" className="btn btn-ghost btn-lg">Talk to sales</Link>
            </div>
          </div>
        </div>
      </section>
    </AppBackground>
  );
}
