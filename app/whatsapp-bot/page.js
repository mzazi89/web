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
    title: 'Open a Telegram bot',
    desc: 'Each bot connects ONE WhatsApp number. Pick Bot 1 first (recommended) and stick with it. Need more numbers later? Use Bot 2, 3 or 4.',
    action: { label: 'Choose your bot', href: '#bots' },
  },
  {
    step: '02',
    title: 'Start the bot',
    desc: 'Tap Start (or send /start) inside the bot. It replies with a welcome message and lists its commands — confirm it is online before pairing.',
    code: '/start',
  },
  {
    step: '03',
    title: 'Pair your WhatsApp',
    desc: 'Send /pair followed by your WhatsApp number in international format — country code first, no spaces or + sign. The bot replies with an 8-character pairing code. Example: for Kenya (254) the number 0712 345 678 becomes 254712345678.',
    code: '/pair 254712345678',
  },
  {
    step: '04',
    title: 'Enter the code in WhatsApp',
    desc: 'On your phone open WhatsApp → Settings → Linked Devices → Link a Device → Link with Phone Number. Type the 8-character code from the bot and tap Link. Done — your WhatsApp is connected.',
    code: 'AB12CD34',
  },
];

const features = [
  { title: 'Instant pairing', desc: 'Link your WhatsApp number in seconds via our Telegram bots — no QR code scanning needed.' },
  { title: 'Bot commands', desc: 'Manage your bot, send broadcasts, auto-reply messages, and run custom automation workflows.' },
  { title: 'Secure connection', desc: 'No passwords are stored — only a session token, and sessions are wiped when you delete a device.' },
  { title: '24/7 uptime', desc: 'Your bot runs on high-availability infrastructure and stays online around the clock.' },
  { title: 'Any number, anywhere', desc: 'Works with WhatsApp numbers worldwide — pair in international format (e.g. 254XXXXXXXXX for Kenya).' },
  { title: 'Multi-group support', desc: 'Manage multiple WhatsApp groups and broadcast lists from one dashboard.' },
];

