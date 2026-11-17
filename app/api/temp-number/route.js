// MZAZI API — /api/temp-number
//
// First-party: talks to 5SIM directly, no reseller in the middle.
//
//   GET  ?action=countries              → countries that have stock
//   GET  ?action=services&country=kenya → services with live price and stock
//   POST { action: 'buy', country, service } → one number
//   POST { action: 'cancel', sid }
//
// Browsing needs no key. Buying does — a number costs money, and the key is the
// only thing standing between a stranger and your balance.
import { NextResponse } from 'next/server';
import { clientIp, ipRateLimit } from '@/lib/ip-limiter';
import { optionalUser } from '@/lib/api/session';
import { countries, services, buy, configured, findBySid, cancel } from '@/lib/smsnumber';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'countries';

  try {
    if (action === 'services') {
      const list = await services(searchParams.get('country'));
      return NextResponse.json({ services: list, configured: await configured() });
    }
    const list = await countries();
    return NextResponse.json({ countries: list, configured: await configured() });
  } catch (e) {
    return NextResponse.json({ error: 'The number provider is not answering right now.' }, { status: 502 });
  }
}

export async function POST(request) {
  let body = {};
  try { body = await request.json(); } catch {}

  if (body.action === 'cancel') {
    const order = await findBySid(String(body.sid || ''));
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json(await cancel(order));
  }

  const limit = ipRateLimit(clientIp(request), { max: 10, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many numbers from this connection — try again later.' }, { status: 429 });
  }

  const user = await optionalUser();
  try {
    const order = await buy({ country: body.country, service: body.service, userId: user?.id, ip: clientIp(request) });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    if (e.code === 'NOKEY') {
      return NextResponse.json(
        { error: 'Receiving SMS is not switched on yet — add the provider key in Admin → Settings.' },
        { status: 503 }
      );
    }
    if (e.code === 'AUTH') return NextResponse.json({ error: 'The provider rejected the stored key.' }, { status: 502 });
    if (e.code === 'BALANCE') return NextResponse.json({ error: 'The provider balance is empty.' }, { status: 402 });
    if (e.code === 'INPUT') return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: 'No number available for that service right now.' }, { status: 502 });
  }
}
