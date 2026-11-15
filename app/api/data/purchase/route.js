// MZAZI API — POST /api/data/purchase  { msisdn, offer: { id, name, price } }
//
// Submits the purchase with a server-generated reference. The client never picks
// the reference and never states the amount as truth: both are recorded here so
// a retry cannot become a second sale.
import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api/session';
import { buyOffer } from '@/lib/daraja/service';

export const dynamic = 'force-dynamic';

const ref = () => `DO${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

export async function POST(request) {
  const user = await optionalUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const offer = body?.offer;
  if (!offer || !offer.id) return NextResponse.json({ error: 'Choose an offer.' }, { status: 400 });

  const result = await buyOffer({
    userId: user.id,
    msisdnInput: body?.msisdn,
    offer: { id: offer.id, name: offer.name, price: offer.price },
    amount: offer.price,
    reference: ref(),
  });

  if (result.ok) return NextResponse.json(result);
  const status = { invalid: 400, duplicate: 409, config: 503, timeout: 504 }[result.kind] || 502;
  return NextResponse.json(result, { status });
}
