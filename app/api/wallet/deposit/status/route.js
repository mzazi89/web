import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import { processSuccessfulWalletPayment } from '@/lib/walletPayments';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

/**
 * Polling endpoint for the deposit processing screen.
 * The frontend polls this every ~4s while waiting for Paystack confirmation.
 *
 * Safety: it never credits anything itself — it only REPORTS the database
 * status. If the payment has been pending for a while (e.g. the webhook was
 * missed), it triggers the same idempotent verifier used by the webhook;
 * that verifier is the only code path that can credit the wallet.
 */
export async function GET(request) {
  let userId;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = jwt.verify(token.value, JWT_SECRET);
    userId = decoded.userId;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  try {
    const reference = new URL(request.url).searchParams.get('reference');
    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, user_id, amount, reference, status, payment_method, paid_at, created_at, description
      FROM wallet_transactions
      WHERE reference = ${reference} AND user_id = ${userId} AND type = 'deposit'
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    const tx = rows[0];

    // Webhook fallback: if still pending after 40s, let the verified processor
    // check Paystack directly. It is idempotent, so repeated polls are safe —
    // but we window the attempts (~every 45s) to avoid hammering the Verify API.
    if ((tx.status === 'pending' || tx.status === 'processing')) {
      const ageSec = Math.floor((Date.now() - new Date(tx.created_at).getTime()) / 1000);
      const shouldVerify =
        (ageSec >= 45 && ageSec < 49) ||
        (ageSec >= 90 && ageSec < 94) ||
        (ageSec >= 135 && ageSec < 139) ||
        ageSec >= 175;
      if (shouldVerify) {
        try {
          await processSuccessfulWalletPayment(reference);
        } catch (e) {
          console.error(`Status poll verify failed for ${reference}:`, e);
        }
        // Re-read after the processor attempt
        const after = await sql`
          SELECT id, user_id, amount, reference, status, payment_method, paid_at, created_at, description
          FROM wallet_transactions
          WHERE reference = ${reference} AND user_id = ${userId} AND type = 'deposit'
        `;
        if (after.length > 0) {
          const fresh = after[0];
          return NextResponse.json({
            reference: fresh.reference,
            status: fresh.status,
            amount: Number(fresh.amount),
            paymentMethod: fresh.payment_method,
            paidAt: fresh.paid_at || null,
            description: fresh.description,
          });
        }
      }
    }

    return NextResponse.json({
      reference: tx.reference,
      status: tx.status,
      amount: Number(tx.amount),
      paymentMethod: tx.payment_method,
      paidAt: tx.paid_at || null,
      description: tx.description,
    });
  } catch (error) {
    console.error('Deposit status error:', error);
    return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 });
  }
}
