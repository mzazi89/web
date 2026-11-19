import { NextResponse } from 'next/server';
import { mpesaConfig } from '@/lib/mpesa';
import { settleWithdrawal } from '@/lib/withdrawals';

export const dynamic = 'force-dynamic';

// MZAZI API — POST /api/mpesa/b2c/result
//
// Safaricom's payout result. This is the only place that decides a withdrawal
// succeeded, because the B2C call itself only says "queued".
//
// Two rules matter here:
//
//   * Always answer 200 with a ResultCode. A non-200 makes Safaricom retry the
//     callback, and a retried success would look like a second payout.
//   * Never trust the payload for the amount. The ledger row holds what the
//     customer asked for; the callback only moves it between states.
export async function POST(request) {
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  // Same shared secret the STK callback uses, if one is configured.
  try {
    const c = await mpesaConfig();
    if (c.callbackSecret) {
      const key = new URL(request.url).searchParams.get('k') || '';
      if (key !== c.callbackSecret) {
        console.warn('[b2c/result] ignored callback with a bad secret');
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }
    }
  } catch {
    /* a config read failure must not stop us answering */
  }

  const result = payload?.Result || {};
  const params = result?.ResultParameters?.ResultParameter || [];
  // Safaricom puts the M-PESA receipt inside ResultParameters on most callbacks
  // and directly on Result on some; read both rather than lose it.
  const fromParams = Array.isArray(params)
    ? params.find((p) => p?.Key === 'TransactionID' || p?.Key === 'ReceiptNo')?.Value
    : null;
  const receipt = fromParams || result.TransactionID || result.ReceiptNo || null;

  try {
    const outcome = await settleWithdrawal({
      originatorId: result.OriginatorConversationID || null,
      conversationId: result.ConversationID || null,
      resultCode: result.ResultCode,
      resultDesc: result.ResultDesc,
      receipt: receipt ? String(receipt) : null,
    });
    console.log('[b2c/result]', JSON.stringify({
      originator: result.OriginatorConversationID,
      code: result.ResultCode,
      outcome: outcome.status,
      matched: outcome.matched,
    }));
  } catch (e) {
    console.error('[b2c/result] settle failed:', e?.message || e);
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
