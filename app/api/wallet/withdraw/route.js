import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api/session';
import { sql } from '@/lib/wallet';
import {
  startWithdrawal, recentWithdrawals, withdrawalLimits, ensureWithdrawalSchema,
} from '@/lib/withdrawals';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/wallet/withdraw
//
//   GET   whether payouts work, the limits, the balance and recent history
//   POST  { amount, phone, note } → one payout to M-PESA
//
// Everything that decides whether money may leave lives in lib/withdrawals.js:
// the atomic debit, the single-in-flight rule, and the refund paths. This route
// only authenticates, validates the shape of the request, and reports.
export async function GET() {
  const viewer = await optionalUser();
  if (!viewer) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    await ensureWithdrawalSchema();
    const [limits, wallet] = await Promise.all([
      withdrawalLimits(),
      sql`SELECT balance FROM wallet WHERE user_id = ${viewer.id} LIMIT 1`,
    ]);
    const recent = await recentWithdrawals(viewer.id, 5);

    return NextResponse.json({
      ...limits,
      balance: Number(wallet[0]?.balance || 0),
      recent,
    });
  } catch (e) {
    console.error('[wallet/withdraw GET]', e?.message || e);
    return NextResponse.json({ error: 'Could not load withdrawal settings' }, { status: 500 });
  }
}

export async function POST(request) {
  const viewer = await optionalUser();
  if (!viewer) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const result = await startWithdrawal({
    userId: viewer.id,
    amount: body.amount,
    phone: body.phone,
    password: typeof body.password === 'string' ? body.password : '',
    note: typeof body.note === 'string' ? body.note.slice(0, 80) : '',
  });

  if (!result.ok) {
    const status = result.code === 'unconfigured' ? 503
      : result.code === 'auth' ? 401
        : result.code === 'locked' ? 429
          : result.code === 'funds' ? 402
            : result.code === 'inflight' ? 409
              : result.code === 'provider' || result.code === 'transport' ? 502
                : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  const wallet = await sql`SELECT balance FROM wallet WHERE user_id = ${viewer.id} LIMIT 1`;

  return NextResponse.json({
    ok: true,
    transaction: {
      id: result.transaction.id,
      reference: result.transaction.reference,
      amount: Number(result.transaction.amount),
      phone: result.transaction.phone_number,
      status: result.transaction.status,
    },
    balance: Number(wallet[0]?.balance || 0),
    message: 'Sent to M-PESA. You will get a Safaricom message once it completes.',
  });
}
