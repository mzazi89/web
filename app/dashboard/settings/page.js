import Link from 'next/link';
import { Icons } from '@/components/ui';
import { getViewer, initials } from '@/lib/dashboard/session';
import { getLogins, shortDate } from '@/lib/dashboard/data';
import { PageHead, Panel, Line, Status, Empty } from '@/components/dashboard/Parts';
import { ProfileForm, PasswordForm, SignOutButton } from '@/components/dashboard/SettingsForms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Account settings' };

// MZAZI TECH — settings.
// Login history is written by /api/auth/login and read here for this user only;
// it is the screen that answers "was that me?" after a suspicious email.

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const logins = await getLogins(viewer.id, 6);

  return (
    <>
      <PageHead
        eyebrow="Account"
        title="Settings"
        sub="Profile, credentials and the sessions that have touched this account."
        actions={<SignOutButton />}
      />

      <div className="profile-strip">
        <span className="dash-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{initials(viewer)}</span>
        <div style={{ minWidth: 0 }}>
          <p className="dash-line-label" style={{ fontSize: 13 }}>{[viewer.firstname, viewer.lastname].filter(Boolean).join(' ') || viewer.email}</p>
          <p className="dash-line-note">{viewer.email} · member since {shortDate(viewer.created_at)}</p>
        </div>
        <span className="pill-status is-muted" style={{ marginLeft: 'auto' }}>{viewer.role || 'customer'}</span>
      </div>

      <Panel title="Profile" sub="How your name appears on receipts and in support">
        <ProfileForm user={{ firstname: viewer.firstname, lastname: viewer.lastname, email: viewer.email }} />
      </Panel>

      <Panel title="Password" sub="Changing it signs nothing out — sessions keep working until they expire">
        <PasswordForm />
      </Panel>

      <Panel
        title="Security"
        sub="Recovery question and account protection"
        action={<Link href="/account" className="dash-mini-link">Full security page <Icons.ArrowUpRight size={12} /></Link>}
      >
        <Line label="Recovery question" note="Used by /forgot-password to prove the account is yours" right={<Link href="/account" className="dash-mini-link">Configure</Link>} />
        <Line label="Password hashing" note="bcrypt, cost 10 — never stored or logged in plain text" right={<Status value="active" />} />
        <Line label="Session cookie" note="httpOnly · sameSite=lax · 7-day expiry" right={<Status value="active" />} />
      </Panel>

      <Panel title="Login history" sub="The last six sign-in attempts on this account">
        {logins.length === 0 ? (
          <Empty Icon={Icons.Shield} title="No history yet" body="Attempts are recorded from now on — this sign-in is the first one we can see." href="/dashboard" label="Back to overview" />
        ) : logins.map((l) => (
          <Line
            key={l.id}
            label={l.ip || 'Unknown address'}
            note={`${shortDate(l.created_at)} · ${String(l.user_agent || 'unknown device').slice(0, 64)}`}
            right={<Status value={l.status} />}
          />
        ))}
      </Panel>

      <Panel title="Close the session" sub="Signing out clears the cookie on this device">
        <div className="row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
          <p className="dash-line-note" style={{ margin: 0, maxWidth: '48ch' }}>
            If this is a shared computer, sign out. Your services keep running — only the browser session ends.
          </p>
          <SignOutButton />
        </div>
      </Panel>
    </>
  );
}
