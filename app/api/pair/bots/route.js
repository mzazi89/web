// MZAZI API — GET /api/pair/bots
//
// The bots this site can pair into, with their live state, so the pairing panel
// can offer a selector. `multiple` is the switch the UI reads: with one bot
// there is nothing to choose and the form stays as it was.
//
// Behind login like the rest of /api/pair/* — the panel only renders when
// authenticated, so an unauthenticated caller has nothing to do with this.
import { NextResponse } from 'next/server';
import { auth } from '@/lib/pairApi';
import { listBotsWithStatus } from '@/lib/bots';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await auth();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { bots, multiple } = await listBotsWithStatus();
    return NextResponse.json(
      { bots, multiple },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    console.error('Pair bots error:', e.message);
    return NextResponse.json({ error: 'Failed to load bots' }, { status: 500 });
  }
}
