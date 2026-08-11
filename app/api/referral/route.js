import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '@/lib/api/web-auth';
import { ensureReferralCode } from '@/lib/api/referral';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

// GET /api/referral — current user's referral code, link, stats and history
export async function GET() {
  try {
    const user = await requireUser();
    const code = await ensureReferralCode(user.id);
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://mzazi.shop';

    const [referred, earned, commissions] = await Promise.all([
      sql`
        SELECT u.id, u.fullname, u.email, u.created_at
        FROM users u WHERE u.referred_by = ${user.id} ORDER BY u.created_at DESC
      `,
      sql`
        SELECT COALESCE(SUM(amount), 0)::numeric(10,2) AS total
        FROM referral_commissions WHERE referrer_user_id = ${user.id} AND status = 'paid'
      `,
      sql`
        SELECT rc.id, rc.amount, rc.status, rc.created_at, rc.order_id,
               u.fullname AS referred_name, u.email AS referred_email
        FROM referral_commissions rc
        JOIN users u ON u.id = rc.referred_user_id
        WHERE rc.referrer_user_id = ${user.id}
        ORDER BY rc.created_at DESC LIMIT 50
      `,
    ]);

    return NextResponse.json({
      code,
      link: `${base}/signup?ref=${encodeURIComponent(code)}`,
      referred_count: referred.length,
      total_earned: Number(earned[0].total) || 0,
      referred_users: referred,
      commissions: commissions.map(c => ({
        id: c.id,
        amount: Number(c.amount),
        status: c.status,
        created_at: c.created_at,
        order_id: c.order_id,
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
