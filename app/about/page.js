import Link from 'next/link';
import AuthSwap from '@/components/AuthSwap';
import { AppBackground, Card, Badge, Icons } from '@/components/ui';

const values = [
  { num: '01', title: 'Speed First', desc: 'Deploy servers in under 2 minutes. No waiting, no friction — just instant results.', icon: <Icons.Zap size={24} /> },
  { num: '02', title: 'Security', desc: 'Enterprise-grade security with encrypted connections and isolated server environments.', icon: <Icons.Shield size={24} /> },
  { num: '03', title: 'Global Inclusion', desc: 'Built for everyone. Mobile money (M-Pesa), card payments, and simple local pricing.', icon: <Icons.Wifi size={24} /> },
  { num: '04', title: 'Constant Mastery', desc: 'We never stop learning. Our products evolve every day to match the latest tech standards.', icon: <Icons.Sparkles size={24} /> },
];

const timeline = [
  { date: 'Early 2024', title: 'The Spark', desc: 'Dominic writes his first WhatsApp bot script between BCOM lectures at Cooperative University.' },
  { date: 'Mid 2024', title: 'Evolution', desc: 'MZAZI XMD is born, focusing on modern automation and user-friendly pairing flows.' },
  { date: 'Late 2024', title: 'MZAZI TECH Launch', desc: 'Official transition from a hobby project to a full-service tech solutions provider.' },
  { date: 'Current', title: 'Scaling Perfection', desc: 'Serving thousands of users with automation, hosting, and professional APIs.' },
];

const STORY_STATS = [
  { n: '500+', l: 'Active panels' },
  { n: '1000+', l: 'Happy clients' },
  { n: '99.9%', l: 'Uptime SLA' },
  { n: '24/7', l: 'Support hours' },
];

export const metadata = {
  title: 'About Us — MZAZI TECH',
  description: 'The journey of Dominic Mokua Kerubo and the vision behind MZAZI TECH.',
};

