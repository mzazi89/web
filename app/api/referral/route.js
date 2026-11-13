// MZAZI API — GET /api/referral
//
// The signed-in customer's referral code, share link, and the state of every
// person they have invited.
//
// The earning rule lives in lib/api/referral.js and is returned here as data
// (`rule`), so the page never hard-codes "40" or "100" separately from the code
// that actually pays it.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '@/lib/api/web-auth';
import { ensureReferralCode, ensureReferralSchema, REFERRAL_BONUS, REFERRAL_MIN } from '@/lib/api/referral';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

export async function GET() {
  try {
    const user = await requireUser();
    await ensureReferralSchema();
    const code = await ensureReferralCode(user.id);
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://mzazi.shop';

    const [invited, earned, commissions] = await Promise.all([
      sql`
        SELECT u.id, u.fullname, u.email, u.created_at,
               rc.id AS commission_id, rc.amount, rc.created_at AS rewarded_at
        FROM users u
        LEFT JOIN referral_commissions rc ON rc.referred_user_id = u.id
        WHERE u.referred_by = ${user.id}
        ORDER BY u.created_at DESC
        LIMIT 200
      `,
      sql`
        SELECT COALESCE(SUM(amount), 0)::numeric(10,2) AS total, COUNT(*)::int AS count
        FROM referral_commissions WHERE referrer_user_id = ${user.id} AND status = 'paid'
      `,
      sql`
        SELECT rc.id, rc.amount, rc.status, rc.created_at, rc.source,
               u.fullname AS referred_name, u.email AS referred_email
        FROM referral_commissions rc
        JOIN users u ON u.id = rc.referred_user_id
        WHERE rc.referrer_user_id = ${user.id}
        ORDER BY rc.created_at DESC LIMIT 50
      `,
    ]);

    const people = invited.map((p) => ({
      id: p.id,
      name: p.fullname || p.email,
      email: p.email,
      joined_at: p.created_at,
      rewarded: Boolean(p.commission_id),
      reward: p.commission_id ? Number(p.amount) : null,
      rewarded_at: p.rewarded_at,
    }));

    return NextResponse.json({
      code,
      link: `${base}/signup?ref=${encodeURIComponent(code)}`,
      rule: { bonus: REFERRAL_BONUS, minimum: REFERRAL_MIN },
      invited_count: people.length,
      rewarded_count: people.filter((p) => p.rewarded).length,
      waiting_count: people.filter((p) => !p.rewarded).length,
      total_earned: Number(earned[0]?.total) || 0,
      referred_users: people,
      commissions: commissions.map((c) => ({
        id: c.id,
        amount: Number(c.amount),
        status: c.status,
        created_at: c.created_at,
        source: c.source,
        referred_name: c.referred_name || c.referred_email,
      })),
    });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[mzazi] referral error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
