// MZAZI API — GET /api/notifications/push-key
//
// The VAPID public key the browser needs to create a push subscription. Public
// by design (it is sent to every client anyway); the private half stays in the
// database and is never returned here.
import { NextResponse } from 'next/server';
import { publicKey } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const key = await publicKey();
    return NextResponse.json({ key });
  } catch (e) {
    console.error('[mzazi] push key unavailable:', e.message);
    return NextResponse.json({ error: 'Notifications are not available right now' }, { status: 503 });
  }
}
