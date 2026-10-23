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
      <div className="container-site" style={{ paddingTop: 26, paddingBottom: 90, maxWidth: 1000 }}>
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

        <div style={{ marginBottom: 22 }}>
          <PairingPanel kind={kind} />
        </div>

        {/* ── What this bot is for ── */}
        <div
          className="card anim-fade-up d1"
          style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: 16 }}
        >
          <BotMark name={m.otherName} size={40} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Not sure this is the right bot?</p>
            <p style={{ margin: '3px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>
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
