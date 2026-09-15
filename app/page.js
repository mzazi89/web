import Link from 'next/link';
import Logo from '@/components/Logo';
import { AppBackground, BotMark, Card, CardHeader, Badge, Icons } from '@/components/ui';

// MZAZI TECH — landing page.
//
// Answers three questions before the fold: what is this, what do I do, what
// happens next. Hero stays deliberately sparse — the product cards and feature
// list carry the detail lower down.

export const metadata = {
  title: 'MZAZI TECH — WhatsApp automation made simple',
  description:
    'Connect your WhatsApp, choose your bot (QUARTZ XD or MZAZI XMD) and start automating. Instant pairing codes, one dashboard for every device.',
  alternates: { canonical: 'https://www.mzazi.shop' },
};

const STATS = [
  { value: '2 min', label: 'To connect a number' },
  { value: '24/7', label: 'Bot uptime' },
  { value: 'Fast', label: 'Pairing codes' },
  { value: 'KES', label: 'Local wallet & Paystack' },
];

const BOTS = [
  {
    id: 'quartz',
    name: 'QUARTZ XD',
    tagline: 'Powerful WhatsApp automation.',
    desc: 'The everyday bot. Group management, downloads, stickers, polls and 100+ commands — ready the moment you pair.',
    points: ['100+ built-in commands', 'Group & admin tools', 'Media downloads'],
    tone: 'brand',
  },
  {
    id: 'mzazi',
    name: 'MZAZI XMD',
    tagline: 'Advanced automation tools.',
    desc: 'For heavier workloads. Everything in QUARTZ XD plus automation workflows, scheduled tasks and multi-group broadcasting.',
    points: ['Everything in QUARTZ XD', 'Scheduled & automated tasks', 'Multi-group broadcast'],
    tone: 'blue',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Connect your WhatsApp',
    desc: 'Enter your number and we generate a pairing code. No QR scanning, no re-installing WhatsApp.',
    icon: <Icons.WhatsApp size={20} />,
  },
  {
    n: '02',
    title: 'Choose your bot',
    desc: 'Pick QUARTZ XD for everyday automation or MZAZI XMD for advanced workflows.',
    icon: <Icons.Bot size={20} />,
  },
  {
    n: '03',
    title: 'Start automating',
    desc: 'Your bot comes online immediately. Manage every device, plan and payment from one dashboard.',
    icon: <Icons.Zap size={20} />,
  },
];

const FEATURES = [
  {
    title: 'One dashboard for every number',
    desc: 'See every connected WhatsApp number, which bot is serving it, and whether it is live — in one place.',
    icon: <Icons.Phone size={19} />,
    href: '/devices',
    cta: 'Connected Devices',
  },
  {
    title: 'Simple, affordable plans',
    desc: 'Start free with one number. Scale to 5, 10, 20 or unlimited devices for a flat monthly fee.',
    icon: <Icons.CreditCard size={19} />,
    href: '/subscription',
    cta: 'See plans',
  },
  {
    title: 'Pay your way',
    desc: 'Top up your wallet and pay with Paystack — mobile money or card. Every receipt is saved to your account.',
    icon: <Icons.Wallet size={19} />,
    href: '/payments',
    cta: 'Payments',
  },
  {
    title: 'Help when you need it',
    desc: 'Step-by-step guides for pairing, device limits and billing — plus real humans on WhatsApp and Telegram.',
    icon: <Icons.Help size={19} />,
    href: '/help',
    cta: 'Help centre',
  },
];

