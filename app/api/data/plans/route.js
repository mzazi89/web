// MZAZI API — GET /api/data/plans
//
// The bundle catalogue plus what the caller needs to render a buy button: the
// wallet balance and whether Safaricom's rail is actually switched on, so the
// page can say "coming soon" instead of offering a purchase that will fail.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/web-auth';
import { listPlans, offersConfig } from '@/lib/data';
import { sql } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const [plans, cfg, wallet] = await Promise.all([
    listPlans().catch(() => []),
    offersConfig().catch(() => ({ path: '' })),
    sql`SELECT balance::float AS balance FROM wallet WHERE user_id = ${user.id}`.catch(() => []),
  ]);

  // eslint-disable-next-line no-unused-vars
  const __dbg = null;
  return NextResponse.json({
    plans,
    live: Boolean(cfg.path),
    balance: Number(wallet[0]?.balance || 0),
  });
  } catch (e) {
    return NextResponse.json({ error: 'Could not load bundles', detail: String(e && e.message || e).slice(0, 160) }, { status: 500 });
  }
}
