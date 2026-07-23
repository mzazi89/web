import Link from 'next/link';

const channels = [
  {
    icon: '💬',
    title: 'Telegram Bot',
    desc: 'Get instant support and link your WhatsApp bot via our Telegram bot.',
    action: 'Message @mrsmzazixdbot',
    href: 'https://t.me/mrsmzazixdbot',
  },
  {
    icon: '📱',
    title: 'WhatsApp',
    desc: 'Chat with our support team directly on WhatsApp for quick responses.',
    action: 'Chat on WhatsApp',
    href: 'https://wa.me/254108595201',
  },
  {
    icon: '📧',
    title: 'Email',
    desc: 'Send us an email for billing, partnerships, and formal inquiries.',
    action: 'mzazitechinc@gmail.com',
    href: 'mzazitechinc@gmail.com',
  },
];

export default function ContactPage() {
  return (
    <div style={{ backgroundColor: '#0a0a0f' }}>
      <section className="relative py-24" style={{ background: 'linear-gradient(180deg, #071428, #0a0a0f)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-extrabold mb-4" style={{ color: '#f0f4ff' }}>Contact Us</h1>
          <p className="text-lg" style={{ color: '#64748b' }}>We're here to help. Reach out through any of the channels below and our team will respond promptly.</p>
        </div>
      </section>

      <section className="py-20" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {channels.map(c => (
              <div key={c.title} className="p-6 rounded-2xl text-center transition-all hover:scale-105" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
                <div className="text-4xl mb-4">{c.icon}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#f0f4ff' }}>{c.title}</h3>
                <p className="text-sm mb-6" style={{ color: '#64748b' }}>{c.desc}</p>
                <a href={c.href} target="_blank" rel="noopener noreferrer"
                  className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>
                  {c.action}
                </a>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-8" style={{ backgroundColor: '#16182a', border: '1px solid rgba(37,99,235,0.3)' }}>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#f0f4ff' }}>Quick Links</h2>
            <p className="mb-6" style={{ color: '#64748b' }}>Looking for something specific? These links might help.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Deploy a Panel', href: '/products', desc: 'Set up a new Pterodactyl server' },
                { label: 'WhatsApp Bot Setup', href: '/whatsapp-bot', desc: 'Link your WhatsApp via Telegram' },
                { label: 'Top Up Wallet', href: '/wallet', desc: 'Add funds via M-Pesa or card' },
                { label: 'Dashboard', href: '/dashboard', desc: 'Manage all your services' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="flex items-start space-x-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a' }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#60a5fa' }}>{l.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{l.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