export default function Home() {
  return (
    <AppBackground variant="hero" orbs>
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section>
        <div className="container-site" style={{ paddingTop: 56, paddingBottom: 48 }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <p className="eyebrow center anim-fade-up" style={{ justifyContent: 'center' }}>
              WhatsApp automation
            </p>

            <h1 className="headline anim-fade-up d1" style={{ marginTop: 18 }}>
              Powerful WhatsApp
              <br />
              automation <span className="accent">made simple</span>.
            </h1>

            <p className="lede anim-fade-up d2" style={{ marginTop: 18, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
              Connect your WhatsApp. Choose your bot. Start automating.
            </p>

            <div
              className="anim-fade-up d3"
              style={{ marginTop: 26, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <Link href="/signup" className="btn btn-primary btn-lg">
                Get Started
                <Icons.ArrowRight size={17} />
              </Link>
              <Link href="/login" className="btn btn-ghost btn-lg">
                Login
              </Link>
            </div>

            <p style={{ marginTop: 16, fontSize: 13, color: 'var(--dim)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icons.CheckCircle size={14} />
              Free to start — no card required
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Bot profiles ───────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-site">
          <p className="eyebrow">Choose your bot</p>
          <h2 className="section-title" style={{ marginTop: 14 }}>
            Two bots. One account.
          </h2>
          <p className="lede" style={{ marginTop: 10, maxWidth: 560 }}>
            Both bots run on the same platform, so you can connect a number to either one and manage
            them side by side.
          </p>

          <div className="grid-2-responsive" style={{ marginTop: 28 }}>
            {BOTS.map((bot) => (
              <Card key={bot.id} accent={bot.tone === 'brand'} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <BotMark name={bot.name} size={54} />
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                      {bot.name}
                    </h3>
                    <p style={{ margin: '3px 0 0', fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>
                      {bot.tagline}
                    </p>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.65 }}>{bot.desc}</p>

                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                  {bot.points.map((p) => (
                    <li key={p} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 14, color: 'var(--ink-2)' }}>
                      <span style={{ color: 'var(--good)', marginTop: 1, flex: '0 0 auto' }} aria-hidden="true">
                        <Icons.Check size={15} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>

                <Link href="/signup" className="btn btn-dark btn-block" style={{ marginTop: 'auto' }}>
                  Use {bot.name}
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Stats ───────────────────────── */}
      <section style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', background: 'var(--surface)' }}>
        <div className="container-site">
          <dl
            className="grid grid-cols-2 lg:grid-cols-4"
            style={{ margin: 0, padding: '28px 0', gap: 20 }}
          >
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <dd className="stat-num" style={{ margin: 0 }}>{s.value}</dd>
                <dt className="stat-label">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ───────────────────────── How it works ───────────────────────── */}
      <section className="section">
        <div className="container-site">
          <p className="eyebrow">How it works</p>
          <h2 className="section-title" style={{ marginTop: 14 }}>
            Connected in three steps.
          </h2>

          <ol
            className="grid-cards"
            style={{ listStyle: 'none', margin: '28px 0 0', padding: 0 }}
          >
            {STEPS.map((s) => (
              <li key={s.n}>
                <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 40, height: 40, flex: '0 0 40px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 'var(--r-md)',
                        background: 'linear-gradient(135deg, var(--brand-tint), var(--pink-tint) 55%, var(--blue-tint))',
                        color: 'var(--brand)',
                      }}
                    >
                      {s.icon}
                    </span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 700 }}>STEP {s.n}</span>
                  </div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>{s.title}</h3>
                  <p style={{ margin: 0, fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.65 }}>{s.desc}</p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────────────────── Features ───────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-site">
          <p className="eyebrow">Everything in one place</p>
          <h2 className="section-title" style={{ marginTop: 14 }}>
            One account for the whole platform.
          </h2>

          <div className="grid-2-responsive" style={{ marginTop: 28 }}>
            {FEATURES.map((f) => (
              <Card key={f.title} hover style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <CardHeader
                  title={f.title}
                  description={f.desc}
                  icon={f.icon}
                />
                <Link
                  href={f.href}
                  style={{
                    marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 14, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none',
                  }}
                >
                  {f.cta}
                  <Icons.ArrowRight size={15} />
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Pricing teaser ───────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-site">
          <Card
            accent
            style={{
              display: 'grid', gap: 22, padding: 28,
              background: 'linear-gradient(135deg, var(--surface), var(--surface-2))',
            }}
          >
            <div>
              <Badge tone="brand" icon={<Icons.Sparkles size={12} />}>Plans</Badge>
              <h2 className="section-title" style={{ marginTop: 12 }}>
                Free to start. Scale when you need to.
              </h2>
              <p className="lede" style={{ marginTop: 10, maxWidth: 520 }}>
                Begin with one number at no cost. Move up to 5, 10, 20 or unlimited devices —
                paid plans start at KES 100 per 30 days, paid from your wallet.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['1 device', '5 devices', '10 devices', '20 devices', 'Unlimited'].map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/subscription" className="btn btn-primary">
                View plans
                <Icons.ArrowRight size={17} />
              </Link>
              <Link href="/devices" className="btn btn-ghost">
                See connected devices
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* ───────────────────────── Closing CTA ───────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-site" style={{ textAlign: 'center' }}>
          <Logo size={46} />
          <h2 className="headline" style={{ marginTop: 20, fontSize: 'clamp(1.7rem, 4.4vw, 2.6rem)' }}>
            Ready to automate your WhatsApp?
          </h2>
          <p className="lede" style={{ marginTop: 14, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Create an account, connect a number and have your bot running in about two minutes.
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn btn-primary btn-lg">
              Get Started
              <Icons.ArrowRight size={17} />
            </Link>
            <Link href="/contact" className="btn btn-ghost btn-lg">Talk to us</Link>
          </div>
        </div>
      </section>
    </AppBackground>
  );
}
