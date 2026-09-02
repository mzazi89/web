// MZAZI API — GET /api/wallet/offer
// Returns the current deposit-offer config (read from the shared settings
// table) so the wallet page can render the ad banner and the live bonus
// preview. Auth-gated — only logged-in users see the promo.
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getDepositOffer } from '@/lib/wallet';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const offer = await getDepositOffer();
    return NextResponse.json({ offer });
  } catch (e) {
    console.error('Offer GET error:', e.message);
    return NextResponse.json({ error: 'Failed to load offer' }, { status: 500 });
  }
}
