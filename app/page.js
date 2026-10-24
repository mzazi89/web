import Link from 'next/link';
import Logo from '@/components/Logo';
import { AppBackground, BotMark, CanvasArt, Card, CardHeader, Badge, Icons } from '@/components/ui';

export const metadata = {
  title: 'MZAZI TECH — WhatsApp automation made simple',
  description: 'Connect your WhatsApp, choose your bot (QUARTZ XD or MZAZI XMD) and start automating. Instant pairing codes, one dashboard for every device.',
  alternates: { canonical: 'https://www.mzazi.shop' },
};

export default function Home() {
  return (
    <AppBackground>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container-site text-center">
          <Badge tone="brand" icon={<Icons.Sparkles size={12} />}>New: Instant Pairing</Badge>
          <h1 className="headline anim-fade-up d1" style={{ marginTop: 18 }}>
            WhatsApp automation <br />
            <span className="gradient-text">made simple</span>.
          </h1>
          <p className="lede anim-fade-up d2" style={{ marginTop: 18, maxWidth: 580, marginInline: 'auto' }}>
            Connect your number in 2 minutes. No QR codes, no extra phones. Just pure automation.
          </p>
          <div className="anim-fade-up d3" style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/signup" className="btn btn-primary btn-lg">Get Started Free</Link>
            <Link href="/login" className="btn btn-ghost btn-lg">Login</Link>
          </div>
          
          <div className="anim-fade-up d4" style={{ marginTop: 56, maxWidth: 840, marginInline: 'auto' }}>
            <CanvasArt kind="mesh" ratio="21-9" />
          </div>
        </div>
      </section>

      {/* ───────────────────────── THE BOTS ───────────────────────── */}
      <section className="section">
        <div className="container-site">
          <div className="text-center" style={{ marginBottom: 32 }}>
            <h2 className="section-title">Choose Your Bot</h2>
            <p className="lede" style={{ marginInline: 'auto', maxWidth: 480 }}>
              Two powerful engines for different workloads.
            </p>
          </div>

          <div className="grid-2-responsive">
            {[
              {
                id: 'quartz',
                name: 'QUARTZ XD',
                tagline: 'The Everyday Assistant',
                desc: 'Group tools, media downloads, and 100+ commands.',
                tone: 'brand',
              },
              {
                id: 'mzazi',
                name: 'MZAZI XMD',
                tagline: 'Advanced Workflows',
                desc: 'Scheduled tasks, broadcasting, and heavy automation.',
                tone: 'blue',
              }
            ].map(bot => (
              <Card key={bot.id} accent={bot.tone === 'brand'} hover>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <BotMark name={bot.name} size={48} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{bot.name}</h3>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>{bot.tagline}</p>
                  </div>
                </div>
                <p style={{ marginTop: 14, fontSize: 14.5, color: 'var(--muted)' }}>{bot.desc}</p>
                <Link href={`/pair/${bot.id}`} className="btn btn-dark btn-block" style={{ marginTop: 18 }}>
                  Pair {bot.name} <Icons.ArrowRight size={15} />
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── HOW IT WORKS ───────────────────────── */}
      <section className="section" style={{ background: 'var(--surface)', borderBlock: '1px solid var(--line)' }}>
        <div className="container-site">
          <div className="grid-3-responsive text-center" style={{ gap: 40 }}>
            {[
              { n: '01', title: 'Connect', desc: 'Enter number & get code', icon: <Icons.Phone /> },
              { n: '02', title: 'Choose', desc: 'Select your bot profile', icon: <Icons.Bot /> },
              { n: '03', title: 'Automate', desc: 'Your bot is now live!', icon: <Icons.Zap /> },
            ].map(s => (
              <div key={s.n} style={{ display: 'grid', gap: 12 }}>
                <div style={{ width: 48, height: 48, marginInline: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-tint)', color: 'var(--brand)', borderRadius: '50%' }}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--dim)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── FINAL CTA ───────────────────────── */}
      <section className="section text-center">
        <div className="container-site">
          <Logo size={40} style={{ marginInline: 'auto' }} />
          <h2 className="headline" style={{ marginTop: 20, fontSize: '2rem' }}>Ready to start?</h2>
          <p className="lede" style={{ marginTop: 12, marginInline: 'auto', maxWidth: 400 }}>
            No card required. Free to start. Up and running in minutes.
          </p>
          <div style={{ marginTop: 24 }}>
            <Link href="/signup" className="btn btn-primary btn-lg">Get Started Free</Link>
          </div>
        </div>
      </section>
    </AppBackground>
  );
}
