import Link from 'next/link';
import Logo from '@/components/Logo';
import { AppBackground, BotMark, Card, Badge, Icons } from '@/components/ui';

export const metadata = {
  title: 'Mzazi Tech — Innovative Tech Solutions & Automation',
  description: 'Founded by Dominic Mokua Kerubo. We build powerful WhatsApp bots, modern websites, and empower the next generation of tech talent.',
};

export default function Home() {
  return (
    <AppBackground 
      image="https://clouddisk.alibaba.com/sa/download?filePath=saFile/0612387aa62af8104ffb6679b7b95a19.png&fileSuffix=png&userId=4500117644369"
      imageOpacity={0.8}
      scrim={0.25}
      orbs
    >
      {/* ── HERO ── */}
      <section className="section text-center" style={{ paddingTop: 100, paddingBottom: 80 }}>
        <div className="container-site">
          <Badge tone="brand" icon={<Icons.Sparkles size={12} />}>Est. 2024</Badge>
          <h1 className="headline anim-fade-up d1" style={{ marginTop: 24, fontSize: 'clamp(3rem, 10vw, 5rem)', fontWeight: 900, lineHeight: 1.1 }}>
            Building the Future <br />
            <span className="gradient-text">of Technology</span>.
          </h1>
          <p className="lede anim-fade-up d2" style={{ marginTop: 24, maxWidth: 620, marginInline: 'auto', fontSize: '1.25rem', color: 'var(--muted)' }}>
            We specialize in professional WhatsApp automation, high-performance web solutions, and 
            expert tech education. Built in Kenya, scaling globally.
          </p>
          <div className="anim-fade-up d3" style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/signup" className="btn btn-primary btn-lg" style={{ paddingInline: 40 }}>Get Started</Link>
            <Link href="#about" className="btn btn-ghost btn-lg" style={{ paddingInline: 40 }}>Learn Our Story</Link>
          </div>
        </div>
      </section>

      {/* ── ABOUT THE FOUNDER ── */}
      <section id="about" className="section" style={{ background: 'var(--surface-2)', borderBlock: '1px solid var(--line)' }}>
        <div className="container-site">
          <div className="grid-2-responsive" style={{ alignItems: 'center', gap: 60 }}>
            <div className="anim-fade-up">
              <Badge tone="blue" style={{ marginBottom: 16 }}>Our Story</Badge>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 24, lineHeight: 1.2 }}>
                From Curiosity <br /> to <span style={{ color: 'var(--blue)' }}>Mastery</span>.
              </h2>
              <div style={{ fontSize: '1.1rem', color: 'var(--ink-2)', lineHeight: 1.8 }}>
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
            <Card accent hover style={{ padding: 40, textAlign: 'center', background: 'var(--surface)' }}>
              <div style={{ width: 80, height: 80, marginInline: 'auto', display: 'grid', placeItems: 'center', background: 'var(--brand-tint)', color: 'var(--brand)', borderRadius: '50%', marginBottom: 20 }}>
                <Icons.User size={40} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 4 }}>Dominic Mokua Kerubo</h3>
              <p style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Founder & Lead Developer</p>
              
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                <Badge tone="brand" size="sm">Fullstack</Badge>
                <Badge tone="blue" size="sm">Automation</Badge>
                <Badge tone="good" size="sm">Mentorship</Badge>
              </div>

              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
                "Success isn't just about code; it's about the persistence to keep trying until you reach perfection."
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── CORE SOLUTIONS ── */}
      <section className="section">
        <div className="container-site">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900 }}>What We Do</h2>
            <p className="lede" style={{ marginInline: 'auto', maxWidth: 500 }}>
              Tailored digital solutions for creators, businesses, and students.
            </p>
          </div>
          
          <div className="grid-3-responsive" style={{ gap: 30 }}>
            <Card hover style={{ padding: 32 }}>
              <Icons.Zap size={32} style={{ color: 'var(--brand)', marginBottom: 20 }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12 }}>WhatsApp Automation</h3>
              <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
                Deploy professional-grade bots like MZAZI XMD and QUARTZ XD to manage groups and workflows instantly.
              </p>
              <Link href="/pair/mzazi" className="link" style={{ fontWeight: 700 }}>Deploy a Bot →</Link>
            </Card>

            <Card hover style={{ padding: 32 }}>
              <Icons.Monitor size={32} style={{ color: 'var(--blue)', marginBottom: 20 }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12 }}>Web Development</h3>
              <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
                Modern, responsive websites built with the latest frameworks to give your brand a professional edge.
              </p>
              <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.5 }}>COMING SOON</span>
            </Card>

            <Card hover style={{ padding: 32 }}>
              <Icons.Sparkles size={32} style={{ color: 'var(--good)', marginBottom: 20 }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12 }}>Tech Education</h3>
              <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
                Ready to learn? We offer mentorship and courses to help you master bot creation and web development.
              </p>
              <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.5 }}>ENROLLMENT OPENING</span>
            </Card>
          </div>
        </div>
      </section>

      {/* ── THE MZAZI STANDARD ── */}
      <section className="section" style={{ background: 'var(--surface-3)', borderTop: '1px solid var(--line)' }}>
        <div className="container-site">
          <div className="grid-2-responsive" style={{ alignItems: 'center', gap: 60 }}>
            <div className="anim-fade-up">
              <Badge tone="pink" style={{ marginBottom: 16 }}>The Standard</Badge>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 24, lineHeight: 1.2 }}>
                Engineered for <br /> <span style={{ color: 'var(--pink)' }}>Performance</span>.
              </h2>
              <div className="space-y-6">
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: '0 0 auto', width: 44, height: 44, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', display: 'grid', placeItems: 'center', color: 'var(--brand)' }}>
                    <Icons.Shield size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4 }}>Zero Compromise Security</h4>
                    <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
                      We use industrial-grade encryption and isolated sessions to ensure your data and WhatsApp accounts stay safe.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: '0 0 auto', width: 44, height: 44, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', display: 'grid', placeItems: 'center', color: 'var(--blue)' }}>
                    <Icons.Zap size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4 }}>High-Speed Deployment</h4>
                    <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
                      Our infrastructure is optimized for Kenya and East Africa, providing the lowest latency for local businesses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="anim-fade-up d2" style={{ position: 'relative' }}>
              <Card style={{ padding: 40, background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-xl)' }}>
                <div style={{ display: 'flex', gap: 2, color: '#FFD700', marginBottom: 16 }}>
                  <Icons.Star size={16} fill="currentColor" />
                  <Icons.Star size={16} fill="currentColor" />
                  <Icons.Star size={16} fill="currentColor" />
                  <Icons.Star size={16} fill="currentColor" />
                  <Icons.Star size={16} fill="currentColor" />
                </div>
                <p style={{ fontSize: '1.2rem', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 24, color: 'var(--ink)' }}>
                  "MZAZI TECH transformed how I handle customer inquiries. The automation is flawless and the support from Dominic is top-notch."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontWeight: 800, color: 'var(--brand)' }}>JD</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>John Doe</div>
                    <div style={{ fontSize: 12, color: 'var(--dim)' }}>Verified Merchant</div>
                  </div>
                </div>
              </Card>
              {/* Decorative elements */}
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'var(--brand-tint)', filter: 'blur(40px)', borderRadius: '50%', zIndex: -1 }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section" style={{ paddingBottom: 120 }}>
        <div className="container-site">
          <Card style={{ padding: 60, textAlign: 'center', background: 'var(--surface-2)', border: '1px solid var(--line)' }} className="anim-fade-up">
            <h2 className="headline" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900 }}>
              Start Your <span className="gradient-text">Mastery</span> Today.
            </h2>
            <p className="lede mt-6 max-w-xl mx-auto">
              Whether you are looking to automate your business or learn the skills to build the future, MZAZI TECH is your partner.
            </p>
            <div style={{ marginTop: 40, display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link href="/signup" className="btn btn-primary btn-lg px-12">Get Started</Link>
              <Link href="/community" className="btn btn-ghost btn-lg px-12">Join Community</Link>
            </div>
          </Card>
        </div>
      </section>

    </AppBackground>
  );
}


