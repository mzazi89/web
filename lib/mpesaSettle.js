// MZAZI — settling an M-PESA prompt.
//
// One place decides whether a pending STK row became money. Both readers use it:
// the deposit page's poll (/api/wallet/status) and the dedicated mpesa status
// endpoint, so the two can never disagree about what happened.
//
// The row is written before the prompt is sent, so "pending" is the normal state
// for the first ~20 seconds and must never be reported as failure.
import { creditWalletOnce, markTransactionFailed } from '@/lib/wallet';
import { stkQuery } from '@/lib/mpesa';

// ResultCodes that mean the prompt is over and will not succeed.
const TERMINAL = {
  1032: 'You cancelled the prompt on your phone.',
  1037: 'The prompt timed out. Please try again.',
  1: 'Not enough money in your M-PESA account.',
  2001: 'Wrong M-PESA PIN entered.',
  1019: 'The transaction expired. Please try again.',
  1001: 'Another M-PESA transaction is in progress. Try again in a moment.',
};

/**
 * @returns {{ status: 'success'|'failed'|'pending', message?: string, amount?: number }}
 */
export async function reconcileMpesa(tx) {
  if (tx.status === 'success') return { status: 'success', amount: Number(tx.amount) };
  if (tx.status === 'failed') {
    return { status: 'failed', message: tx.failure_reason || 'Payment was not completed.' };
  }
  if (!tx.provider_ref) return { status: 'pending' };

  try {
    const q = await stkQuery(tx.provider_ref);
    const code = q?.ResultCode !== undefined && q?.ResultCode !== null ? Number(q.ResultCode) : null;

    if (code === 0) {
      await creditWalletOnce({ reference: tx.reference, paidAt: new Date() });
      return { status: 'success', amount: Number(tx.amount) };
    }
    if (code !== null && TERMINAL[code]) {
      await markTransactionFailed(tx.reference, TERMINAL[code]);
      return { status: 'failed', message: TERMINAL[code] };
    }
  } catch {
    // Daraja unreachable — the callback may still land, so keep waiting.
  }

  return { status: 'pending' };
}
