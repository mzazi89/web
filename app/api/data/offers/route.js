// MZAZI API — POST /api/data/offers  { msisdn }
//
// Looks up what Safaricom will actually sell this number. Read-only: nothing is
// charged, and no offer is cached — prices change and a stale shelf is a lie.
import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api/session';
import { fetchOffers } from '@/lib/daraja/service';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const user = await optionalUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const result = await fetchOffers(body?.msisdn, user.id);

  if (result.ok) return NextResponse.json(result);
  const status = { invalid: 400, config: 503, auth: 502, permission: 502, timeout: 504, contract: 502 }[result.kind] || 502;
  return NextResponse.json(result, { status });
}
