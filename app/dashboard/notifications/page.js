import Link from 'next/link';
import { Icons } from '@/components/ui';
import { getViewer } from '@/lib/dashboard/session';
import { getNotifications } from '@/lib/dashboard/data';
import { PageHead, Panel, Empty } from '@/components/dashboard/Parts';
import EnableNotifications from '@/components/EnableNotifications';
import { subscriptionCount } from '@/lib/push';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Notifications' };

// MZAZI TECH — notifications.
//
// Derived from the ledger and the service records rather than a messages table:
// a notification here is a fact that already happened (payment settled, plan
// expiring, instance provisioned), so the list cannot drift from reality or
// grow stale rows nobody can dismiss.

const ICONS = { good: Icons.CheckCircle, bad: Icons.AlertCircle, warn: Icons.Clock, brand: Icons.Info };

const when = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });
};

export default async function NotificationsPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const [items, devices] = await Promise.all([getNotifications(viewer.id), subscriptionCount(viewer.id)]);
  const attention = items.filter((n) => n.tone === 'warn' || n.tone === 'bad');
  const activity = items.filter((n) => n.tone === 'good' || n.tone === 'brand');

  const Row = ({ n }) => {
    const Icon = ICONS[n.tone] || Icons.Info;
    return (
      <Link href={n.href || '/dashboard'} className={`notif is-${n.tone}`}>
        <span className="notif-ico"><Icon size={14} /></span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span className="notif-title">{n.title}</span>
          <span className="notif-body">{n.body}</span>
        </span>
        <span className="notif-time">{when(n.date)}</span>
      </Link>
    );
  };

  return (
    <>
      <PageHead
        eyebrow="Inbox"
        title="Notifications"
        sub="Payments, expiry reminders and order updates generated from your own records."
        actions={<Link href="/dashboard/wallet" className="btn btn-ghost"><Icons.Wallet size={14} /> Payments</Link>}
      />

      <EnableNotifications devices={devices} />

      {items.length === 0 ? (
        <Panel title="Nothing yet" sub="This page fills as your account does">
          <Empty
            Icon={Icons.Bell}
            title="No notifications"
            body="Once you add funds, connect a device or buy a service, the events land here."
            href="/dashboard/marketplace"
            label="Browse services"
          />
        </Panel>
      ) : (
        <>
          {attention.length > 0 && (
            <Panel title="Needs attention" sub="Expiring services and payments that did not settle">
              {attention.map((n) => <Row key={n.id} n={n} />)}
            </Panel>
          )}

          <Panel title="Activity" sub="Settled payments and provisioning events">
            {activity.length === 0
              ? <p className="dash-panel-sub">No activity recorded yet.</p>
              : activity.map((n) => <Row key={n.id} n={n} />)}
          </Panel>
        </>
      )}
    </>
  );
}
