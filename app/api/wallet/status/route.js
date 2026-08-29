import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { CHARGE_TTL_MS } from '@/lib/paystack';
import {
  getTransactionByReference,
  verifyAndCreditWalletDeposit,
  markTransactionAbandoned,
} from '@/lib/wallet';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

// Polled by the deposit "processing" screen. Never credits the wallet on its
// own — success only ever comes from verifyAndCreditWalletDeposit, which
// requires Paystack's own confirmation.
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

    const tx = await getTransactionByReference(reference);
    if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    if (Number(tx.user_id) !== Number(decoded.userId)) {
      return NextResponse.json({ error: 'This transaction does not belong to your account' }, { status: 403 });
    }

    const base = { amount: Number(tx.amount), paymentMethod: tx.payment_method || 'card' };

    // Terminal DB states — no Paystack call needed
    if (tx.status === 'success') return NextResponse.json({ status: 'success', ...base });
    if (tx.status === 'failed') {
      return NextResponse.json({ status: 'failed', failureReason: tx.failure_reason || null, ...base });
    }
    if (tx.status === 'abandoned') {
      return NextResponse.json({ status: 'abandoned', failureReason: tx.failure_reason || null, ...base });
    }

    // Mobile-money prompts expire after 180 seconds (network-provider limit).
    const ageMs = Date.now() - new Date(tx.created_at).getTime();

    const result = await verifyAndCreditWalletDeposit(reference, { expectedUserId: decoded.userId });

    if (result.success) {
      return NextResponse.json({ status: 'success', ...base });
    }

    if (result.code === 'not_success' && (result.paystackStatus === 'failed' || result.paystackStatus === 'abandoned')) {
      return NextResponse.json({ status: 'failed', failureReason: 'Payment was not completed', ...base });
    }

    if (result.code === 'not_success' && ageMs > CHARGE_TTL_MS) {
      await markTransactionAbandoned(reference, 'Payment prompt expired (180s) without authorization');
      return NextResponse.json({ status: 'abandoned', failureReason: 'Payment request expired', ...base });
    }

    return NextResponse.json({ status: tx.status, ...base });
  } catch (error) {
    console.error('Wallet status error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }
}
