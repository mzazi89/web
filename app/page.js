import Link from 'next/link';
import Logo from '@/components/Logo';
import { AppBackground, Card, Badge, Icons } from '@/components/ui';

export const metadata = {
  title: 'Mzazi Tech — Innovative Tech Solutions & Automation',
  description: 'Founded by Dominic Mokua Kerubo. We build powerful WhatsApp bots, modern websites, and empower the next generation of tech talent.',
};

export default function Home() {
  return (
    <AppBackground 
      orbs
    >
      {/* ── HERO ── */}
      <section className="section text-center" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="container-site">
          <Badge tone="brand" icon={<Icons.Sparkles size={12} />}>Est. 2024</Badge>
          <h1 className="headline anim-fade-up d1" style={{ marginTop: 12, fontWeight: 800, lineHeight: 1.12 }}>
            Building the Future <br />
            <span className="gradient-text">of Technology</span>.
          </h1>
          <p className="lede anim-fade-up d2" style={{ marginTop: 12, maxWidth: 560, marginInline: 'auto', color: 'var(--muted)' }}>
            We specialize in professional WhatsApp automation, high-performance web solutions, and 
            expert tech education. Built in Kenya, scaling globally.
          </p>
          <div className="anim-fade-up d3" style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/signup" className="btn btn-primary btn-lg" style={{ paddingInline: 40 }}>Get Started</Link>
            <Link href="#about" className="btn btn-ghost btn-lg" style={{ paddingInline: 40 }}>Learn Our Story</Link>
          </div>
        </div>
      </section>

      {/* ── ABOUT THE FOUNDER ── */}
      <section id="about" className="section" style={{ background: 'var(--surface-2)', borderBlock: '1px solid var(--line)' }}>
        <div className="container-site">
          <div className="grid-2-responsive" style={{ alignItems: 'center', gap: 24 }}>
            <div className="anim-fade-up">
              <Badge tone="blue" style={{ marginBottom: 16 }}>Our Story</Badge>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
                From Curiosity <br /> to <span style={{ color: 'var(--blue)' }}>Mastery</span>.
              </h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--ink-2)', lineHeight: 1.8 }}>
                <p style={{ marginBottom: 16 }}>
                  <strong>MZAZI TECH</strong> was founded in 2024 by <strong>Dominic Mokua Kerubo</strong>, 
                  a visionary BCOM student at the Cooperative University of Kenya.
                </p>
                <p style={{ marginBottom: 16 }}>
                  What started as a solo journey of "trying and failing" to build bots and websites 
                  has evolved into a pursuit of perfection. Dominic didn't just learn tech—he mastered it.
                </p>
                <p>
                  Today, Mzazi Tech is ready to share that knowledge. We don't just build solutions; 
                  we teach others how to build their own digital futures.
                </p>
              </div>
            </div>
            <Card accent hover style={{ padding: 24, textAlign: 'center', background: 'var(--surface)' }}>
              <div style={{ width: 80, height: 80, marginInline: 'auto', display: 'grid', placeItems: 'center', background: 'var(--brand-tint)', color: 'var(--brand)', borderRadius: '50%', marginBottom: 20 }}>
                <Icons.User size={40} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 4 }}>Dominic Mokua Kerubo</h3>
              <p style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 13.5, marginBottom: 16 }}>Founder & Lead Developer</p>
              
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                <Badge tone="brand" size="sm">Fullstack</Badge>
                <Badge tone="blue" size="sm">Automation</Badge>
                <Badge tone="good" size="sm">Mentorship</Badge>
              </div>

              <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                "Success isn't just about code; it's about the persistence to keep trying until you reach perfection."
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── CORE SOLUTIONS ── */}
      <section className="section">
        <div className="container-site">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>What We Do</h2>
            <p className="lede" style={{ marginInline: 'auto', maxWidth: 500 }}>
              Tailored digital solutions for creators, businesses, and students.
            </p>
          </div>
          
          <div className="grid-3-responsive" style={{ gap: 22 }}>
            <Card hover style={{ padding: 23 }}>
              <Icons.Zap size={32} style={{ color: 'var(--brand)', marginBottom: 20 }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 12 }}>WhatsApp Automation</h3>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
                Deploy professional-grade bots like MZAZI XMD and QUARTZ XD to manage groups and workflows instantly.
              </p>
              <Link href="/pair/mzazi" className="link" style={{ fontWeight: 700 }}>Deploy a Bot →</Link>
            </Card>

            <Card hover style={{ padding: 23 }}>
              <Icons.Monitor size={32} style={{ color: 'var(--blue)', marginBottom: 20 }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 12 }}>Web Development</h3>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
                Modern, responsive websites built with the latest frameworks to give your brand a professional edge.
              </p>
              <span style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.5 }}>COMING SOON</span>
            </Card>

            <Card hover style={{ padding: 23 }}>
              <Icons.Sparkles size={32} style={{ color: 'var(--good)', marginBottom: 20 }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 12 }}>Tech Education</h3>
              <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
                Ready to learn? We offer mentorship and courses to help you master bot creation and web development.
              </p>
              <span style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.5 }}>ENROLLMENT OPENING</span>
            </Card>
          </div>
        </div>
      </section>

      {/* ── THE MZAZI STANDARD ── */}
      <section className="section" style={{ background: 'var(--surface-3)', borderTop: '1px solid var(--line)' }}>
        <div className="container-site">
          <div className="grid-2-responsive" style={{ alignItems: 'center', gap: 24 }}>
            <div className="anim-fade-up">
              <Badge tone="pink" style={{ marginBottom: 16 }}>The Standard</Badge>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
                Engineered for <br /> <span style={{ color: 'var(--pink)' }}>Performance</span>.
              </h2>
              <div className="space-y-4">
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: '0 0 auto', width: 44, height: 44, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', display: 'grid', placeItems: 'center', color: 'var(--brand)' }}>
                    <Icons.Shield size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 4 }}>Zero Compromise Security</h4>
                    <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                      We use industrial-grade encryption and isolated sessions to ensure your data and WhatsApp accounts stay safe.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: '0 0 auto', width: 44, height: 44, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', display: 'grid', placeItems: 'center', color: 'var(--blue)' }}>
                    <Icons.Zap size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 4 }}>High-Speed Deployment</h4>
                    <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                      Our infrastructure is optimized for Kenya and East Africa, providing the lowest latency for local businesses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="anim-fade-up d2">
              <Card style={{ padding: 16, textAlign: 'center', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'center', color: 'var(--warn)', marginBottom: 10 }}>
                  {[0,1,2,3,4].map(i => <Icons.Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 12 }}>
                  Builders, students and businesses across Kenya rate their MZAZI TECH experience — read real reviews or share your own.
                </p>
                <Link href="/testimonials" className="btn btn-ghost btn-sm">Read reviews</Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container-site">
          <Card style={{ padding: 24, textAlign: 'center', background: 'var(--surface-2)', border: '1px solid var(--line)' }} className="anim-fade-up">
            <h2 className="headline" style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.1rem)', fontWeight: 800 }}>
              Start Your <span className="gradient-text">Mastery</span> Today.
            </h2>
            <p className="lede mt-4 max-w-xl mx-auto">
              Whether you are looking to automate your business or learn the skills to build the future, MZAZI TECH is your partner.
            </p>
            <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link href="/signup" className="btn btn-primary btn-lg px-6">Get Started</Link>
              <Link href="/community" className="btn btn-ghost btn-lg">Explore Community</Link>
            </div>
          </Card>
        </div>
      </section>

    </AppBackground>
  );
}


