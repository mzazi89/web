import { NextResponse } from 'next/server';
import { isValidWebhookSignature } from '@/lib/paystack';
import {
  ensureWalletSchema,
  verifyAndCreditWalletDeposit,
  markTransactionFailed,
} from '@/lib/wallet';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// Paystack webhook — wallet deposits
// Configure in Paystack Dashboard → Settings → API Keys & Webhooks:
//   https://mzazi.shop/api/webhooks/paystack
//
// Security:
//  - Every request MUST carry a valid x-paystack-signature
//    (HMAC-SHA512 of the raw body signed with PAYSTACK_SECRET_KEY).
//  - Only references starting with "WALLET-" (wallet deposits) are handled.
//  - charge.success → verify+credit via the shared idempotent pipeline.
//    Duplicate deliveries can never double-credit the wallet.
//  - Always acknowledge with 200 so Paystack stops retrying.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature') || '';

  if (!isValidWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const data = event?.data || {};
  const reference = data.reference;

  // Not a wallet deposit → acknowledge and ignore (products/subscriptions live
  // in the other services' webhook handlers).
  if (!reference || !String(reference).startsWith('WALLET-')) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    await ensureWalletSchema();

    if (event.event === 'charge.success') {
      const result = await verifyAndCreditWalletDeposit(reference);
      return NextResponse.json({ received: true, credited: result.success, already: result.already });
    }

    if (event.event === 'charge.failed') {
      await markTransactionFailed(reference, data.gateway_response || data.message || 'Payment failed');
      return NextResponse.json({ received: true, status: 'failed' });
    }

    // charge.pending and any other events: nothing to do yet
    return NextResponse.json({ received: true, ignored: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
