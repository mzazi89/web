import Link from 'next/link';

const STATS = [
  { value: '500+',   label: 'Active Panels' },
  { value: '99.9%',  label: 'Uptime' },
  { value: '24/7',   label: 'Support' },
  { value: '1,000+', label: 'Happy Clients' },
];

const PACKAGES = [
  { name: 'Starter',  price: 50,  cpu: '20% CPU',       ram: '512 MB RAM',    disk: '2 GB',       popular: false, accent: '#1e3a8a' },
  { name: 'Standard', price: 75,  cpu: '50% CPU',       ram: '1 GB RAM',      disk: '5 GB',       popular: true,  accent: '#2563eb' },
  { name: 'Premium',  price: 100, cpu: '100% CPU',      ram: '5 GB RAM',      disk: '10 GB',      popular: false, accent: '#1d4ed8' },
  { name: 'Ultimate', price: 120, cpu: 'Unlimited CPU', ram: 'Unlimited RAM', disk: 'Unlimited',  popular: false, accent: '#4f46e5' },
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
];

export default function Home() {
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
            <span className="text-xs sm:text-sm font-semibold" style={{ color: '#60a5fa' }}>Kenya's #1 Panel Hosting Provider</span>
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
      <section style={{ backgroundColor: '#0f1629', borderTop: '1px solid #1e2d4a', borderBottom: '1px solid #1e2d4a' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="font-extrabold mb-1" style={{ fontSize: 'clamp(1.75rem,5vw,2.5rem)', color: '#3b82f6' }}>{s.value}</p>
                <p className="text-xs sm:text-sm" style={{ color: '#64748b' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services ─── */}
      <section className="py-16 sm:py-24" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#3b82f6' }}>What We Offer</p>
            <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.6rem,4vw,2.5rem)', color: '#f0f4ff' }}>
              Everything You Need
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base px-2" style={{ color: '#64748b' }}>
              From game server hosting to WhatsApp automation — Mzazi Tech has you covered.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES.map(f => (
              <div key={f.title}
                className="group p-6 sm:p-7 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
                <div className="text-3xl sm:text-4xl mb-4">{f.icon}</div>
                <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#64748b' }}>{f.desc}</p>
                <Link href={f.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all"
                  style={{ color: '#3b82f6', textDecoration: 'none' }}>
                  {f.cta}
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-16 sm:py-24" style={{ backgroundColor: '#0d0d1a' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#3b82f6' }}>Panel Plans</p>
            <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.6rem,4vw,2.5rem)', color: '#f0f4ff' }}>
              Simple, Honest Pricing
            </h2>
            <p className="text-sm sm:text-base" style={{ color: '#64748b' }}>Pay per month. Cancel anytime. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
            {PACKAGES.map(pkg => (
              <div key={pkg.name}
                className="relative rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: pkg.popular ? '#0f1a35' : '#0f1629',
                  border: `1px solid ${pkg.popular ? pkg.accent : '#1e2d4a'}`,
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
                      KSH {pkg.price}
                    </span>
                    <span className="text-xs" style={{ color: '#475569' }}>/mo</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {[pkg.cpu, pkg.ram, pkg.disk].map(spec => (
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
          </div>
        </div>
      </section>

    </div>
  );
}
