import Link from 'next/link';
import { Icons } from '@/components/ui';
import { getViewer } from '@/lib/dashboard/session';
import { getPanels, getVps, getBot, getApiKeys, money, shortDate } from '@/lib/dashboard/data';
import { PageHead, Panel, Empty, Status, Line, Kpi } from '@/components/dashboard/Parts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My services' };

// MZAZI TECH — every service this account owns, with the action that keeps it
// alive. Management itself lives on the dedicated pages (/devices, /products,
// /vps) because those already carry the credential reveal and rebuild flows —
// duplicating them here would create two places to fix a provisioning bug.

function expiryNote(expiresAt, createdAt) {
  if (!expiresAt) return `Started ${shortDate(createdAt)} · no expiry set`;
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  if (days < 0) return `Expired ${shortDate(expiresAt)}`;
  return `Expires ${shortDate(expiresAt)} · ${days} day${days === 1 ? '' : 's'} left`;
}

export default async function ServicesPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const [panels, vps, bot, keys] = await Promise.all([
    getPanels(viewer.id), getVps(viewer.id), getBot(viewer.id), getApiKeys(viewer.id),
  ]);

  const activeKeys = keys.filter((k) => String(k.status).toLowerCase() === 'active');

  return (
    <>
      <PageHead
        eyebrow="Inventory"
        title="My services"
        sub="Everything provisioned to this account, with status and renewal dates."
        actions={<Link href="/dashboard/marketplace" className="btn btn-primary"><Icons.Plus size={14} /> New service</Link>}
      />

      <div className="kpi-grid">
        <Kpi label="VPS servers" value={vps.length} note="root access" Icon={Icons.Cpu} />
        <Kpi label="Panels" value={panels.length} note="Pterodactyl" Icon={Icons.Server} />
        <Kpi label="Devices" value={bot.devices.length} note={`of ${bot.maxDevices} allowed`} Icon={Icons.Phone} />
        <Kpi label="API keys" value={activeKeys.length} note="active" Icon={Icons.Code} />
      </div>

      <Panel
        title="VPS servers"
        sub="KVM instances with full root access"
        action={<Link href="/vps" className="dash-mini-link">Order <Icons.ArrowUpRight size={12} /></Link>}
      >
        {vps.length === 0 ? (
          <Empty Icon={Icons.Cpu} title="No VPS yet" body="Instances appear here the moment they are provisioned, with host and region." href="/vps" label="Order a VPS" />
        ) : vps.map((v) => (
          <Line
            key={v.id}
            label={v.hostname || v.host || `VPS ${v.id}`}
            note={`${v.region || 'region pending'} · ${v.os || 'linux'} · ${v.cpu || '—'} vCPU · order ${v.order_ref || '—'}`}
            right={
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <Status value={v.status} />
                <Link href="/vps" className="dash-mini-link">Manage</Link>
              </span>
            }
          />
        ))}
      </Panel>

      <Panel
        title="Pterodactyl panels"
        sub="Game and application servers"
        action={<Link href="/products" className="dash-mini-link">Deploy <Icons.ArrowUpRight size={12} /></Link>}
      >
        {panels.length === 0 ? (
          <Empty Icon={Icons.Server} title="No panels yet" body="Pick a package and your panel credentials are issued automatically." href="/products" label="Browse packages" />
        ) : panels.map((p) => (
          <Line
            key={p.id}
            label={p.package_name || 'Panel'}
            note={`${money(p.package_price)} · ${expiryNote(p.expires_at, p.created_at)}${p.ptero_username ? ` · ${p.ptero_username}` : ''}`}
            right={
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <Status value={p.status} />
                <Link href="/products" className="dash-mini-link">Renew</Link>
              </span>
            }
          />
        ))}
      </Panel>

      <Panel
        title="WhatsApp bots"
        sub={`${bot.planLabel} plan · ${bot.devices.length} of ${bot.maxDevices} devices`}
        action={<Link href="/devices" className="dash-mini-link">Manage <Icons.ArrowUpRight size={12} /></Link>}
      >
        {bot.devices.length === 0 ? (
          <Empty Icon={Icons.WhatsApp} title="No device connected" body="Pair your own number — the bot runs on our infrastructure, not on your phone." href="/pair" label="Connect WhatsApp" />
        ) : (
          <>
            {bot.devices.map((d) => (
              <Line
                key={d.phoneNumber}
                label={d.phoneNumber}
                note={`Connected ${shortDate(d.connectedAt)}`}
                right={<Status value="active" />}
              />
            ))}
            {bot.endDate && (
              <Line
                label="Plan renewal"
                note={`${bot.planLabel} · ${shortDate(bot.endDate)}`}
                right={<Link href="/subscription" className="dash-mini-link">Renew / upgrade</Link>}
              />
            )}
          </>
        )}
      </Panel>

      <Panel
        title="API subscriptions"
        sub="Keys, limits and usage"
        action={<Link href="/dashboard/api" className="dash-mini-link">Open API <Icons.ArrowUpRight size={12} /></Link>}
      >
        {keys.length === 0 ? (
          <Empty Icon={Icons.Code} title="No API key" body="Create a key to call any of the 525 marketplace endpoints." href="/dashboard/api" label="Create a key" />
        ) : keys.map((k) => (
          <Line
            key={k.id}
            label={k.name}
            note={`${k.key_prefix} · ${k.plan || 'FREE'} · created ${shortDate(k.created_at)}`}
            right={<Status value={k.status} />}
          />
        ))}
      </Panel>
    </>
  );
}
