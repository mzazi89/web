import Link from 'next/link';
import Testimonials from '../components/Testimonials';

const stats = [
  { value: '500+', label: 'Active Panels' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
  { value: '1000+', label: 'Happy Clients' },
];

const features = [
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
    desc: 'Link your WhatsApp via Telegram bot pairing. Command /pair 254XXXXXXXXX to connect your number instantly.',
    href: '/whatsapp-bot',
    cta: 'Learn More',
  },
  {
    icon: '💳',
    title: 'Wallet System',
    desc: 'Top up your wallet via M-Pesa/Paystack and use your balance to deploy panels instantly without repeated checkout.',
    href: '/wallet',
    cta: 'Top Up',
  },
];

const packages = [
  { name: 'Starter', price: 50, cpu: '20% CPU', ram: '512MB RAM', color: '#1e3a8a', glow: 'rgba(30,58,138,0.4)' },
  { name: 'Standard', price: 75, cpu: '50% CPU', ram: '1GB RAM', color: '#1d4ed8', glow: 'rgba(29,78,216,0.4)', popular: true },
  { name: 'Premium', price: 100, cpu: '100% CPU', ram: '5GB RAM', color: '#2563eb', glow: 'rgba(37,99,235,0.4)' },
  { name: 'Ultimate', price: 120, cpu: 'Unlimited', ram: 'Unlimited', color: '#1d4ed8', glow: 'rgba(29,78,216,0.4)' },
];

const contributors = [
  {
    name: 'DOMINIC MOKUA KERUBO',
    role: 'Founder',
    company: 'Mzazi Tech',
    initials: 'DM',
    color: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    glow: 'rgba(37,99,235,0.35)',
    badge: '🚀',
  },
  {
    name: 'ANTONY OCHIENG',
    role: 'Founder',
    company: 'Blacklord Tech',
    initials: 'AO',
    color: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
    glow: 'rgba(124,58,237,0.35)',
    badge: '⚡',
  },
  {
    name: 'BIG BROTHER',
    role: 'Founder',
    company: 'Darknode XMD',
    initials: 'BB',
    color: 'linear-gradient(135deg, #0f766e, #0d9488)',
    glow: 'rgba(15,118,110,0.35)',
    badge: '🌐',
  },
];

export default function Home() {
  return (
    <div style={{ backgroundColor: 'transparent' }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(10,10,15,0.92) 0%, rgba(13,21,48,0.92) 50%, rgba(10,10,15,0.92) 100%)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative max-w-7xl mx-auto px-4 py-28 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full mb-8" style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>Kenya's #1 Panel Hosting Provider</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span style={{ color: '#f0f4ff' }}>Power Your</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Digital World
            </span>
          </h1>

          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: '#64748b' }}>
            Pterodactyl panel hosting, WhatsApp automation bots, and tech solutions — all under one roof. Powered by Mzazi Tech Inc.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products" className="px-8 py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 inline-block"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 0 30px rgba(37,99,235,0.4)' }}>
              View Plans — From KSH 50
            </Link>
            <Link href="/about" className="px-8 py-4 rounded-xl font-bold text-lg inline-block transition-all duration-200"
              style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>
              Learn More
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
            {stats.map(s => (
              <div key={s.label} className="p-6 rounded-2xl" style={{ backgroundColor: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)' }}>
                <div className="text-3xl font-extrabold mb-1" style={{ color: '#60a5fa' }}>{s.value}</div>
                <div className="text-sm" style={{ color: '#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20" style={{ backgroundColor: 'rgba(13,13,26,0.85)', backdropFilter: 'blur(4px)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold" style={{ color: '#f0f4ff' }}>Everything You Need</h2>
            <p className="mt-3" style={{ color: '#64748b' }}>One platform. All your tech needs covered.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map(f => (
              <div key={f.title} className="p-8 rounded-2xl transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: 'rgba(22,24,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid #1e2d4a' }}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#f0f4ff' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#64748b' }}>{f.desc}</p>
                <Link href={f.href} className="inline-flex items-center text-sm font-semibold" style={{ color: '#3b82f6' }}>
                  {f.cta}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contributors */}
      <section className="py-20" style={{ backgroundColor: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(4px)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)' }}>
              <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: 600 }}>🤝 Project Contributors</span>
            </div>
            <h2 className="text-4xl font-extrabold mb-4" style={{ color: '#f0f4ff' }}>
              Built by Visionaries
            </h2>
            <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>
              The founders and innovators who brought this platform to life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contributors.map((c) => (
              <div
                key={c.name}
                style={{
                  backgroundColor: 'rgba(22,24,42,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #1e2d4a',
                  borderRadius: '20px',
                  padding: '36px 28px',
                  textAlign: 'center',
                  transition: 'transform 0.25s, box-shadow 0.25s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = `0 12px 40px ${c.glow}`;
                  e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#1e2d4a';
                }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: c.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '26px', fontWeight: 800, color: '#fff',
                    boxShadow: `0 0 28px ${c.glow}`,
                    margin: '0 auto',
                  }}>
                    {c.initials}
                  </div>
                  {/* Badge */}
                  <div style={{
                    position: 'absolute', bottom: 0, right: -4,
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundColor: '#0a0a0f', border: '2px solid #1e2d4a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px',
                  }}>
                    {c.badge}
                  </div>
                </div>

                <h3 style={{ color: '#f0f4ff', fontWeight: 800, fontSize: '16px', marginBottom: '6px', lineHeight: 1.3 }}>
                  {c.name}
                </h3>
                <p style={{ color: '#60a5fa', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  {c.role}
                </p>
                <p style={{ color: '#475569', fontSize: '13px' }}>{c.company}</p>

                {/* Decorative line */}
                <div style={{
                  width: '40px', height: '2px', margin: '16px auto 0',
                  background: c.color, borderRadius: '2px',
                }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <div style={{ backgroundColor: 'rgba(13,13,26,0.85)', backdropFilter: 'blur(4px)' }}>
        <Testimonials />
      </div>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden" style={{ backgroundColor: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(4px)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />
        <div className="relative max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-extrabold mb-4" style={{ color: '#f0f4ff' }}>Ready to Deploy?</h2>
          <p className="text-lg mb-8" style={{ color: '#64748b' }}>Create your account, top up your wallet, and launch your panel in under 2 minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-8 py-4 rounded-xl font-bold text-white inline-block transition-all"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 0 30px rgba(37,99,235,0.4)' }}>
              Get Started Free
            </Link>
            <Link href="/contact" className="px-8 py-4 rounded-xl font-bold inline-block transition-all"
              style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>
              Talk to Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
