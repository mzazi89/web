// MZAZI API — POST /api/wallet/deposit/mpesa
//
// Starts a direct M-PESA deposit: records the intent, then asks Safaricom to
// prompt the phone. Nothing is credited here. The money only exists once the
// callback (or a successful query) says the customer entered their PIN.
//
// The record is written before the prompt is sent, deliberately. If Safaricom
// times out on our side but still delivers the prompt, the callback can find the
// row and credit it; the reverse order would take the customer's money and leave
// it unclaimed.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/web-auth';
import { sql, ensureWalletSchema, generateReference, getDepositOffer, markTransactionFailed } from '@/lib/wallet';
import { isConfigured, stkPush, normalizeMpesaPhone, mpesaConfig } from '@/lib/mpesa';

export const dynamic = 'force-dynamic';

const MIN = 10;
const MAX = 150000;

export async function GET() {
  // The deposit page asks once whether to show the M-PESA tile at all.
  const config = await mpesaConfig();
  return NextResponse.json({ available: await isConfigured(), channel: config.type });
}

export async function POST(request) {
  const viewer = await requireUser();
  if (!viewer) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  if (!(await isConfigured())) {
    return NextResponse.json({ error: 'M-PESA is not available right now.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount);
  const phone = normalizeMpesaPhone(body.phone);

  if (!Number.isFinite(amount) || amount < MIN) {
    return NextResponse.json({ error: `Minimum deposit is KES ${MIN}.` }, { status: 400 });
  }
  if (amount > MAX) {
    return NextResponse.json({ error: `Maximum deposit is KES ${MAX.toLocaleString()}.` }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: 'Enter a valid Safaricom number, e.g. 0712 345 678.' }, { status: 400 });
  }

  await ensureWalletSchema();

  // One open prompt per customer: a second tap while the first is ringing would
  // otherwise leave two pending rows and a confusing double charge.
  const open = await sql`
    SELECT reference FROM wallet_transactions
    WHERE user_id = ${viewer.id} AND provider = 'mpesa'
      AND status = 'pending' AND created_at > NOW() - INTERVAL '3 minutes'
    LIMIT 1
  `;
  if (open.length) {
    return NextResponse.json({ error: 'A prompt is already on its way. Check your phone.', pending: true }, { status: 409 });
  }

  const reference = generateReference(viewer.id);

  // Stamp the offer multiplier now, exactly as the Paystack path does, so the
  // bonus the customer saw is the bonus they receive.
  let multiplier = 1;
  try {
    const offer = await getDepositOffer();
    if (offer?.enabled && Number(offer.multiplier) > 1) multiplier = Number(offer.multiplier);
  } catch { /* offer is optional */ }

  await sql`
    INSERT INTO wallet_transactions
      (user_id, type, amount, reference, description, status, payment_method, provider, phone_number, bonus_multiplier, created_at, updated_at)
    VALUES
      (${viewer.id}, 'deposit', ${amount}, ${reference}, ${'M-PESA deposit'}, 'pending',
       'mpesa_stk', 'mpesa', ${phone}, ${multiplier}, NOW(), NOW())
  `;

  let result;
  try {
    result = await stkPush({
      phone,
      amount,
      accountRef: reference.slice(-12),
      description: 'MZAZI wallet',
    });
  } catch (e) {
    await markTransactionFailed(reference, 'Could not reach Safaricom');
    return NextResponse.json({ error: 'M-PESA could not be reached. Please try again.' }, { status: 502 });
  }

  const checkoutId = result?.CheckoutRequestID;
  if (String(result?.ResponseCode) !== '0' || !checkoutId) {
    await markTransactionFailed(reference, result?.errorMessage || result?.ResponseDescription || 'Request rejected');
    const msg = /invalid|shortcode|party/i.test(String(result?.errorMessage || ''))
      ? 'M-PESA rejected the request. Please try again later.'
      : String(result?.CustomerMessage || result?.ResponseDescription || 'M-PESA could not send the prompt.');
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await sql`UPDATE wallet_transactions SET provider_ref = ${checkoutId}, updated_at = NOW() WHERE reference = ${reference}`;

  return NextResponse.json({
    ok: true,
    reference,
    checkoutRequestId: checkoutId,
    amount,
    phone,
    message: 'Enter your M-PESA PIN on your phone to complete the deposit.',
  });
}
