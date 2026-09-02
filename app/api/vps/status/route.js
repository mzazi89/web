// MZAZI API — GET /api/vps/status?reference=…
// Polled by the /vps page after a mobile-money charge. Verifies with Paystack
// and, on success, fulfills the order (assigns the VPS instance) via the
// shared idempotent pipeline — safe to call repeatedly.
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { verifyTransaction, CHARGE_TTL_MS } from '@/lib/paystack';
import { ensureVpsSchema, getVpsOrderByReference, getFulfilledVps, markVpsOrderFailed, fulfillVpsOrderIfPaid } from '@/lib/vps';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = jwt.verify(token.value, JWT_SECRET);
    const userId = decoded.userId;

    const reference = request.nextUrl.searchParams.get('reference');
    if (!reference) return NextResponse.json({ error: 'Reference is required' }, { status: 400 });

    await ensureVpsSchema();
    const order = await getVpsOrderByReference(reference);
    if (!order || order.user_id !== userId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'success') {
      const vps = await getFulfilledVps(reference);
      return NextResponse.json({ status: 'success', vps });
    }
    if (order.status === 'failed') {
      return NextResponse.json({ status: 'failed' });
    }

    // Still pending/processing — did the 180s mobile-money window lapse?
    const created = new Date(order.created_at).getTime();
    if (Date.now() - created > CHARGE_TTL_MS) {
      await markVpsOrderFailed(reference, 'Payment prompt expired');
      return NextResponse.json({ status: 'failed', error: 'Payment window expired — please try again.' });
    }

    // Ask Paystack directly.
    const { json } = await verifyTransaction(reference);
    const txStatus = json?.data?.status;

    if (txStatus === 'success') {
      const result = await fulfillVpsOrderIfPaid(reference);
      if (result.success) {
        return NextResponse.json({ status: 'success', vps: result.vps });
      }
      if (result.reason === 'out_of_stock') {
        return NextResponse.json({ status: 'out_of_stock', error: 'Payment received but no instance was available — support has been notified and will refund you.' });
      }
      return NextResponse.json({ status: 'failed', error: 'Payment could not be confirmed.' });
    }

    if (txStatus === 'failed' || txStatus === 'abandoned') {
      await markVpsOrderFailed(reference, `Payment ${txStatus}`);
      return NextResponse.json({ status: 'failed' });
    }

    return NextResponse.json({ status: 'processing' });
  } catch (e) {
    console.error('VPS status error:', e.message);
    return NextResponse.json({ error: 'Failed to check order' }, { status: 500 });
  }
}
