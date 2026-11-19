import { NextResponse } from 'next/server';
import { mpesaConfig } from '@/lib/mpesa';
import { settleWithdrawal } from '@/lib/withdrawals';

export const dynamic = 'force-dynamic';

// MZAZI API — POST /api/mpesa/b2c/timeout
//
// Safaricom could not process the payout in time. Treat it as a failure and put
// the money back immediately: the alternative is a customer staring at a balance
// that is short and a payout that may never arrive. If Safaricom later sends a
// result anyway, settlement is idempotent — the row is already failed and no
// second refund is issued.
export async function POST(request) {
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  try {
    const c = await mpesaConfig();
    if (c.callbackSecret) {
      const key = new URL(request.url).searchParams.get('k') || '';
      if (key !== c.callbackSecret) return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
  } catch {
    /* ignore */
  }

  const result = payload?.Result || payload || {};

  try {
    await settleWithdrawal({
      originatorId: result.OriginatorConversationID || null,
      conversationId: result.ConversationID || null,
      resultCode: result.ResultCode ?? 1,
      resultDesc: result.ResultDesc || 'Timed out waiting for M-PESA',
      receipt: null,
    });
  } catch (e) {
    console.error('[b2c/timeout]', e?.message || e);
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
