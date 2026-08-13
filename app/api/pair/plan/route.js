// MZAZI API — POST /api/pair/plan
// Buy a WhatsApp Bot plan using the wallet balance (same plans as the bot).
// Charges the wallet, then upgrades the shared bot subscription.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { ensureDatabase } from '@/lib/database';
import { auth, PLANS, ensureAccount } from '@/lib/pairApi';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  let deducted = false;
  try {
    const user = await auth();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    await ensureDatabase();

    let body;
    try { body = await request.json(); } catch { body = {}; }
    const plan = PLANS[String(body.plan || '').toUpperCase()];
    if (!plan) {
      return NextResponse.json(
        { error: 'Choose a plan: PLAN_5, PLAN_10, PLAN_20 or UNLIMITED.' },
        { status: 400 }
      );
    }

    // 1) check wallet (stored in KSH)
    const w = await sql`SELECT balance FROM wallet WHERE user_id = ${Number(user.userId)} LIMIT 1`;
    const balance = w.length ? parseFloat(w[0].balance) : 0;
    if (balance < plan.priceKsh) {
      return NextResponse.json({
        error: `Insufficient wallet balance. This plan costs ${plan.priceKsh / 10} MTC (KSH ${plan.priceKsh}) — please deposit first.`,
        insufficient: true,
        depositUrl: '/wallet',
      }, { status: 402 });
    }

    // 2) atomic deduction
    const upd = await sql`
      UPDATE wallet SET balance = balance - ${plan.priceKsh}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${Number(user.userId)} AND balance >= ${plan.priceKsh}
      RETURNING balance
    `;
    if (!upd.length) {
      return NextResponse.json({ error: 'Insufficient wallet balance.' }, { status: 402 });
    }
    deducted = true;

    await sql`
      INSERT INTO wallet_transactions (user_id, type, amount, description, status)
      VALUES (${Number(user.userId)}, 'debit', ${plan.priceKsh},
              ${`WhatsApp Bot plan: ${plan.name} — ${plan.days} days`}, 'done')
    `;

    // 3) upgrade the shared bot subscription (prisma "User"/"Subscription")
    const account = await ensureAccount(sql, user.userId);
    const endDate = new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000);

    const subRows = await sql`
      INSERT INTO "Subscription" ("userId", "plan", "maxDevices", "startDate", "endDate", "status", "updatedAt")
      VALUES (${account.id}, ${plan.key}, ${plan.maxDevices}, CURRENT_TIMESTAMP, ${endDate.toISOString()}::timestamp, 'ACTIVE', CURRENT_TIMESTAMP)
      ON CONFLICT ("userId") DO UPDATE SET
        "plan" = EXCLUDED."plan",
        "maxDevices" = EXCLUDED."maxDevices",
        "startDate" = EXCLUDED."startDate",
        "endDate" = EXCLUDED."endDate",
        "status" = 'ACTIVE',
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "plan", "maxDevices", "endDate"
    `;

    await sql`
      INSERT INTO "Transaction" ("userId", "type", "amount", "description")
      VALUES (${account.id}, 'UPGRADE', ${plan.priceKsh}, ${`Upgraded to ${plan.name} plan (WhatsApp bot)`})
    `;

    return NextResponse.json({
      ok: true,
      plan: subRows[0].plan,
      maxDevices: subRows[0].maxDevices,
      endDate: subRows[0].endDate,
      balance: upd[0].balance,
    });
  } catch (e) {
    console.error('Pair plan error:', e.message);
    // Never let a failed activation keep the user's money: refund the charge.
    if (deducted) {
      try {
        await sql`
          UPDATE wallet SET balance = balance + ${plan.priceKsh}, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${Number(user.userId)}
        `;
        await sql`
          INSERT INTO wallet_transactions (user_id, type, amount, description, status)
          VALUES (${Number(user.userId)}, 'refund', ${plan.priceKsh},
                  ${`Refund — WhatsApp Bot plan activation failed (${plan.name})`}, 'done')
        `;
      } catch (e2) {
        console.error('Pair plan refund failed:', e2.message);
      }
    }
    return NextResponse.json(
      { error: 'Failed to buy plan. Try again.', refunded: deducted },
      { status: 500 }
    );
  }
}
