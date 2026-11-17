// MZAZI API — GET /api/temp-number/[sid]
//
// Poll one order. The provider is the source of truth, so every poll asks it and
// caches whatever came back; nothing is invented locally.
import { NextResponse } from 'next/server';
import { findBySid, refresh } from '@/lib/smsnumber';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const order = await findBySid(params.sid);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  try {
    const fresh = await refresh(order);
    return NextResponse.json({
      sid: fresh.sid,
      phone: fresh.phone,
      status: fresh.status,
      code: fresh.code || null,
      price: fresh.price,
      country: fresh.country,
      service: fresh.service,
    });
  } catch {
    return NextResponse.json({ sid: order.sid, phone: order.phone, status: order.status, code: order.code || null });
  }
}
