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
import { isConfigured, stkPush, normalizeMpesaPhone, mpesaConfig, accessToken } from '@/lib/mpesa';

export const dynamic = 'force-dynamic';

const MIN = 10;
const MAX = 150000;

export async function GET(request) {
  // The deposit page asks once whether to show the M-PESA tile at all.
  // Shape, not secrets: enough to tell a sandbox/live mix-up or a wrong channel
  // from a bad passkey without ever echoing a key.
  const config = await mpesaConfig();
  const mask = (v) => (v ? `${String(v).slice(0, 3)}…${String(v).slice(-3)} (${String(v).length})` : null);
  // ?probe=auth asks Safaricom for a token and reports only whether the key and
  // secret were accepted. It never sends a prompt and never returns the token, so
  // it is safe to leave reachable — and it isolates "wrong credentials" from
  // "wrong shortcode", which look identical to the customer.
  if (new URL(request.url).searchParams.get('probe') === 'auth') {
    try {
      await accessToken(true);
      return NextResponse.json({ auth: 'ok' });
    } catch (e) {
      const cause = e?.cause || {};
      const detail = [
        String(e?.message || e),
        cause.code || cause.errno || '',
        String(cause.message || '').slice(0, 120),
      ].filter(Boolean).join(' | ');
      return NextResponse.json({ auth: 'failed', detail: detail.slice(0, 300) }, { status: 502 });
    }
  }

  return NextResponse.json({
    available: await isConfigured(),
    channel: config.type,
    env: config.base.includes('sandbox') ? 'sandbox' : 'production',
    shortcode: mask(config.shortcode),
    key: Boolean(config.key),
    secret: Boolean(config.secret),
    passkey: Boolean(config.passkey),
    callback: config.callbackUrl ? new URL(config.callbackUrl).host + new URL(config.callbackUrl).pathname : null,
  });
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
    // Keep Safaricom's own wording. It is the only thing that distinguishes a
    // wrong passkey from a wrong shortcode or a sandbox/production mix-up, and
    // it contains no secrets — hiding it just makes the failure unactionable.
    const detail = String(
      result?.errorMessage || result?.ResponseDescription || result?.CustomerMessage || 'Request rejected'
    ).slice(0, 160);
    await markTransactionFailed(reference, detail);
    return NextResponse.json({
      error: `M-PESA could not send the prompt: ${detail}`,
      detail,
      code: result?.errorCode || null,
    }, { status: 400 });
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
