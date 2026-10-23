import Link from 'next/link';
import { AppBackground, PageHeader, Card, Icons, BotMark } from '@/components/ui';

// MZAZI TECH — /pair. Two pairing pages, one card each.
//
// This route exists so "Connect WhatsApp" has a single destination that asks the
// only question left (which bot), then hands off to /pair/quartz or /pair/mzazi.
// Neither bot is pre-selected and neither is styled as the default.

export const metadata = {
  title: 'Pair a bot — MZAZI TECH',
  description:
    'Choose the bot to pair your WhatsApp number with — QUARTZ XD for everyday automation or MZAZI XMD for advanced workflows.',
  alternates: { canonical: 'https://www.mzazi.shop/pair' },
};

const BOTS = [
  {
    href: '/pair/quartz',
    name: 'QUARTZ XD',
    tagline: 'Powerful WhatsApp automation.',
    desc: 'The everyday bot. Group management, downloads, stickers, polls and 100+ commands — ready the moment you pair.',
    points: ['100+ built-in commands', 'Group & admin tools', 'Media downloads'],
    accent: true,
  },
  {
    href: '/pair/mzazi',
    name: 'MZAZI XMD',
    tagline: 'Advanced automation tools.',
    desc: 'For heavier workloads. Everything in QUARTZ XD plus automation workflows, scheduled tasks and multi-group broadcasting.',
    points: ['Everything in QUARTZ XD', 'Scheduled & automated tasks', 'Multi-group broadcast'],
    accent: false,
  },
];

export default function PairIndexPage() {
  return (
    <AppBackground variant="dashboard">
      <div className="container-site" style={{ paddingTop: 26, paddingBottom: 90, maxWidth: 1000 }}>
        <PageHeader
          title="Pair a bot"
          description="Pick the bot you want to pair your number with — the next page takes your number and gives you the code."
          icon={<Icons.Bot size={20} />}
          breadcrumb={['Dashboard', 'Pair']}
        />

        <div className="grid-2-responsive" style={{ alignItems: 'stretch' }}>
          {BOTS.map((bot) => (
            <Card key={bot.href} accent={bot.accent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <BotMark name={bot.name} size={52} />
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                    {bot.name}
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>
                    {bot.tagline}
                  </p>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.65 }}>{bot.desc}</p>

              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                {bot.points.map((p) => (
                  <li key={p} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 14, color: 'var(--ink-2)' }}>
                    <span style={{ color: 'var(--good)', marginTop: 1, flex: '0 0 auto' }} aria-hidden="true">
                      <Icons.Check size={15} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>

              <Link href={bot.href} className="btn btn-dark btn-block" style={{ marginTop: 'auto' }}>
                Pair {bot.name}
                <Icons.ArrowRight size={16} />
              </Link>
            </Card>
          ))}
        </div>

        <p style={{ margin: '22px 0 0', fontSize: 13.5, color: 'var(--dim)' }}>
          Already connected? <Link className="link" href="/devices">Manage your devices</Link>. One bot per number — pair a second
          number on the other bot if you need both.
        </p>
      </div>
    </AppBackground>
  );
}
