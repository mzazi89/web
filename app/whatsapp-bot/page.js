import Link from 'next/link';

const steps = [
  {
    step: '01',
    title: 'Open the Telegram Bot',
    desc: 'Click the button below to open our official Telegram bot. Search @mrsmzazixdbot on Telegram or click the link.',
    icon: '📱',
    action: { label: 'Open @mrsmzazixdbot', href: 'https://t.me/mrsmzazixdbot' },
  },
  {
    step: '02',
    title: 'Start the Bot',
    desc: 'Send /start to the bot to initialize. The bot will respond with a welcome message and available commands.',
    icon: '▶️',
    code: '/start',
  },
  {
    step: '03',
    title: 'Pair Your WhatsApp',
    desc: 'Use the /pair command followed by your Kenyan phone number in international format (254XXXXXXXXX) to generate a pairing code.',
    icon: '🔗',
    code: '/pair 254712345678',
  },
  {
    step: '04',
    title: 'Enter the Code in WhatsApp',
    desc: 'Open WhatsApp → Linked Devices → Link a Device → Link with Phone Number. Enter the pairing code the bot sends you.',
    icon: '✅',
  },
];

const features = [
  { icon: '⚡', title: 'Instant Pairing', desc: 'Link your WhatsApp number in seconds via our Telegram bot — no QR code scanning needed.' },
  { icon: '🤖', title: 'Bot Commands', desc: 'Manage your bot, send broadcasts, auto-reply messages, and run custom automation workflows.' },
  { icon: '🔒', title: 'Secure Connection', desc: 'Your WhatsApp is connected securely. No passwords are stored — only a session token.' },
  { icon: '📊', title: '24/7 Uptime', desc: 'Your bot runs on our high-availability infrastructure, ensuring it\'s always online.' },
  { icon: '🌍', title: 'Kenya Numbers', desc: 'Optimized for Kenyan phone numbers (254XXXXXXXXX). Works on all Safaricom, Airtel & Telkom numbers.' },
  { icon: '💬', title: 'Multi-Group Support', desc: 'Manage multiple WhatsApp groups and broadcast lists from one dashboard.' },
];

export default function WhatsAppBotPage() {
  return (
    <div style={{ backgroundColor: '#0a0a0f' }}>
      {/* Hero */}
      <section className="relative overflow-hidden py-20" style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #071428 50%, #0a0a0f 100%)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full mb-6" style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <span className="text-green-400 text-lg">●</span>
            <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>WhatsApp Bot Service — Active</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6" style={{ color: '#f0f4ff' }}>
            Connect Your
            <br />
            <span style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              WhatsApp Bot
            </span>
          </h1>

          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#64748b' }}>
            Link your WhatsApp number through our Telegram bot in under 2 minutes. No technical skills needed — just one simple command.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://t.me/mrsmzazixdbot" target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl font-bold text-white inline-flex items-center space-x-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 0 30px rgba(37,99,235,0.4)' }}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
              <span>Open @mrsmzazixdbot on Telegram</span>
            </a>
          </div>
        </div>
      </section>

      {/* How to pair */}
      <section className="py-20" style={{ backgroundColor: '#0d0d1a' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#f0f4ff' }}>How to Link Your WhatsApp</h2>
            <p style={{ color: '#64748b' }}>Follow these 4 simple steps using Telegram</p>
          </div>

          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={s.step} className="flex gap-6 p-6 rounded-2xl transition-all" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">{s.icon}</span>
                    <h3 className="font-bold text-lg" style={{ color: '#f0f4ff' }}>{s.title}</h3>
                  </div>
                  <p className="text-sm mb-3" style={{ color: '#64748b' }}>{s.desc}</p>
                  {s.code && (
                    <div className="inline-flex items-center space-x-3 px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid rgba(37,99,235,0.3)' }}>
                      <span className="font-mono font-bold text-sm" style={{ color: '#60a5fa' }}>{s.code}</span>
                      <span className="text-xs" style={{ color: '#475569' }}>— send this to the bot</span>
                    </div>
                  )}
                  {s.action && (
                    <a href={s.action.href} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                      </svg>
                      <span>{s.action.label}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Command reference */}
          <div className="mt-10 p-6 rounded-2xl" style={{ backgroundColor: '#16182a', border: '1px solid rgba(37,99,235,0.3)' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: '#f0f4ff' }}>📋 Quick Command Reference</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { cmd: '/start', desc: 'Initialize the bot' },
                { cmd: '/pair 254XXXXXXXXX', desc: 'Link your WhatsApp number' },
                { cmd: '/status', desc: 'Check your connection status' },
                { cmd: '/help', desc: 'List all available commands' },
              ].map(c => (
                <div key={c.cmd} className="flex items-start space-x-3 p-3 rounded-xl" style={{ backgroundColor: '#0d1117' }}>
                  <code className="font-mono text-sm font-bold" style={{ color: '#60a5fa' }}>{c.cmd}</code>
                  <span className="text-sm" style={{ color: '#64748b' }}>{c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold" style={{ color: '#f0f4ff' }}>Bot Features</h2>
            <p className="mt-3" style={{ color: '#64748b' }}>Everything you get with your WhatsApp bot</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="p-6 rounded-2xl transition-all hover:scale-105" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: '#f0f4ff' }}>{f.title}</h3>
                <p className="text-sm" style={{ color: '#64748b' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: '#0d0d1a' }}>
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-extrabold mb-4" style={{ color: '#f0f4ff' }}>Ready to connect?</h2>
          <p className="mb-8" style={{ color: '#64748b' }}>Open the Telegram bot and send <code className="text-blue-400">/pair 254XXXXXXXXX</code> to link your number in seconds.</p>
          <a href="https://t.me/mrsmzazixdbot" target="_blank" rel="noopener noreferrer"
            className="px-8 py-4 rounded-xl font-bold text-white inline-block transition-all"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 0 30px rgba(37,99,235,0.4)' }}>
            t.me/mrsmzazixdbot → Open Now
          </a>
        </div>
      </section>
    </div>
  );
}
