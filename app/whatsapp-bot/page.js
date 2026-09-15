'use client';

// MZAZI TECH — WhatsApp bot.
//
// Documents the bot (how to pair, which bot to use, the commands) and hosts the
// interactive PairingPanel. This page makes no API calls of its own — the panel
// owns the pairing/devices/bots/plan endpoints.

import Link from 'next/link';
import {
  AppBackground, PageHeader, Button, Card, CardHeader, Badge, Icons,
} from '@/components/ui';
import PairingPanel from './PairingPanel';

const BOTS = [
  { handle: 'mzazitechquartzbot', name: 'QUARTZ XD', desc: 'Recommended — start here', recommended: true },
  { handle: 'mzazitechquartz2bot', name: 'MZAZI XMD', desc: 'Extra session' },
  { handle: 'mzazitechquartz3bot', name: 'QUARTZ XD 3', desc: 'Extra session' },
  { handle: 'mzazitechquartz4bot', name: 'QUARTZ XD 4', desc: 'Extra session' },
];

const STEPS = [
  {
    step: '01',
    title: 'Open a Telegram bot',
    desc: 'Each bot connects ONE WhatsApp number. Pick the first bot (recommended) and stick with it. Need more numbers later? Use the others.',
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

const FEATURES = [
  { title: 'Instant pairing', desc: 'Link your WhatsApp number in seconds via our Telegram bots — no QR code scanning needed.' },
  { title: 'Bot commands', desc: 'Manage your bot, send broadcasts, auto-reply messages, and run custom automation workflows.' },
  { title: 'Secure connection', desc: 'No passwords are stored — only a session token, and sessions are wiped when you delete a device.' },
  { title: '24/7 uptime', desc: 'Your bot runs on high-availability infrastructure and stays online around the clock.' },
  { title: 'Any number, anywhere', desc: 'Works with WhatsApp numbers worldwide — pair in international format (e.g. 254XXXXXXXXX for Kenya).' },
  { title: 'Multi-group support', desc: 'Manage multiple WhatsApp groups and broadcast lists from one dashboard.' },
];

const COMMANDS = [
  { cmd: '/start', desc: 'Initialize the bot' },
  { cmd: '/pair 254XXXXXXXXX', desc: 'Link your WhatsApp number (international format)' },
  { cmd: '/status', desc: 'Check your connection status' },
  { cmd: '/help', desc: 'List all available commands' },
];

function TelegramButton({ bot }) {
  const href = `https://t.me/${bot.handle}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn"
      style={{
        justifyContent: 'space-between',
        width: '100%',
        background: bot.recommended ? 'var(--brand-tint)' : 'var(--surface-2)',
        border: bot.recommended ? '1px solid var(--brand-soft)' : '1px solid var(--line)',
        color: bot.recommended ? 'var(--brand)' : 'var(--ink-2)',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        <Icons.Send size={15} />
        <span className="truncate-1">{bot.name} · @{bot.handle}</span>
      </span>
      <Icons.ArrowRight size={15} />
    </a>
  );
}

export default function WhatsAppBotPage() {
  return (
    <AppBackground variant="dashboard">
      <div className="container-site" style={{ paddingTop: 26, paddingBottom: 90, maxWidth: 1000 }}>
        <PageHeader
          title="WhatsApp bot"
          description="Link your number through our Telegram bots, or pair directly here — no technical skills, one code and you’re online."
          icon={<Icons.WhatsApp size={20} />}
          actions={
            <>
              <Button href="#pair" variant="ghost" icon={<Icons.Zap size={16} />}>Pair now</Button>
              <Button href="https://t.me/mzazitechquartzbot" icon={<Icons.Send size={16} />}>Open bot</Button>
            </>
          }
          breadcrumb={['Dashboard', 'WhatsApp bot']}
        />

        {/* ── Pair online ── */}
        <section id="pair" className="scroll-x" style={{ marginBottom: 28, scrollMarginTop: 90 }}>
          <PairingPanel />
        </section>

        {/* ── How it works ── */}
        <Card className="anim-fade-up" style={{ marginBottom: 22 }}>
          <CardHeader
            title="How it works"
            description="Four steps, about two minutes."
            icon={<Icons.Help size={18} />}
          />
          <div style={{ display: 'grid', gap: 14 }}>
            {STEPS.map((s) => (
              <div key={s.step} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <span className="mono" style={{ color: 'var(--brand)', fontWeight: 700, flex: '0 0 auto' }}>/{s.step}</span>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{s.title}</h3>
                  <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.65 }}>{s.desc}</p>
                  {s.code && (
                    <div style={{ marginTop: 10 }}>
                      <span className="mono" style={{ display: 'inline-block', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', color: 'var(--brand)', fontWeight: 600, wordBreak: 'break-all' }}>
                        {s.code}
                      </span>
                    </div>
                  )}
                  {s.action && (
                    <div style={{ marginTop: 10 }}>
                      <Button size="sm" href={s.action.href}>{s.action.label}</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Which bot ── */}
        <Card id="bots" className="anim-fade-up d1" style={{ marginBottom: 22, scrollMarginTop: 90 }}>
          <CardHeader
            title="Which bot should I use?"
            description="We run several bots so you can connect different WhatsApp numbers. One bot = one number."
            icon={<Icons.Bot size={18} />}
          />
          <p style={{ margin: '0 0 14px', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7 }}>
            Start with <strong style={{ color: 'var(--brand)' }}>{BOTS[0].name}</strong>. Once you send{' '}
            <code className="mono" style={{ color: 'var(--brand)' }}>/pair</code> to a bot, keep using that same bot for that number.
          </p>
          <div className="grid-2-responsive">
            {BOTS.map((bot) => (
              <div key={bot.handle} style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{bot.name}</span>
                  {bot.recommended && <Badge tone="good">Recommended</Badge>}
                </div>
                <TelegramButton bot={bot} />
              </div>
            ))}
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--dim)' }}>One bot = one WhatsApp number. Keep using the same bot.</p>
        </Card>

        {/* ── Command reference ── */}
        <Card className="anim-fade-up d2" style={{ marginBottom: 22 }}>
          <CardHeader title="Quick command reference" icon={<Icons.Command size={18} />} />
          <div className="grid-2-responsive">
            {COMMANDS.map((c) => (
              <div key={c.cmd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--line-soft)', borderRadius: 'var(--r-sm)' }}>
                <code className="mono" style={{ fontWeight: 700, color: 'var(--brand)', wordBreak: 'break-all' }}>{c.cmd}</code>
                <span style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'right' }}>{c.desc}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--dim)', lineHeight: 1.7 }}>
            International format: country code + number without leading 0 or + — KE 254712345678 · NG 2348012345678 · US 14155552671
          </p>
        </Card>

        {/* ── Features ── */}
        <Card className="anim-fade-up d2">
          <CardHeader title="What you get" description="Everything included with every plan." icon={<Icons.Sparkles size={18} />} />
          <div className="grid-2-responsive">
            {FEATURES.map((f) => (
              <div key={f.title} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--good)', marginTop: 2, flex: '0 0 auto' }} aria-hidden="true"><Icons.Check size={16} /></span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>{f.title}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <Button href="/devices" variant="dark" icon={<Icons.Phone size={16} />}>My devices</Button>
            <Button href="/subscription" variant="ghost" icon={<Icons.Sparkles size={16} />}>Plans</Button>
            <Button href="/help" variant="ghost" icon={<Icons.Help size={16} />}>Help</Button>
          </div>
        </Card>

        <p style={{ margin: '22px 0 0', fontSize: 13.5, color: 'var(--dim)' }}>
          Prefer reading first? See the <Link className="link" href="/help">Help page</Link> or <Link className="link" href="/contact">contact us</Link>.
        </p>
      </div>
    </AppBackground>
  );
}
