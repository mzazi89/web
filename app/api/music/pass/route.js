// /api/music/pass — read the current pass, or buy one with wallet balance.
import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api/session';
import { activePass, buyPass, TIERS } from '@/lib/music';
import { salePrice, fmtKes } from '@/lib/currency';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await optionalUser();
  const pass = await activePass(user?.id);
  const tiers = Object.entries(TIERS).map(([id, t]) => ({ id, label: t.label, price: salePrice(t.price), priceLabel: fmtKes(salePrice(t.price)) }));
  return NextResponse.json({ pass, tiers });
}

export async function POST(request) {
  const user = await optionalUser();
  if (!user) return NextResponse.json({ error: 'Sign in to buy a download pass.' }, { status: 401 });

  let tier = '';
  try { ({ tier } = await request.json()); } catch {}

  try {
    const pass = await buyPass(user.id, tier);
    return NextResponse.json({ pass }, { status: 201 });
  } catch (e) {
    if (e.code === 'FUNDS') return NextResponse.json({ error: e.message }, { status: 402 });
    if (e.code === 'INPUT') return NextResponse.json({ error: 'Choose a plan.' }, { status: 400 });
    return NextResponse.json({ error: 'Could not buy that pass.' }, { status: 500 });
  }
}
