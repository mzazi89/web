// MZAZI API — GET /api/data/plans
//
// The bundle catalogue plus what the caller needs to render a buy button: the
// wallet balance and whether Safaricom's rail is actually switched on, so the
// page can say "coming soon" instead of offering a purchase that will fail.
import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api/session';
import { listPlans, offersConfig } from '@/lib/data';
import { sql } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await optionalUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const [plans, cfg, wallet] = await Promise.all([
    listPlans().catch(() => []),
    offersConfig().catch(() => ({ path: '' })),
    sql`SELECT balance::float AS balance FROM wallet WHERE user_id = ${user.id}`.catch(() => []),
  ]);

  return NextResponse.json({
    plans,
    live: Boolean(cfg.path),
    balance: Number(wallet[0]?.balance || 0),
  });
}
