'use client';
import Link from 'next/link';
import PairingPanel from './PairingPanel';

const BOTS = [
  { handle: 'mzazitechquartzbot',   name: 'Bot 1', desc: 'Recommended — start here', recommended: true },
  { handle: 'mzazitechquartz2bot',  name: 'Bot 2', desc: 'Extra session' },
  { handle: 'mzazitechquartz3bot',  name: 'Bot 3', desc: 'Extra session' },
  { handle: 'mzazitechquartz4bot',  name: 'Bot 4', desc: 'Extra session' },
];

const steps = [
  {
    step: '01',
    title: 'Open a Telegram Bot',
    desc: 'Click any bot below to open it in Telegram. Each bot connects ONE WhatsApp number — pick Bot 1 first (recommended) and stick with it. If you need more numbers later, use Bot 2, 3 or 4.',
    icon: '📱',
    action: { label: 'Choose your bot', href: '#bots' },
  },
  {
    step: '02',
    title: 'Start the Bot',
    desc: 'Tap Start (or send /start) inside the bot. The bot replies with a welcome message and lists its commands — confirm it is online before pairing.',
    icon: '▶️',
    code: '/start',
  },
  {
    step: '03',
    title: 'Pair Your WhatsApp',
    desc: 'Send /pair followed by your WhatsApp phone number in international format — country code first, no spaces or + sign. The bot replies with an 8-character pairing code. Example: for Kenya (country code 254) the number 0712 345 678 becomes 254712345678.',
    icon: '🔗',
    code: '/pair 254712345678',
  },
  {
    step: '04',
    title: 'Enter the Code in WhatsApp',
    desc: 'On your phone open WhatsApp → Settings → Linked Devices → Link a Device → Link with Phone Number. Type the 8-character code from the bot and tap Link. Done — your WhatsApp is connected and the bot starts working.',
    icon: '✅',
    code: 'AB12CD34',
  },
];

const features = [
  { icon: '⚡', title: 'Instant Pairing', desc: 'Link your WhatsApp number in seconds via our Telegram bots — no QR code scanning needed.' },
  { icon: '🤖', title: 'Bot Commands', desc: 'Manage your bot, send broadcasts, auto-reply messages, and run custom automation workflows.' },
  { icon: '🔒', title: 'Secure Connection', desc: 'Your WhatsApp is connected securely. No passwords are stored — only a session token.' },
  { icon: '📊', title: '24/7 Uptime', desc: 'Your bot runs on our high-availability infrastructure, ensuring it\'s always online.' },
  { icon: '🌍', title: 'Any Number', desc: 'Works with WhatsApp numbers worldwide — pair in international format (e.g. 254XXXXXXXXX for Kenya).' },
  { icon: '💬', title: 'Multi-Group Support', desc: 'Manage multiple WhatsApp groups and broadcast lists from one dashboard.' },
];

