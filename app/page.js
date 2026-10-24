import Link from 'next/link';
import Logo from '@/components/Logo';
import { AppBackground, BotMark, Card, Badge, Icons } from '@/components/ui';

export const metadata = {
  title: 'Mzazi Tech — Professional WhatsApp Automation',
  description: 'Deploy MZAZI XMD or QUARTZ XD in seconds. No QR codes needed.',
};

export default function Home() {
  return (
    <AppBackground>
      {/* ── HERO ── */}
      <section className="section text-center" style={{ paddingTop: 80, paddingBottom: 60 }}>
        <div className="container-site">
          <Badge tone="brand" icon={<Icons.Zap size={12} />}>Professional Grade</Badge>
          <h1 className="headline anim-fade-up d1" style={{ marginTop: 24, fontSize: 'clamp(2.5rem, 8vw, 4.2rem)', fontWeight: 900 }}>
            Automate WhatsApp <br />
            <span className="gradient-text">Without Limits</span>.
          </h1>
          <p className="lede anim-fade-up d2" style={{ marginTop: 20, maxWidth: 540, marginInline: 'auto', fontSize: '1.15rem' }}>
            Powerful bots for groups and workflows. Pair in seconds using just your phone number — no QR scan or hosting required.
          </p>
          <div className="anim-fade-up d3" style={{ marginTop: 36, display: 'flex', gap: 14, justifyContent: 'center' }}>
            <Link href="/signup" className="btn btn-primary btn-lg" style={{ paddingInline: 32 }}>Get Started</Link>
            <Link href="/login" className="btn btn-ghost btn-lg" style={{ paddingInline: 32 }}>Login</Link>
          </div>
        </div>
      </section>

      {/* ── BOTS ── */}
      <section className="section" style={{ background: 'var(--surface-2)', borderBlock: '1px solid var(--line)' }}>
        <div className="container-site">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Choose Your Bot</h2>
          </div>
          <div className="grid-2-responsive" style={{ gap: 24 }}>
            {[
              { 
                id: 'mzazi', 
                name: 'MZAZI XMD', 
                desc: 'Workflow automation, multi-group broadcast, and advanced task scheduling.',
                features: ['Broadcasts', 'Scheduling', 'Custom API'],
                tone: 'blue' 
              },
              { 
                id: 'quartz', 
                name: 'QUARTZ XD', 
                desc: 'Everyday group management, sticker creation, and 100+ social commands.',
                features: ['Group Management', 'Media Tools', 'Social'],
                tone: 'brand' 
              },
            ].map(bot => (
              <Card key={bot.id} accent={bot.tone === 'brand'} hover style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <BotMark name={bot.name} size={48} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{bot.name}</h3>
                    <Badge tone={bot.tone} size="sm">Stable v3.0</Badge>
                  </div>
                </div>
                <p style={{ margin: '16px 0', fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{bot.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                  {bot.features.map(f => <span key={f} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', background: 'var(--brand-tint)', color: 'var(--brand)', borderRadius: 4 }}>{f}</span>)}
                </div>
                <Link href={`/pair/${bot.id}`} className="btn btn-dark btn-block" style={{ padding: 12 }}>
                  Pair {bot.name} <Icons.ArrowRight size={16} />
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY MZAZI ── */}
      <section className="section">
        <div className="container-site">
          <div className="grid-3-responsive" style={{ textAlign: 'center', gap: 40 }}>
            {[
              { icon: <Icons.Shield size={28} />, title: 'Secure', desc: 'Encrypted sessions and private database storage.' },
              { icon: <Icons.Zap size={28} />, title: 'Instant', desc: 'Pair via code in under 15 seconds. No QR needed.' },
              { icon: <Icons.Zap size={28} />, title: 'Reliable', desc: '99.9% uptime with professional cloud hosting.' },
            ].map((f, i) => (
              <div key={i} className="anim-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div style={{ marginInline: 'auto', width: 56, height: 56, display: 'grid', placeItems: 'center', background: 'var(--brand-tint)', color: 'var(--brand)', borderRadius: '50%', marginBottom: 16 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="section text-center" style={{ borderTop: '1px solid var(--line)', paddingBlock: 40 }}>
        <div className="container-site">
          <Logo size={24} style={{ marginInline: 'auto', opacity: 0.5 }} />
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--dim)' }}>
            © {new Date().getFullYear()} Mzazi Tech Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </AppBackground>
  );
}
