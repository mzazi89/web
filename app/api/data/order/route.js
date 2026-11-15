// MZAZI API — POST /api/data/order  { planId, phone }
//
// Debits the wallet and asks Safaricom to deliver. Any failure is refunded
// inside placeOrder(), so this handler only translates outcomes into status
// codes the page can act on.
import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api/session';
import { placeOrder } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const user = await optionalUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const planId = Number(body?.planId);
  if (!Number.isInteger(planId)) return NextResponse.json({ error: 'Choose a bundle.' }, { status: 400 });

  const result = await placeOrder(user.id, { planId, phone: String(body?.phone || '') }).catch((e) => {
    console.error('[mzazi] data order failed:', e.message);
    return { error: 'Could not place that order — nothing was charged.', status: 500 };
  });

  if (result.error) return NextResponse.json(result, { status: result.status || 400 });
  return NextResponse.json(result);
}
