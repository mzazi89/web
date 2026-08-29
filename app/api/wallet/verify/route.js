import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ensureWalletSchema, verifyAndCreditWalletDeposit, getTransactionByReference } from '@/lib/wallet';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET;
const BASE_URL = () => process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

function redirect(path) {
  return NextResponse.redirect(new URL(path, BASE_URL()));
}

// ─── GET — redirect callback used by the Paystack card checkout ──────────────
// Paystack sends the customer back here (?reference / ?trxref) after the card
// flow. The wallet is credited ONLY via the shared verify+credit pipeline,
// which requires Paystack's own confirmation — never from this URL alone.
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const reference = url.searchParams.get('reference') || url.searchParams.get('trxref');
    if (!reference) return redirect('/wallet?error=no_reference');

    await ensureWalletSchema();

    // Best-effort session user for ownership checking (card flow is initiated
    // from a logged-in page, so the cookie is normally present).
    let expectedUserId = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token');
      if (token) expectedUserId = jwt.verify(token.value, JWT_SECRET).userId;
    } catch {
      expectedUserId = null;
    }

    const result = await verifyAndCreditWalletDeposit(reference, { expectedUserId });

    if (result.success) {
      const method = (await getTransactionByReference(reference))?.payment_method || 'card';
      const qs = `success=credited&amount=${result.amount}&method=${encodeURIComponent(method)}`;
      return redirect(result.already ? `/wallet?success=already_credited` : `/wallet?${qs}`);
    }

    if (result.code === 'not_found') return redirect('/wallet?error=no_reference');
    if (result.code === 'user_mismatch') return redirect('/wallet?error=user_mismatch');
    if (result.code === 'not_success') return redirect('/wallet?error=payment_failed');
    return redirect('/wallet?error=verification_failed');
  } catch (error) {
    console.error('Wallet verify error:', error);
    return redirect('/wallet?error=server_error');
  }
}

// ─── POST — manual verification (kept for API compatibility) ─────────────────
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const { reference } = await request.json().catch(() => ({}));
    if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

    await ensureWalletSchema();
    const result = await verifyAndCreditWalletDeposit(reference, { expectedUserId: decoded.userId });

    if (result.success) {
      return NextResponse.json({
        message: result.already ? 'Already credited' : 'Wallet credited',
        already: !!result.already,
        amount: result.amount,
      });
    }
    if (result.code === 'not_success') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }
    if (result.code === 'not_found') {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  } catch (error) {
    console.error('Manual verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
