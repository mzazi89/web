import Link from 'next/link';
import { Icons } from '@/components/ui';
import { getViewer, displayName } from '@/lib/dashboard/session';
import { getOverview, money, shortDate } from '@/lib/dashboard/data';
import { PageHead, Kpi, Panel, Empty, Status, Line } from '@/components/dashboard/Parts';

export const dynamic = 'force-dynamic';

// MZAZI TECH — dashboard overview.
// Everything on this page is read with `viewer.id`; there is no query here that
// could return another account's row.

export default async function OverviewPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const { wallet, bot, usage, services, panels, vps, keys } = await getOverview(viewer.id);
  const recent = wallet.transactions.slice(0, 5);

  return (
    <>
      <PageHead
        eyebrow="Control panel"
        title={`Welcome back, ${displayName(viewer)}`}
        sub={`Account #${viewer.id} · joined ${shortDate(viewer.created_at)}`}
        actions={
          <>
            <Link href="/wallet" className="btn btn-ghost"><Icons.Plus size={14} /> Add funds</Link>
            <Link href="/dashboard/marketplace" className="btn btn-primary">Buy a service</Link>
          </>
        }
      />

      <div className="kpi-grid">
        <Kpi label="Wallet balance" value={money(wallet.balance)} note="Top up with M-PESA or card" Icon={Icons.Wallet} href="/dashboard/wallet" tone="brand" />
        <Kpi label="Active services" value={services.total} note={`${services.panels} panels · ${services.vps} VPS · ${services.devices} devices · ${services.keys} keys`} Icon={Icons.Layers} href="/dashboard/services" />
        <Kpi label="WhatsApp plan" value={bot.planLabel} note={bot.endDate ? `renews ${shortDate(bot.endDate)}` : 'no expiry'} Icon={Icons.Bot} href="/subscription" />
        <Kpi label="API calls today" value={usage.today} note={`${usage.total.toLocaleString()} lifetime`} Icon={Icons.Code} href="/dashboard/api" />
      </div>

      <div className="dash-cols">
        <Panel
          title="Recent transactions"
          sub="Settled and pending wallet movements"
          action={<Link href="/dashboard/wallet" className="dash-mini-link">All <Icons.ChevronRight size={12} /></Link>}
        >
          {recent.length === 0 ? (
            <Empty
              Icon={Icons.Receipt}
              title="No transactions yet"
              body="Top up your wallet and your payments will appear here with a receipt for each one."
              href="/wallet"
              label="Add funds"
            />
          ) : (
            <div>
              {recent.map((t) => (
                <Line
                  key={t.id}
                  label={t.description || (t.type === 'deposit' ? 'Wallet top-up' : 'Wallet charge')}
                  note={`${shortDate(t.paid_at || t.created_at)} · ${(t.payment_method || 'wallet').toUpperCase()}`}
                  right={
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <b className={`dash-amount ${t.type === 'debit' ? 'is-out' : 'is-in'}`}>
                        {t.type === 'debit' ? '−' : '+'}{money(t.amount)}
                      </b>
                      <Status value={t.status} />
                    </span>
                  }
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Quick actions" sub="The four things people do most">
          <div className="quick-grid">
            <Link href="/pair" className="quick"><Icons.WhatsApp size={15} /><span>Connect WhatsApp</span></Link>
            <Link href="/products" className="quick"><Icons.Server size={15} /><span>Deploy a panel</span></Link>
            <Link href="/vps" className="quick"><Icons.Cpu size={15} /><span>Order a VPS</span></Link>
            <Link href="/api/docs" className="quick"><Icons.Code size={15} /><span>API docs</span></Link>
          </div>

          <div style={{ marginTop: 14 }}>
            <Line label="Devices" note={`${services.devices} of ${bot.maxDevices} connected`} right={<Link href="/devices" className="dash-mini-link">Manage</Link>} />
            <Line label="Panels" note={`${services.panels} active`} right={<Link href="/products" className="dash-mini-link">Manage</Link>} />
            <Line label="VPS" note={`${services.vps} provisioned`} right={<Link href="/vps" className="dash-mini-link">Manage</Link>} />
            <Line label="API keys" note={`${services.keys} active`} right={<Link href="/dashboard/api" className="dash-mini-link">Manage</Link>} />
          </div>
        </Panel>
      </div>

      <Panel
        title="Your services"
        sub="Live inventory, newest first"
        action={<Link href="/dashboard/services" className="dash-mini-link">Details <Icons.ChevronRight size={12} /></Link>}
      >
        {panels.length + vps.length + bot.devices.length === 0 ? (
          <Empty
            Icon={Icons.Layers}
            title="Nothing running yet"
            body="Panels, VPS instances and WhatsApp devices appear here as soon as they are provisioned."
            href="/dashboard/marketplace"
            label="Browse marketplace"
          />
        ) : (
          <div>
            {panels.slice(0, 2).map((p) => (
              <Line key={`p-${p.id}`} label={p.package_name || 'Pterodactyl panel'} note={`Panel · ${shortDate(p.created_at)}`} right={<Status value={p.status} />} />
            ))}
            {vps.slice(0, 2).map((v) => (
              <Line key={`v-${v.id}`} label={v.hostname || v.host} note={`VPS · ${v.region || 'region pending'}`} right={<Status value={v.status} />} />
            ))}
            {bot.devices.slice(0, 2).map((d) => (
              <Line key={d.phoneNumber} label={d.phoneNumber} note="WhatsApp device" right={<Status value="active" />} />
            ))}
            {keys.length > 0 && (
              <Line label={`${keys.length} API key${keys.length === 1 ? '' : 's'}`} note="Developer access" right={<Status value={keys[0].status} />} />
            )}
          </div>
        )}
      </Panel>
    </>
  );
}
