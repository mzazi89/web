import Link from 'next/link';
import { AppBackground, PageHeader, Button, Icons, BotMark } from '@/components/ui';
import PairingPanel from '@/components/PairingPanel';

// MZAZI TECH — shared shell for the two pairing pages.
//
// The bot is fixed by the route, not chosen in a dropdown: /pair/quartz always
// pairs QUARTZ XD, /pair/mzazi always pairs MZAZI XMD. Keeping the description
// and the cross-link here means the two pages say the same thing in the same
// order, and only the bot differs.

const META = {
  quartz: {
    name: 'QUARTZ XD',
    other: 'mzazi',
    otherName: 'MZAZI XMD',
    title: 'Pair QUARTZ XD',
    description: 'Connect a WhatsApp number to QUARTZ XD — enter the number, get an 8-character pairing code and link it from your phone.',
  },
  mzazi: {
    name: 'MZAZI XMD',
    other: 'quartz',
    otherName: 'QUARTZ XD',
    title: 'Pair MZAZI XMD',
    description: 'Connect a WhatsApp number to MZAZI XMD — enter the number, get an 8-character pairing code and link it from your phone.',
  },
};

export default function PairScreen({ kind = 'quartz' }) {
  const m = META[kind] || META.quartz;

  return (
    <AppBackground variant="dashboard">
      <div className="container-site" style={{ paddingTop: 19, paddingBottom: 24, maxWidth: 1000 }}>
        <PageHeader
          title={m.title}
          description={m.description}
          icon={<Icons.Bot size={20} />}
          actions={
            <>
              <Button href={`/pair/${m.other}`} variant="ghost" icon={<Icons.ArrowRight size={16} />}>
                Pair {m.otherName}
              </Button>
              <Button href="/devices" icon={<Icons.Phone size={16} />}>My devices</Button>
            </>
          }
          breadcrumb={['Dashboard', 'Pair', m.name]}
        />

        <div style={{ marginBottom: 16 }}>
          <PairingPanel kind={kind} />
        </div>

        {/* The reassurance belongs at the moment of deciding, not only in the
            policy: this is the screen where someone weighs handing over a
            number, and the honest answer to "can they read my chats?" is the
            one thing that tips it. */}
        <div
          className="card anim-fade-up d1"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '14px 16px',
            marginBottom: 16,
            borderLeft: '3px solid var(--brand)',
            background: 'var(--brand-tint)',
          }}
        >
          {/* Icons take no style prop — they inherit currentColor, so the
              colour lives on a wrapper. */}
          <span style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 2 }}>
            <Icons.Shield size={18} />
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)', fontSize: 13.5 }}>
              We cannot read your conversations.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              {m.name} handles each message in memory to run the command inside it, and keeps
              none of it — no message text, no contacts, no media. Nobody at MZAZI TECH can
              open your chats, and removing the device in WhatsApp cuts our access instantly.
              By pairing you accept our{' '}
              <Link href="/terms" style={{ color: 'var(--brand)', fontWeight: 600 }}>Terms</Link>
              {' '}and{' '}
              <Link href="/privacy#messages" style={{ color: 'var(--brand)', fontWeight: 600 }}>Privacy Policy</Link>.
            </p>
          </div>
        </div>

        {/* ── What this bot is for ── */}
        <div
          className="card anim-fade-up d1"
          style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: 16 }}
        >
          <BotMark name={m.otherName} size={40} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Not sure this is the right bot?</p>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
              {kind === 'quartz'
                ? 'MZAZI XMD adds automation workflows, scheduled tasks and multi-group broadcasting on top of QUARTZ XD.'
                : 'QUARTZ XD is the lighter everyday bot — 100+ commands, group tools and media downloads.'}
            </p>
          </div>
          <Button href={`/pair/${m.other}`} variant="dark" size="sm">
            Pair {m.otherName}
          </Button>
        </div>
      </div>
    </AppBackground>
  );
}
