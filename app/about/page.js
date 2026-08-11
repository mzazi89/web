import Link from 'next/link';
import AuthSwap from '@/components/AuthSwap';
import { fmtMtc, fmtMtcValue, mtcToKsh } from '@/lib/currency';

const values = [
  { icon: '⚡', title: 'Speed First', desc: 'Deploy servers in under 2 minutes. No waiting, no friction — just instant results.' },
  { icon: '🔒', title: 'Security', desc: 'Enterprise-grade security with encrypted connections and isolated server environments.' },
  { icon: '🇰🇪', title: 'Kenya Focused', desc: 'Built for Kenyan businesses. M-Pesa payments, local support, MTC coin pricing.' },
  { icon: '💬', title: '24/7 Support', desc: 'Our team is always available via Telegram to help you with any issue.' },
];

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#0a0a0f' }}>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden" style={{ background: 'linear-gradient(180deg, #071428, #0a0a0f)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full inline-block mb-6" style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>
            About Us
          </span>
          <h1 className="text-5xl font-extrabold mb-6" style={{ color: '#f0f4ff' }}>
            We Power Kenya's
            <br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Digital Infrastructure
            </span>
          </h1>
          <p className="text-lg" style={{ color: '#64748b' }}>
            MZAZI TECH INC is a Kenyan Tech Company specializing in game server hosting, WhatsApp automation, public APIs, and digital infrastructure solutions. We believe powerful technology should be affordable and accessible to everyone.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold mb-6" style={{ color: '#f0f4ff' }}>Our Mission</h2>
              <p className="text-lg mb-6" style={{ color: '#64748b' }}>
                To democratize access to powerful cloud infrastructure for Kenyan businesses and individuals. We offer enterprise-level Pterodactyl panel hosting at prices anyone can afford — starting from just 5 MTC/month.
              </p>
              <p className="text-lg" style={{ color: '#64748b' }}>
                From small WhatsApp bots to large-scale game servers and pterodactyl panels for WhatsApp bots, we provide the infrastructure backbone so you can focus on what matters — building your product.
              </p>
              <p className="text-lg mt-6" style={{ color: '#64748b' }}>
                We also run <strong style={{ color: '#f0f4ff' }}>MZAZI API</strong> — a developer platform with 200+ live endpoints for downloads, AI, search, tools and more, powered by multiple upstream providers and secured with API-key authentication and usage analytics.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: '500+', l: 'Active Panels' },
                { n: '1000+', l: 'Happy Clients' },
                { n: '99.9%', l: 'Uptime SLA' },
                { n: '24/7', l: 'Support Hours' },
              ].map(s => (
                <div key={s.l} className="p-6 rounded-2xl text-center" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
                  <div className="text-3xl font-extrabold mb-1" style={{ color: '#3b82f6' }}>{s.n}</div>
                  <div className="text-sm" style={{ color: '#64748b' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20" style={{ backgroundColor: '#0d0d1a' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold" style={{ color: '#f0f4ff' }}>Our Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(v => (
              <div key={v.title} className="p-6 rounded-2xl" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: '#f0f4ff' }}>{v.title}</h3>
                <p className="text-sm" style={{ color: '#64748b' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MZAZI API */}
      <section className="py-20" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="rounded-3xl p-8 sm:p-12 text-center" style={{ border: '1px solid rgba(37,99,235,0.25)', background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(10,10,15,0.9) 60%)' }}>
            <div className="text-4xl mb-4">🔌</div>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#f0f4ff' }}>MZAZI API</h2>
            <p className="text-sm sm:text-base max-w-2xl mx-auto mb-8" style={{ color: '#94a3b8' }}>
              One API. Multiple services. Downloads, AI chat, image generation, search, games, news and tools —
              exposed through a single key, a single JSON envelope, with rate limits and usage analytics.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { n: '200+', l: 'Live Endpoints' },
                { n: '15+',  l: 'Categories' },
                { n: '2',    l: 'Providers' },
                { n: '24/7', l: 'Availability' },
              ].map(s => (
                <div key={s.l} className="p-5 rounded-2xl" style={{ backgroundColor: 'rgba(10,10,15,0.6)', border: '1px solid #1e2d4a' }}>
                  <div className="text-2xl font-extrabold mb-1" style={{ color: '#60a5fa' }}>{s.n}</div>
                  <div className="text-xs" style={{ color: '#64748b' }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/api" className="px-7 py-3 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>Explore the API</Link>
              <Link href="/api/docs" className="px-7 py-3 rounded-xl font-bold text-sm"
                style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>Documentation</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-extrabold mb-4" style={{ color: '#f0f4ff' }}>Ready to get started?</h2>
          <p className="mb-8" style={{ color: '#64748b' }}>Join hundreds of Kenyans already using MZAZI TECH for their hosting needs.</p>
          <AuthSwap
            signedOut={
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup" className="px-8 py-4 rounded-xl font-bold text-white inline-block"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>Get Started</Link>
                <Link href="/contact" className="px-8 py-4 rounded-xl font-bold inline-block"
                  style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>Contact Us</Link>
              </div>
            }
            signedIn={
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard" className="px-8 py-4 rounded-xl font-bold text-white inline-block"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>Go to Dashboard</Link>
                <Link href="/api/dashboard" className="px-8 py-4 rounded-xl font-bold inline-block"
                  style={{ backgroundColor: 'rgba(167,139,250,0.1)', color: '#c084fc', border: '1px solid rgba(167,139,250,0.3)' }}>Open API Dashboard</Link>
              </div>
            }
          />
        </div>
      </section>
    </div>
  );
}
