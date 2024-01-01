import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import https from 'https';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function verifyPaystack(reference) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${encodeURIComponent(reference)}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const reference = url.searchParams.get('reference') || url.searchParams.get('trxref');

    if (!reference) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/wallet?error=no_reference`);
    }

    const result = await verifyPaystack(reference);
    if (!result.status || result.data.status !== 'success') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/wallet?error=payment_failed`);
    }

    const meta = result.data.metadata || {};
    const userId = meta.user_id;
    const amountKsh = meta.amount_ksh || result.data.amount / 100;

    // Check if already processed
    const existing = await sql`
      SELECT id, status FROM wallet_transactions WHERE reference = ${reference}
    `;
    if (existing.length > 0 && existing[0].status === 'success') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/wallet?success=already_credited`);
    }

    // Credit wallet
    await sql`
      INSERT INTO wallet (user_id, balance) VALUES (${userId}, ${amountKsh})
      ON CONFLICT (user_id) DO UPDATE SET balance = wallet.balance + ${amountKsh}, updated_at = NOW()
    `;

    await sql`
      UPDATE wallet_transactions SET status = 'success' WHERE reference = ${reference}
    `;

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/wallet?success=credited&amount=${amountKsh}`);
  } catch (error) {
    console.error('Wallet verify error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/wallet?error=server_error`);
  }
}

// For manual verification from frontend
export async function POST(request) {
  try {
    const { reference } = await request.json();
    const result = await verifyPaystack(reference);

    if (!result.status || result.data.status !== 'success') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }

    const meta = result.data.metadata || {};
    const userId = meta.user_id;
    const amountKsh = meta.amount_ksh || result.data.amount / 100;

    const existing = await sql`SELECT status FROM wallet_transactions WHERE reference = ${reference}`;
    if (existing.length > 0 && existing[0].status === 'success') {
      return NextResponse.json({ message: 'Already credited', already: true });
    }

    await sql`
      INSERT INTO wallet (user_id, balance) VALUES (${userId}, ${amountKsh})
      ON CONFLICT (user_id) DO UPDATE SET balance = wallet.balance + ${amountKsh}, updated_at = NOW()
    `;
    await sql`UPDATE wallet_transactions SET status = 'success' WHERE reference = ${reference}`;

    return NextResponse.json({ message: 'Wallet credited', amount: amountKsh });
  } catch (error) {
    console.error('Manual verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
