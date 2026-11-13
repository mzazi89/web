// MZAZI API — /api/notifications/subscribe
//
//   POST   { subscription } → remember this device so pushes can reach it
//   DELETE { endpoint }     → forget it (or all of the user's devices)
//
// The subscription object is what `pushManager.subscribe()` returns. Its endpoint
// is unique per browser install; re-subscribing the same device updates the row
// instead of piling up duplicates, and can move it to another account if the
// person signs in as somebody else on a shared phone.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/web-auth';
import { saveSubscription, removeSubscription, subscriptionCount } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    await saveSubscription(user.id, body.subscription, request.headers.get('user-agent'));
    const devices = await subscriptionCount(user.id);
    return NextResponse.json({ message: 'Notifications enabled on this device', devices });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (e.message === 'INVALID_SUBSCRIPTION') {
      return NextResponse.json({ error: 'That subscription is incomplete' }, { status: 400 });
    }
    console.error('[mzazi] push subscribe failed:', e.message);
    return NextResponse.json({ error: 'Could not enable notifications' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    await removeSubscription(user.id, body.endpoint || null);
    return NextResponse.json({ message: 'Notifications turned off' });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[mzazi] push unsubscribe failed:', e.message);
    return NextResponse.json({ error: 'Could not turn notifications off' }, { status: 500 });
  }
}
