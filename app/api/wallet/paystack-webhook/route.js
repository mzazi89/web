import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paystack';
import { processSuccessfulWalletPayment } from '@/lib/walletPayments';

export const dynamic = 'force-dynamic';

/**
 * Paystack webhook endpoint.
 *
 * Configure in the Paystack dashboard → Settings → API Keys & Webhooks:
 *   Webhook URL: https://<your-domain>/api/wallet/paystack-webhook
 *
 * Security:
 *   - The raw body is verified against `x-paystack-signature`
 *     (HMAC-SHA512 with the secret key) before anything is processed.
 *   - The wallet is credited exactly once, atomically, by
 *     processSuccessfulWalletPayment — duplicate events are ignored.
 *
 * We always acknowledge with 200 OK so Paystack stops retrying; if our
 * processing fails, Paystack's retries are safe thanks to idempotency.
 */
export async function POST(request) {
  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const signature = request.headers.get('x-paystack-signature');
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (event.event === 'charge.success' && event.data?.reference) {
    const reference = event.data.reference;
    try {
      const result = await processSuccessfulWalletPayment(reference);
      if (!result.credited && !result.already) {
        console.warn(`Webhook processed but no credit: ${reference} → ${result.reason}`);
      }
    } catch (e) {
      // Never fail the webhook response: Paystack will retry, and retries are
      // idempotent. Log for investigation.
      console.error(`Webhook processing error for ${event.data.reference}:`, e);
    }
  }

  return NextResponse.json({ received: true });
}
