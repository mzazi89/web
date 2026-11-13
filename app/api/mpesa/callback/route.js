// MZAZI API — POST /api/mpesa/callback
//
// Safaricom calls this when the customer finishes (or abandons) an STK prompt.
// It is the authoritative signal: money is credited here and only here, through
// creditWalletOnce(), which is idempotent, applies the stamped bonus, fires the
// referral check and the "money in" push.
//
// Rules that matter:
//   * always answer 200 with {ResultCode:0} — a non-200 makes Daraja retry and
//     eventually disable the URL, and we would rather reconcile via query than
//     lose the callback entirely;
//   * never trust the amount in the callback alone: it is compared with the row
//     we wrote before the prompt, and a mismatch is flagged, not credited;
//   * an unknown CheckoutRequestID is logged and swallowed, because a stranger
//     guessing URLs must not be able to create ledger entries.
import { NextResponse } from 'next/server';
import { sql, ensureWalletSchema, creditWalletOnce, markTransactionFailed } from '@/lib/wallet';
import { mpesaConfig } from '@/lib/mpesa';

export const dynamic = 'force-dynamic';

const ok = () => NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });

export async function POST(request) {
  // Optional shared secret appended to the callback URL by the deposit endpoint.
  const secret = (await mpesaConfig()).callbackSecret;
  if (secret) {
    const given = new URL(request.url).searchParams.get('k') || '';
    if (given !== secret) return ok(); // plausible noise; accept, do nothing
  }

  const body = await request.json().catch(() => null);
  const callback = body?.Body?.stkCallback;
  const checkoutId = callback?.CheckoutRequestID;
  if (!checkoutId) return ok();

  await ensureWalletSchema();

  const rows = await sql`
    SELECT id, user_id, reference, amount, status, provider_receipt
    FROM wallet_transactions
    WHERE provider_ref = ${checkoutId} AND provider = 'mpesa'
    LIMIT 1
  `;
  if (!rows.length) {
    console.warn('[mzazi] mpesa callback for unknown checkout', checkoutId);
    return ok();
  }

  const txn = rows[0];
  if (txn.status === 'success') return ok(); // duplicate callback

  const resultCode = Number(callback.ResultCode);
  const items = callback.CallbackMetadata?.Item || [];
  const item = (name) => items.find((i) => i.Name === name)?.Value;
  const paid = Number(item('Amount') || 0);
  const receipt = String(item('MpesaReceiptNumber') || '');

  if (resultCode !== 0) {
    await markTransactionFailed(txn.reference, callback.ResultDesc || `M-PESA declined (${resultCode})`);
    return ok();
  }

  // Amount guard: Safaricom echoes what was charged. A mismatch means the prompt
  // was tampered with or the row is not the one this callback belongs to.
  if (paid && Math.abs(paid - Number(txn.amount)) > 0.5) {
    await markTransactionFailed(txn.reference, `Amount mismatch: charged ${paid}, expected ${txn.amount}`);
    console.error('[mzazi] mpesa amount mismatch', { checkoutId, paid, expected: txn.amount });
    return ok();
  }

  if (receipt) {
    await sql`UPDATE wallet_transactions SET provider_receipt = ${receipt} WHERE id = ${txn.id}`;
  }
  await creditWalletOnce({ reference: txn.reference, paidAt: new Date() });

  return ok();
}
