import { neon } from '@neondatabase/serverless';
import { getViewer } from '@/lib/dashboard/session';
import { money, shortDate } from '@/lib/dashboard/data';
import { PageHead, Panel, Kpi, Status, Empty, Line } from '@/components/dashboard/Parts';
import ReferralShare from '@/components/dashboard/ReferralShare';
import { Icons } from '@/components/ui';
import { ensureReferralCode, ensureReferralSchema, REFERRAL_BONUS, REFERRAL_MIN } from '@/lib/api/referral';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Referrals' };

// MZAZI TECH — referrals.
//
// Read-only view over three facts: who you invited, which of them have paid
// KES 100 or more for the first time, and what that has earned. The earning rule
// is imported from the module that pays it rather than typed into the copy, so
// the page cannot advertise a figure the code does not pay.
//
// Every query is scoped to `viewer.id`; there is no id in the URL to tamper with.

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

export default async function ReferralPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  await ensureReferralSchema();
  const code = await ensureReferralCode(viewer.id);
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://mzazi.shop';
  const link = `${base}/signup?ref=${encodeURIComponent(code || '')}`;

  const [invited, earned] = await Promise.all([
    sql`
      SELECT u.id, u.fullname, u.email, u.created_at,
             rc.id AS commission_id, rc.amount, rc.created_at AS rewarded_at
      FROM users u
      LEFT JOIN referral_commissions rc ON rc.referred_user_id = u.id
      WHERE u.referred_by = ${viewer.id}
      ORDER BY u.created_at DESC
      LIMIT 100
    `.catch(() => []),
    sql`
      SELECT COALESCE(SUM(amount), 0)::numeric(10,2) AS total, COUNT(*)::int AS count
      FROM referral_commissions WHERE referrer_user_id = ${viewer.id} AND status = 'paid'
    `.catch(() => [{ total: 0, count: 0 }]),
  ]);

  const rewarded = invited.filter((p) => p.commission_id);
  const waiting = invited.length - rewarded.length;
  const total = Number(earned[0]?.total || 0);

  return (
    <>
      <PageHead
        eyebrow="Growth"
        title="Referrals"
        sub={`Share your link. When a friend joins and makes their first payment of ${money(REFERRAL_MIN)} or more, ${money(REFERRAL_BONUS)} lands in your wallet.`}
        actions={
          <a href="/dashboard/wallet" className="btn btn-ghost">
            <Icons.Wallet size={14} /> Wallet
          </a>
        }
      />

      <Panel title="Your link" sub="Anyone who signs up through it is linked to you for life">
        {code ? (
          <ReferralShare code={code} link={link} />
        ) : (
          <p className="dash-line-note">Your code could not be created just now — reload the page.</p>
        )}
      </Panel>

      <div className="kpi-grid">
        <Kpi label="Invited" value={String(invited.length)} note="Signed up with your link" Icon={Icons.Users} />
        <Kpi label="Rewarded" value={String(rewarded.length)} note={`Paid ${money(REFERRAL_MIN)}+`} Icon={Icons.CheckCircle} />
        <Kpi label="Waiting" value={String(waiting)} note="No qualifying payment yet" Icon={Icons.Clock} />
        <Kpi label="Earned" value={money(total)} note="Credited to your wallet" Icon={Icons.Wallet} tone="good" />
      </div>

      <Panel title="How it pays" sub="No cap, no deadline — one reward per friend">
        <Line label="1 · They join" note="Your link fills in your code on the signup form" right={<Status value="instant" />} />
        <Line label={`2 · They pay ${money(REFERRAL_MIN)} or more`} note="A wallet top-up or any purchase — once, the first time" right={<Status value="required" />} />
        <Line label={`3 · You get ${money(REFERRAL_BONUS)}`} note="Credited straight to your wallet, shown as a referral bonus" right={<Status value="automatic" />} />
      </Panel>

      <Panel title="People you invited" sub={invited.length ? `${invited.length} total · ${waiting} still to pay` : 'Nobody yet'}>
        {invited.length === 0 ? (
          <Empty
            Icon={Icons.Users}
            title="No invites yet"
            body="Share your link on WhatsApp or in a group. The first payment your friend makes is what triggers your reward."
            href="/dashboard"
            label="Back to overview"
          />
        ) : (
          invited.map((p) => (
            <Line
              key={p.id}
              label={p.fullname || p.email}
              note={`Joined ${shortDate(p.created_at)}${p.commission_id ? ` · rewarded ${shortDate(p.rewarded_at)}` : ` · waiting for a ${money(REFERRAL_MIN)} payment`}`}
              right={
                p.commission_id
                  ? <span className="pill-status is-good">+{money(Number(p.amount))}</span>
                  : <Status value="waiting" />
              }
            />
          ))
        )}
      </Panel>

      <p className="dash-line-note" style={{ marginTop: 4 }}>
        Rewards are one per friend and stop at the first qualifying payment. Self-referrals and accounts sharing a
        payment method with the referrer are not rewarded. Bonuses can be spent like any wallet balance.
      </p>
    </>
  );
}
