// MZAZI API — GET /api/cron/notifications  (Vercel Cron, daily 06:00 UTC)
//
// The background half of the notification system. Everything else is triggered
// by something a customer did; this job is what reaches a phone when nobody is
// using the site at all — plans about to lapse, panels about to expire, a new
// announcement.
//
// Two properties matter more than speed here:
//   * idempotence — `push_log` records every (user, kind, key) sent, so a retry,
//     a double invocation or a spoofed request cannot send yesterday's warning
//     twice. Vercel retries a failed cron.
//   * safety — the endpoint only accepts Vercel's own cron headers or the
//     configured CRON_SECRET. Without that, anyone could make every customer's
//     phone buzz.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { notify } from '@/lib/push';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (secret && bearer === secret) return true;
  // Vercel's scheduler identifies itself; a human pasting the URL does not.
  if (request.headers.get('x-vercel-cron')) return true;
  if (/vercel-cron/i.test(request.headers.get('user-agent') || '')) return true;
  return false;
}

async function ensureLog() {
  await sql`
    CREATE TABLE IF NOT EXISTS push_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      kind VARCHAR(40) NOT NULL,
      dedupe_key VARCHAR(120) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, kind, dedupe_key)
    )
  `;
}

/** True when this exact notification has not been sent to this user before. */
async function claim(userId, kind, key) {
  const rows = await sql`
    INSERT INTO push_log (user_id, kind, dedupe_key)
    VALUES (${userId}, ${kind}, ${key})
    ON CONFLICT (user_id, kind, dedupe_key) DO NOTHING
    RETURNING id
  `;
  return rows.length > 0;
}

const days = (d) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000));

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureLog();

  const stats = { plan: 0, panel: 0, announcement: 0, failed: 0 };

  // 1) Bot plans ending within three days.
  try {
    const rows = await sql`
      SELECT "telegramId" AS user_id, "endDate" AS end_date, plan
      FROM "Subscription"
      WHERE "endDate" IS NOT NULL
        AND "endDate" > NOW()
        AND "endDate" <= NOW() + INTERVAL '3 days'
      LIMIT 500
    `;
    for (const r of rows) {
      const left = days(r.end_date);
      if (!(await claim(r.user_id, 'plan_expiry', String(new Date(r.end_date).toISOString().slice(0, 10))))) continue;
      const res = await notify(r.user_id, {
        title: left <= 1 ? 'Your bot plan ends today' : `Bot plan ends in ${left} days`,
        body: `Renew to keep your WhatsApp sessions connected.`,
        url: '/dashboard/services',
        tag: `plan-${r.user_id}-${String(new Date(r.end_date).toISOString().slice(0, 10))}`,
        actions: [
          { action: 'renew', title: 'Renew plan', url: '/dashboard/services' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      });
      if (res.sent) stats.plan += 1; else stats.failed += 1;
    }
  } catch (e) {
    console.error('[cron] plan expiry:', e.message);
  }

  // 2) Panels expiring within three days.
  try {
    const rows = await sql`
      SELECT user_id, id, package_name, expires_at
      FROM panels
      WHERE expires_at IS NOT NULL
        AND expires_at > NOW()
        AND expires_at <= NOW() + INTERVAL '3 days'
      LIMIT 500
    `;
    for (const r of rows) {
      if (!(await claim(r.user_id, 'panel_expiry', String(r.id)))) continue;
      const left = days(r.expires_at);
      const res = await notify(r.user_id, {
        title: left <= 1 ? 'Panel expires today' : `Panel expires in ${left} days`,
        body: `${r.package_name || 'Your panel'} will be suspended unless it is renewed.`,
        url: '/dashboard/services',
        tag: `panel-${r.id}`,
        actions: [
          { action: 'renew', title: 'Renew', url: '/dashboard/services' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      });
      if (res.sent) stats.panel += 1; else stats.failed += 1;
    }
  } catch (e) {
    console.error('[cron] panel expiry:', e.message);
  }

  // 3) New announcements, to everyone with a device subscribed.
  try {
    const fresh = await sql`
      SELECT id, title, body FROM announcements
      WHERE active = true AND created_at > NOW() - INTERVAL '2 days'
      ORDER BY created_at DESC LIMIT 3
    `;
    if (fresh.length > 0) {
      const users = await sql`SELECT DISTINCT user_id FROM push_subscriptions LIMIT 5000`;
      for (const a of fresh) {
        for (const u of users) {
          if (!(await claim(u.user_id, 'announcement', String(a.id)))) continue;
          const res = await notify(u.user_id, {
            title: a.title || 'MZAZI TECH',
            body: a.body || 'Announcement from MZAZI TECH',
            url: '/dashboard/notifications',
            tag: `ann-${a.id}`,
            actions: [
              { action: 'read', title: 'Read', url: '/dashboard/notifications' },
              { action: 'dismiss', title: 'Dismiss' },
            ],
          });
          if (res.sent) stats.announcement += 1; else stats.failed += 1;
        }
      }
    }
  } catch (e) {
    console.error('[cron] announcements:', e.message);
  }

  return NextResponse.json({ ok: true, ...stats, ran_at: new Date().toISOString() });
}
