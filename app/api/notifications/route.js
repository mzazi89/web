// MZAZI API — GET /api/notifications
//
// The feed the mobile app polls: announcements from the admin portal plus the
// account's own events (settled payments, expiring services, provisioning).
// Scoped to the session user, so a notification can only describe your rows.
import { NextResponse } from 'next/server';
import { getViewer } from '@/lib/dashboard/session';
import { getNotifications } from '@/lib/dashboard/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const items = await getNotifications(viewer.id);
  return NextResponse.json(
    {
      items: items.map((n) => ({
        key: n.id,
        title: n.title,
        body: n.body,
        tone: n.tone,
        href: n.href,
        createdAt: n.date,
      })),
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
