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

export default function Home() {
  return (
    <div style={{ backgroundColor: '#0a0a0f' }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #0d1530 50%, #0a0a0f 100%)' }}>
        {/* Grid background */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        {/* Glow orbs */}
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
      <section className="py-20" style={{ backgroundColor: '#0d0d1a' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold" style={{ color: '#f0f4ff' }}>Everything You Need</h2>
            <p className="mt-3" style={{ color: '#64748b' }}>One platform. All your tech needs covered.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map(f => (
              <div key={f.title} className="p-8 rounded-2xl transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
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

      {/* Testimonials */}
      <Testimonials />

      {/* CTA */}
      <section className="py-20 relative overflow-hidden" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 70%)'
        }} />
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
