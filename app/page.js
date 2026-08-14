import Link from 'next/link';
import TypingHeading from '@/components/TypingHeading';
import Logo from '@/components/Logo';

export default function Home() {
  return (
    <div style={{ backgroundColor: 'rgba(2,4,9,0.45)' }}>

      {/* ─── Hero / About ─── */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg,rgba(7,20,40,0.98) 0%,rgba(2,4,9,1) 100%)' }}>
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

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-32 text-center">
          {/* Logo */}
          <div className="mx-auto mb-8 flex justify-center">
            <Logo size={80} />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 sm:mb-8"
            style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold" style={{ color: '#60a5fa' }}>MZAZI TECH — About Us</span>
          </div>

          {/* Headline */}
          <h1 className="font-extrabold mb-6 leading-tight"
            style={{ fontSize: 'clamp(2.2rem, 6.5vw, 4rem)', color: '#f0f4ff' }}>
            <TypingHeading as="span" text="Power Your Digital World" speed={65} highlight="Digital World" />
          </h1>

          <p className="mb-10 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed px-2" style={{ color: '#94a3b8' }}>
            Mzazi Tech Inc is a technology company built on one belief — world-class digital
            infrastructure should be within everyone&apos;s reach. From Pterodactyl panel hosting and
            WhatsApp automation to developer APIs, we power ideas, businesses and dreams.
          </p>

          {/* Get Started */}
          <div className="flex justify-center px-4 sm:px-0">
            <Link href="/signup"
              className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-white text-base transition-all"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 0 32px rgba(37,99,235,0.5)', textDecoration: 'none', display: 'inline-block' }}>
              🚀 Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* ─── About Us ─── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="section-title text-3xl sm:text-4xl mb-6" style={{ color: '#f0f4ff' }}>
            About Us
            <span className="bar" />
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: '#94a3b8' }}>
            Mzazi Tech Inc is a Kenya-born technology company delivering reliable digital services
            to customers around the world. We specialise in Pterodactyl panel hosting, WhatsApp
            automation bots, developer APIs and instant digital tools — everything you need to
            build, run and scale, all under one roof. Our platform is powered by modern
            infrastructure, secured by design, and supported by a team that is available around the
            clock.
          </p>
        </div>
      </section>

      {/* ─── Vision ─── */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: 'rgba(37,99,235,0.04)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="glow-card p-8 sm:p-10">
            <div className="text-4xl mb-4">🔭</div>
            <h2 className="section-title text-3xl sm:text-4xl mb-4" style={{ color: '#f0f4ff' }}>
              Our Vision
              <span className="bar" />
            </h2>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: '#94a3b8' }}>
              To be Africa&apos;s leading digital infrastructure provider — a platform where any
              individual or business can access world-class technology, without barriers.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Mission ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="glow-card p-8 sm:p-10">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="section-title text-3xl sm:text-4xl mb-4" style={{ color: '#f0f4ff' }}>
              Our Mission
              <span className="bar" />
            </h2>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: '#94a3b8' }}>
              To deliver reliable, affordable and innovative hosting and automation solutions —
              backed by honest pricing and 24/7 support — so our customers can focus on what
              truly matters: building their future.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Motto ─── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h2 className="section-title text-3xl sm:text-4xl mb-6" style={{ color: '#f0f4ff' }}>
            Our Motto
            <span className="bar" style={{ marginLeft: 'auto', marginRight: 'auto' }} />
          </h2>
          <blockquote className="text-2xl sm:text-3xl font-extrabold leading-snug gradient-text">
            &ldquo;Power Your Digital World.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm" style={{ color: '#64748b' }}>
            Mzazi Tech Inc — trusted by hundreds of customers worldwide.
          </p>
        </div>
      </section>

    </div>
  );
}
