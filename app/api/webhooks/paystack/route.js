import { NextResponse } from 'next/server';
import { isValidWebhookSignature } from '@/lib/paystack';
import {
  ensureWalletSchema,
  verifyAndCreditWalletDeposit,
  markTransactionFailed,
} from '@/lib/wallet';
import { ensureVpsSchema, fulfillVpsOrderIfPaid } from '@/lib/vps';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// Paystack webhook — wallet deposits + VPS orders
// Configure in Paystack Dashboard → Settings → API Keys & Webhooks:
//   https://mzazi.shop/api/webhooks/paystack
//
// Security:
//  - Every request MUST carry a valid x-paystack-signature
//    (HMAC-SHA512 of the raw body signed with PAYSTACK_SECRET_KEY).
//  - References starting with "WALLET-" → wallet deposits (credit).
//  - References starting with "VPS-" → VPS orders (assign instance).
//  - charge.success → verify+fulfil via the shared idempotent pipeline.
//    Duplicate deliveries can never double-credit or double-assign.
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

  if (!reference || !String(reference).startsWith('WALLET-')) {
    // Anything that isn't a wallet deposit — VPS orders or unrelated — is
    // routed here by reference prefix.
    if (reference && String(reference).startsWith('VPS-') && event.event === 'charge.success') {
      try {
        await ensureVpsSchema();
        const result = await fulfillVpsOrderIfPaid(reference);
        if (!result.success) {
          console.error(`VPS webhook fulfillment failed for ${reference}:`, result.reason);
        }
        return NextResponse.json({ received: true, fulfilled: result.success, already: result.already });
      } catch (e) {
        console.error('VPS webhook error:', e.message);
        return NextResponse.json({ error: 'VPS webhook processing failed' }, { status: 500 });
      }
    }
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