export default function AboutPage() {
  return (
    <AppBackground 
      image="https://clouddisk.alibaba.com/sa/download?filePath=saFile/0612387aa62af8104ffb6679b7b95a19.png&fileSuffix=png&userId=4500117644369"
      imageOpacity={0.4}
      scrim={0.65}
      orbs
    >
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="container-site relative py-24 sm:py-32">
          <div className="max-w-3xl anim-fade-up">
            <Badge tone="brand" icon={<Icons.Info size={12} />}>Our Story</Badge>
            <h1 className="headline mt-6" style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1 }}>
              Turning Curiosity Into <br />
              <span className="gradient-text">Mastery</span>.
            </h1>
            <p className="lede mt-8 max-w-2xl" style={{ fontSize: '1.25rem', color: 'var(--muted)' }}>
              MZAZI TECH is a Kenyan-born innovation hub. Founded by a student who refused to accept 
              "good enough," we build the tools that power the digital economy.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 anim-fade-up d2" style={{ borderTop: '1px solid var(--line-soft)' }}>
            {STORY_STATS.map(s => (
              <div key={s.l}>
                <div className="stat-num" style={{ color: 'var(--brand)', fontSize: '2.5rem', fontWeight: 800 }}>{s.n}</div>
                <div className="stat-label" style={{ fontSize: '0.9rem', color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE FOUNDER'S JOURNEY ── */}
      <section className="section" style={{ background: 'var(--surface-2)', borderBlock: '1px solid var(--line)' }}>
        <div className="container-site">
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 anim-fade-up">
              <div style={{ position: 'sticky', top: 100 }}>
                <Badge tone="blue" style={{ marginBottom: 16 }}>The Visionary</Badge>
                <h2 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: 24, lineHeight: 1.2 }}>
                  Dominic Mokua <br />
                  <span style={{ color: 'var(--blue)' }}>Kerubo</span>.
                </h2>
                <Card accent style={{ padding: 0, overflow: 'hidden', background: 'var(--surface)' }}>
                  <div style={{ padding: 32 }}>
                    <Icons.User size={48} style={{ color: 'var(--brand)', marginBottom: 20 }} />
                    <p className="display text-xl font-bold leading-snug" style={{ color: 'var(--ink)', marginBottom: 16 }}>
                      "I didn't start with a team or a budget. I started with a laptop and a stubborn refusal to give up on a bug."
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                      Dominic is a BCOM student at the <strong>Cooperative University of Kenya</strong>. 
                      He balances corporate strategy studies with late-night coding sessions, building 
                      the very platforms he uses to teach others.
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-10 anim-fade-up d2">
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16 }}>The Early Days</h3>
                <p style={{ fontSize: '1.1rem', color: 'var(--ink-2)', lineHeight: 1.8 }}>
                  In early 2024, Dominic began exploring the world of WhatsApp automation. Most existing 
                  solutions were either too expensive or too difficult for the average Kenyan user to deploy. 
                  He saw an opportunity to democratize tech.
                </p>
              </div>
              
              <div className="space-y-6">
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>The Milestone Timeline</h3>
                <div className="space-y-4">
                  {timeline.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 20, padding: 24, background: 'var(--surface-3)', borderRadius: 'var(--r-md)', border: '1px solid var(--line-soft)' }}>
                      <div style={{ color: 'var(--brand)', fontWeight: 800, whiteSpace: 'nowrap', width: 100 }}>{item.date}</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16 }}>Ready to Lead</h3>
                <p style={{ fontSize: '1.1rem', color: 'var(--ink-2)', lineHeight: 1.8 }}>
                  Today, Dominic is no longer just "trying." He is perfect. Mzazi Tech has become a standard 
                  for reliability in the Kenyan tech space, providing high-speed hosting and 
                  enterprise-grade automation to businesses across the continent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ── */}
      <section className="section">
        <div className="container-site">
          <div className="text-center max-w-3xl mx-auto mb-16 anim-fade-up">
            <Badge tone="good">Our Pillars</Badge>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: 16 }}>What Drives MZAZI TECH</h2>
            <p className="lede" style={{ marginTop: 16 }}>
              We build on a foundation of integrity, speed, and continuous improvement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 anim-fade-up d2">
            {values.map(v => (
              <Card key={v.title} hover style={{ padding: 32 }}>
                <div style={{ color: 'var(--brand)', marginBottom: 20 }}>{v.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 12 }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── EDUCATION & COMMUNITY ── */}
      <section className="section" style={{ background: 'var(--surface-3)', borderTop: '1px solid var(--line)' }}>
        <div className="container-site">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="anim-fade-up">
              <Badge tone="pink">Education Hub</Badge>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: 16, marginBottom: 24 }}>
                We Don&apos;t Just Build. <br />
                We <span style={{ color: 'var(--pink)' }}>Empower</span>.
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--ink-2)', lineHeight: 1.8, marginBottom: 24 }}>
                Dominic believes that the future of Kenya is digital. That&apos;s why Mzazi Tech is launching 
                a dedicated Tech Education Hub. We will be offering courses in:
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="space-y-4">
                {[
                  'Advanced WhatsApp Bot Development',
                  'Full-Stack Web Engineering',
                  'Server Management & Deployment',
                  'Automation Workflows for Small Business'
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '1.05rem', fontWeight: 600 }}>
                    <Icons.CheckCircle size={20} style={{ color: 'var(--good)' }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="anim-fade-up d2">
              <Card accent style={{ padding: 40, background: 'var(--surface)' }}>
                <Icons.Sparkles size={40} style={{ color: 'var(--pink)', marginBottom: 20 }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16 }}>Enrollment Coming Soon</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
                  Stay tuned for our official launch. We are building a community where curiosity is 
                  rewarded with the tools to build something real.
                </p>
                <Link href="/community" className="btn btn-primary w-full">Join the Waitlist Chat</Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section" style={{ paddingBottom: 120 }}>
        <div className="container-site">
          <Card style={{ padding: 60, textAlign: 'center', background: 'var(--surface-2)', border: '1px solid var(--line)' }} className="anim-fade-up">
            <h2 className="headline" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900 }}>
              Ready to Join the <span className="gradient-text">Movement</span>?
            </h2>
            <p className="lede mt-6 max-w-xl mx-auto">
              Whether you need powerful automation or high-performance hosting, 
              MZAZI TECH is ready to take your business to the next level.
            </p>
            <div style={{ marginTop: 40 }}>
              <AuthSwap
                signedOut={
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/signup" className="btn btn-primary btn-lg px-12">Get Started Now</Link>
                    <Link href="/contact" className="btn btn-ghost btn-lg px-12">Talk to Dominic</Link>
                  </div>
                }
                signedIn={
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/dashboard" className="btn btn-primary btn-lg px-12">Back to Dashboard</Link>
                  </div>
                }
              />
            </div>
          </Card>
        </div>
      </section>
    </AppBackground>
  );
}
