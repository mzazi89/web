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
    const m = String(e && e.message || '');
    // Classified rather than echoed: the useful part for support is which stage
    // failed, and a raw driver message can carry the database host or user.
    const code = /is not a function|undefined|Cannot read/.test(m) ? 'webpush_import'
      : /relation .* does not exist|column .* does not exist/.test(m) ? 'schema'
      : /fetch failed|ENOTFOUND|ECONNREFUSED|timeout/i.test(m) ? 'database'
      : /VAPID|vapid|key/i.test(m) ? 'vapid'
      : 'unknown';
    console.error('[mzazi] push key unavailable:', code, m.slice(0, 300));
    return NextResponse.json({ error: 'Notifications are not available right now', code }, { status: 503 });
  }
}