function TelegramButton({ bot, size = 'lg' }) {
  const href = `https://t.me/${bot.handle}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`rounded-xl font-bold text-white transition-all hover:opacity-90 inline-flex items-center justify-center gap-2 ${size === 'lg' ? 'px-6 py-3.5 text-sm' : 'px-4 py-2.5 text-xs'}`}
      style={{
        background: bot.recommended ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(37,99,235,0.08)',
        border: bot.recommended ? 'none' : '1px solid rgba(37,99,235,0.35)',
        color: bot.recommended ? '#fff' : '#93c5fd',
        boxShadow: bot.recommended ? '0 0 24px rgba(37,99,235,0.35)' : 'none',
        textDecoration: 'none',
      }}>
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
      </svg>
      <span className="truncate">{bot.recommended ? `★ ${bot.name} · @${bot.handle}` : `${bot.name} · @${bot.handle}`}</span>
    </a>
  );
}

export default function WhatsAppBotPage() {
  return (
    <div style={{ backgroundColor: 'rgba(10,10,15,0.72)' }}>
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
            <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>WhatsApp Bot Service — 4 Bots Online</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6" style={{ color: '#f0f4ff' }}>
            Connect Your
            <br />
            <span style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              WhatsApp Bot
            </span>
          </h1>

          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#64748b' }}>
            Link your WhatsApp number through our Telegram bots in under 2 minutes. No technical skills needed — just one simple command.
          </p>

          <div id="bots" className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto scroll-mt-24">
            {BOTS.map(bot => <TelegramButton key={bot.handle} bot={bot} />)}
          </div>
          <p className="text-xs mt-4" style={{ color: '#475569' }}>
            Each bot connects <strong style={{ color: '#94a3b8' }}>one</strong> WhatsApp number — pick a bot and keep using it for that number.
          </p>
        </div>
      </section>

      {/* How to pair */}
      <section className="py-20" style={{ backgroundColor: 'rgba(13,13,26,0.72)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#f0f4ff' }}>How to Link Your WhatsApp</h2>
            <p style={{ color: '#64748b' }}>4 simple steps — Telegram bot + your phone, no computer needed</p>
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
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: '#64748b' }}>{s.desc}</p>
                  {s.code && (
                    <div className="inline-flex items-center space-x-3 px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid rgba(37,99,235,0.3)' }}>
                      <span className="font-mono font-bold text-sm" style={{ color: '#60a5fa' }}>{s.code}</span>
                      <span className="text-xs" style={{ color: '#475569' }}>{s.step === '04' ? '— the code from your bot' : '— send this to the bot'}</span>
                    </div>
                  )}
                  {s.action && (
                    <a href={s.action.href}
                      className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', textDecoration: 'none' }}>
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

          {/* Which bot? */}
          <div className="mt-10 p-6 rounded-2xl" style={{ backgroundColor: '#16182a', border: '1px solid rgba(37,99,235,0.3)' }}>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#f0f4ff' }}>🤖 Which bot should I use?</h3>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: '#64748b' }}>
              We run <strong style={{ color: '#f0f4ff' }}>4 separate bots</strong> so you can connect up to 4 different WhatsApp numbers.
              Each bot is an independent session — one bot = one WhatsApp number. Start with <strong style={{ color: '#93c5fd' }}>Bot 1</strong>.
              Once you send <code className="font-mono text-xs" style={{ color: '#60a5fa' }}>/pair</code> to a bot, keep using that same bot for that number.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BOTS.map(bot => (
                <div key={bot.handle} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ backgroundColor: '#0d1117', border: bot.recommended ? '1px solid rgba(37,99,235,0.4)' : '1px solid #1e2d4a' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-bold" style={{ color: '#f0f4ff' }}>
                      {bot.name} {bot.recommended && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-1" style={{ backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>Recommended</span>}
                    </p>
                    <p className="text-xs font-mono truncate" style={{ color: '#64748b' }}>t.me/{bot.handle}</p>
                  </div>
                  <TelegramButton bot={bot} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Command reference */}
          <div className="mt-10 p-6 rounded-2xl" style={{ backgroundColor: '#16182a', border: '1px solid rgba(37,99,235,0.3)' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: '#f0f4ff' }}>📋 Quick Command Reference</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { cmd: '/start', desc: 'Initialize the bot' },
                { cmd: '/pair 254XXXXXXXXX', desc: 'Link your WhatsApp number (international format)' },
                { cmd: '/status', desc: 'Check your connection status' },
                { cmd: '/help', desc: 'List all available commands' },
              ].map(c => (
                <div key={c.cmd} className="flex items-start space-x-3 p-3 rounded-xl" style={{ backgroundColor: '#0d1117' }}>
                  <code className="font-mono text-sm font-bold" style={{ color: '#60a5fa' }}>{c.cmd}</code>
                  <span className="text-sm" style={{ color: '#64748b' }}>{c.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-4" style={{ color: '#475569' }}>
              💡 International format: country code + number without leading 0 or +. Kenya: 254712345678 · Nigeria: 2348012345678 · US: 14155552671
            </p>
          </div>
        </div>
      </section>

      {/* Pair online — no Telegram needed */}
      <section className="py-20" style={{ backgroundColor: 'rgba(10,10,15,0.72)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#f0f4ff' }}>Pair Directly Here — No Telegram Needed</h2>
            <p style={{ color: '#64748b' }}>Enter your number, get the code, link your WhatsApp. Manage your devices and plans from your wallet.</p>
          </div>
          <PairingPanel />
        </div>
      </section>

      {/* Features */}
      <section className="py-20" style={{ backgroundColor: 'rgba(10,10,15,0.72)' }}>
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
      <section className="py-16" style={{ backgroundColor: 'rgba(13,13,26,0.72)' }}>
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-extrabold mb-4" style={{ color: '#f0f4ff' }}>Ready to connect?</h2>
          <p className="mb-8" style={{ color: '#64748b' }}>
            Open <strong style={{ color: '#93c5fd' }}>Bot 1</strong> on Telegram and send <code className="text-blue-400">/pair 254XXXXXXXXX</code> to link your number in seconds.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
            {BOTS.map(bot => <TelegramButton key={bot.handle} bot={bot} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
