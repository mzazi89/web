import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { processSuccessfulWalletPayment } from '@/lib/walletPayments';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL);
const BASE = process.env.NEXT_PUBLIC_BASE_URL || '';

/**
 * Card-flow callback + manual verification endpoint.
 *
 * After the customer completes Paystack's hosted checkout, the browser is
 * redirected here with ?reference=... We run the SAME idempotent, atomic
 * processor used by the webhook — so double processing is impossible.
 *
 * GET  → verify, credit, redirect to /wallet?success=credited
 * POST → verify, credit, return JSON (used for manual "I've paid" checks)
 */
async function verifyAndCredit(reference) {
  if (!reference) return { result: null, error: 'no_reference' };
  const result = await processSuccessfulWalletPayment(reference);
  return { result, error: null };
}

export async function GET(request) {
  try {
    const reference = new URL(request.url).searchParams.get('reference') || new URL(request.url).searchParams.get('trxref');

    if (!reference) {
      return NextResponse.redirect(`${BASE}/wallet?error=no_reference`);
    }

    const { result } = await verifyAndCredit(reference);
    if (!result) {
      return NextResponse.redirect(`${BASE}/wallet?error=payment_failed`);
    }
    if (result.credited) {
      const tx = await sql`SELECT amount FROM wallet_transactions WHERE reference = ${reference}`;
      const amount = tx.length > 0 ? Number(tx[0].amount) : 0;
      return NextResponse.redirect(`${BASE}/wallet?success=credited&amount=${amount}`);
    }
    if (result.already) {
      return NextResponse.redirect(`${BASE}/wallet?success=already_credited`);
    }
    // failed / abandoned / not found / mismatch
    return NextResponse.redirect(`${BASE}/wallet?error=payment_failed`);
  } catch (error) {
    console.error('Wallet verify error:', error);
    return NextResponse.redirect(`${BASE}/wallet?error=server_error`);
  }
}

export async function POST(request) {
  try {
    const { reference } = await request.json();
    const { result, error } = await verifyAndCredit(reference);
    if (error === 'no_reference' || !result) {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }
    if (result.credited) {
      return NextResponse.json({ message: 'Wallet credited', amount: result.tx?.amount });
    }
    if (result.already) {
      return NextResponse.json({ message: 'Already credited', already: true });
    }
    return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
  } catch (error) {
    console.error('Manual verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
