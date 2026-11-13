import SignInGate from '@/components/SignInGate';
import { AppBackground } from '@/components/ui';
import Sidebar from '@/components/dashboard/Sidebar';
import DashDock from '@/components/dashboard/DashDock';
import { getViewer } from '@/lib/dashboard/session';
import { getBot, getNotifications } from '@/lib/dashboard/data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard',
  description: 'Balance, services, API usage and account security for your MZAZI TECH account.',
};

// MZAZI TECH — dashboard shell.
//
// The session is resolved once, here, on the server. Children never receive an
// id from the browser: each page resolves the viewer again and filters every
// query by it. RBAC is therefore structural — there is no code path that can
// read a row belonging to somebody else, admin or not.
export default async function DashboardLayout({ children }) {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <AppBackground variant="dashboard">
        <div className="container-site" style={{ paddingTop: 28, paddingBottom: 40, maxWidth: 620 }}>
          <SignInGate
            next="/dashboard"
            title="Sign in to your dashboard"
            description="Balance, services, API usage and security all live behind this door. Sign in and we will bring you straight back."
          />
        </div>
      </AppBackground>
    );
  }

  const [bot, notifications] = await Promise.all([getBot(viewer.id), getNotifications(viewer.id)]);
  const unread = notifications.filter((n) => n.tone === 'warn' || n.tone === 'bad').length;

  return (
    <AppBackground variant="dashboard">
      <div className="dash">
        <Sidebar
          user={{ firstname: viewer.firstname, lastname: viewer.lastname, email: viewer.email, avatar: viewer.avatar }}
          plan={bot.planLabel}
          unread={unread}
        />
        <div className="dash-main">{children}</div>
      </div>
      <DashDock />
    </AppBackground>
  );
}