function TelegramButton({ bot, size = 'lg' }) {
  const href = `https://t.me/${bot.handle}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="mono flex items-center justify-between gap-3 transition-colors"
      style={{
        padding: size === 'lg' ? '12px 16px' : '8px 12px',
        fontSize: size === 'lg' ? 12 : 11,
        background: bot.recommended ? 'rgba(242,169,59,0.08)' : '#0F1215',
        border: bot.recommended ? '1px solid rgba(242,169,59,0.45)' : '1px solid #262C33',
        color: bot.recommended ? '#F2A93B' : '#AEB5BD',
        textDecoration: 'none',
        borderRadius: 2,
      }}>
      <span className="truncate">
        {bot.recommended ? '★ ' : ''}{bot.name} · @{bot.handle}
      </span>
      <span style={{ color: bot.recommended ? '#F2A93B' : '#4C535B' }}>→</span>
    </a>
  );
}

export default function WhatsAppBotPage() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none grid-bg" style={{ maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 70%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 70%)' }} />
        <div className="container-site relative py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="tag tag-green anim-fade-up"><span className="dot anim-pulse" /> 4 bots online</span>
            <h1 className="headline anim-fade-up d1 mt-6" style={{ color: '#E9E7E2' }}>
              Your WhatsApp,<br />on autopilot<span className="accent">.</span>
            </h1>
            <p className="lede anim-fade-up d2 mt-6">
              Link your number through our Telegram bots in under two minutes. No technical skills —
              one command, one code, done.
            </p>

            <div id="bots" className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 max-w-lg scroll-mt-32 anim-fade-up d3">
              {BOTS.map(bot => <TelegramButton key={bot.handle} bot={bot} />)}
            </div>
            <p className="mono text-[10px] uppercase tracking-[0.14em] mt-4" style={{ color: '#4C535B' }}>
              One bot = one WhatsApp number. Keep using the same bot.
            </p>
          </div>
        </div>
      </section>

      {/* ─── How to pair ─── */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container-site max-w-4xl">
          <div className="mb-12">
            <p className="eyebrow">How it works</p>
            <h2 className="section-title text-3xl sm:text-4xl mt-4" style={{ color: '#E9E7E2' }}>
              Four steps, two minutes
              <span className="bar" />
            </h2>
          </div>

          <div className="space-y-4">
            {steps.map(s => (
              <div key={s.step} className="card p-6 sm:p-7 flex flex-col sm:flex-row gap-5">
                <span className="mono text-[13px] font-semibold flex-shrink-0" style={{ color: '#F2A93B', paddingTop: 2 }}>
                  /{s.step}
                </span>
                <div className="flex-1">
                  <h3 className="display text-lg font-bold mb-2" style={{ color: '#E9E7E2' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#79818A' }}>{s.desc}</p>
                  {s.code && (
                    <div className="inline-flex items-center gap-3 px-4 py-2.5" style={{ background: '#0F1215', border: '1px solid #262C33' }}>
                      <code className="mono font-semibold text-[13px]" style={{ color: '#F2A93B' }}>{s.code}</code>
                      <span className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: '#4C535B' }}>
                        {s.step === '04' ? '— the code from your bot' : '— send this to the bot'}
                      </span>
                    </div>
                  )}
                  {s.action && (
                    <a href={s.action.href}
                      className="mono inline-flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-[0.12em]"
                      style={{ background: '#F2A93B', color: '#14100A', textDecoration: 'none' }}>
                      {s.action.label} →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Which bot? */}
          <div className="card p-6 sm:p-8 mt-10">
            <h3 className="display text-lg font-bold mb-2" style={{ color: '#E9E7E2' }}>Which bot should I use?</h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#79818A' }}>
              We run <strong style={{ color: '#E9E7E2' }}>4 separate bots</strong> so you can connect up to 4 different
              WhatsApp numbers. Each bot is an independent session — one bot = one WhatsApp number.
              Start with <strong style={{ color: '#F2A93B' }}>Bot 1</strong>. Once you send{' '}
              <code className="mono text-xs" style={{ color: '#F2A93B' }}>/pair</code> to a bot, keep using that same bot for that number.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BOTS.map(bot => (
                <div key={bot.handle} className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: '#0F1215', border: bot.recommended ? '1px solid rgba(242,169,59,0.4)' : '1px solid #262C33' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#E9E7E2' }}>
                      {bot.name}
                      {bot.recommended && <span className="mono text-[9px] uppercase tracking-[0.1em] px-1.5 py-0.5 ml-2" style={{ background: 'rgba(62,207,142,0.1)', color: '#3ECF8E' }}>Recommended</span>}
                    </p>
                    <p className="mono text-[11px] truncate mt-0.5" style={{ color: '#4C535B' }}>t.me/{bot.handle}</p>
                  </div>
                  <TelegramButton bot={bot} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Command reference */}
          <div className="card p-6 sm:p-8 mt-10">
            <h3 className="display text-lg font-bold mb-5" style={{ color: '#E9E7E2' }}>Quick command reference</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { cmd: '/start', desc: 'Initialize the bot' },
                { cmd: '/pair 254XXXXXXXXX', desc: 'Link your WhatsApp number (international format)' },
                { cmd: '/status', desc: 'Check your connection status' },
                { cmd: '/help', desc: 'List all available commands' },
              ].map(c => (
                <div key={c.cmd} className="flex items-start justify-between gap-3 px-4 py-3" style={{ background: '#0F1215', border: '1px solid #1B2026' }}>
                  <code className="mono text-[12px] font-semibold" style={{ color: '#F2A93B' }}>{c.cmd}</code>
                  <span className="text-xs text-right" style={{ color: '#79818A' }}>{c.desc}</span>
                </div>
              ))}
            </div>
            <p className="mono text-[10px] uppercase tracking-[0.12em] mt-5" style={{ color: '#4C535B' }}>
              International format: country code + number without leading 0 or + — KE 254712345678 · NG 2348012345678 · US 14155552671
            </p>
          </div>
        </div>
      </section>

      {/* ─── Pair online — no Telegram needed ─── */}
      <section className="section" style={{ background: 'rgba(255,255,255,0.014)' }}>
        <div className="container-site max-w-5xl">
          <div className="mb-12">
            <p className="eyebrow">No Telegram?</p>
            <h2 className="section-title text-3xl sm:text-4xl mt-4" style={{ color: '#E9E7E2' }}>
              Pair directly here
              <span className="bar" />
            </h2>
            <p className="mt-4 text-sm" style={{ color: '#79818A' }}>
              Enter your number, get the code, link your WhatsApp. Manage devices and plans from your wallet.
            </p>
          </div>
          <PairingPanel />
        </div>
      </section>

      {/* ─── Features — asymmetric list ─── */}
      <section className="section">
        <div className="container-site max-w-4xl">
          <div className="mb-12">
            <p className="eyebrow">Bot features</p>
            <h2 className="section-title text-3xl sm:text-4xl mt-4" style={{ color: '#E9E7E2' }}>
              What you get
              <span className="bar" />
            </h2>
          </div>
          <div>
            {features.map((f, i) => (
              <div key={f.title} className="row-item" style={{ gridTemplateColumns: '56px 1fr' }}>
                <span className="row-num">/{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 style={{ color: '#E9E7E2' }}>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="section" style={{ paddingTop: 40, paddingBottom: 110 }}>
        <div className="container-site max-w-3xl text-center">
          <p className="eyebrow center">Ready to connect?</p>
          <h2 className="headline mt-5" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
            Open Bot 1 and send <span className="accent">/pair</span><span className="accent">.</span>
          </h2>
          <p className="lede mt-4 text-sm" style={{ maxWidth: 420, margin: '1rem auto 0' }}>
            Or skip Telegram entirely and pair right on this page.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mt-8">
            {BOTS.map(bot => <TelegramButton key={bot.handle} bot={bot} />)}
          </div>
        </div>
      </section>
    </>
  );
}
