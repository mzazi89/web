// MZAZI API — GET /api/pair/devices
// Returns the logged-in user's linked WhatsApp devices + current plan + plans.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { ensureDatabase } from '@/lib/database';
import { auth, PLANS, getAccount } from '@/lib/pairApi';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    const user = await auth();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    await ensureDatabase();

    const account = await getAccount(sql, user.userId);
    if (!account) {
      return NextResponse.json({
        plan: 'FREE', maxDevices: 1, endDate: null, devices: [],
        plans: Object.values(PLANS),
      });
    }

    const subRows = await sql`
      SELECT plan, "maxDevices", "endDate", status
      FROM "Subscription" WHERE "userId" = ${account.id} LIMIT 1
    `;
    const sub = subRows[0];
    const active = sub && sub.status === 'ACTIVE' && (!sub.endDate || new Date(sub.endDate) > new Date());
    const plan = active ? sub.plan : 'FREE';
    const maxDevices = active && sub.plan !== 'FREE' ? sub.maxDevices : 1;

    // Only ACTIVE sessions are shown; INACTIVE rows are unlinked and hidden.
    const devices = await sql`
      SELECT "phoneNumber", "connectedAt", status
      FROM "WhatsAppSession"
      WHERE "userId" = ${account.id} AND status = 'ACTIVE'
      ORDER BY id DESC
    `;

    return NextResponse.json({
      plan,
      maxDevices,
      endDate: active && sub.endDate ? sub.endDate : null,
      devices: devices.map((d) => ({
        number: d.phoneNumber,
        connectedAt: d.connectedAt,
        status: d.status,
      })),
      plans: Object.values(PLANS),
    });
  } catch (e) {
    console.error('Pair devices error:', e.message);
    return NextResponse.json({ error: 'Failed to load devices' }, { status: 500 });
  }
}
