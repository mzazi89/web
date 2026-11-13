// MZAZI API — POST /api/notifications/test
//
// Sends the signed-in customer one real notification, so "enable notifications"
// can be proved rather than assumed. It goes through the same sendPush() as a
// payment alert — same icon, same two buttons — and reports how many devices it
// reached, so a silent phone is diagnosable instead of mysterious.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/web-auth';
import { sendPush, subscriptionCount } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await requireUser();
    const devices = await subscriptionCount(user.id);
    if (devices === 0) {
      return NextResponse.json(
        { error: 'This device is not subscribed yet. Turn notifications on first.' },
        { status: 409 }
      );
    }

    const result = await sendPush(user.id, {
      title: 'MZAZI TECH',
      body: `Notifications are on. Payments, plan expiry and receipts will arrive like this.`,
      url: '/dashboard/notifications',
      tag: 'mzazi-test',
      actions: [
        { action: 'open', title: 'View wallet', url: '/dashboard/wallet' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });

    if (result.sent === 0) {
      return NextResponse.json(
        { error: 'The push service rejected it — turn notifications off and on again.', devices, ...result },
        { status: 502 }
      );
    }
    return NextResponse.json({ message: `Sent to ${result.sent} device${result.sent === 1 ? '' : 's'}`, devices, ...result });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[mzazi] push test failed:', e.message);
    return NextResponse.json({ error: 'Could not send the test' }, { status: 500 });
  }
}
