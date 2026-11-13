// MZAZI — web push.
//
// Phone-style notifications with action buttons, the way a bank app does it:
// icon, title, one line of body, and two taps that do something ("Add money",
// "View receipt"). On Android that is a persistent service-worker notification
// with `actions`; on iOS it works from an installed PWA (16.4+).
//
// VAPID keys are generated once and kept in the `settings` table rather than in
// environment variables, so this feature works on a deployment nobody has
// configured yet. The private key never leaves the server; the public key is
// served by /api/notifications/push-key because the browser needs it to subscribe.
//
// Sending never throws: a notification failing must not fail the payment or
// purchase that triggered it. Dead subscriptions (404/410) are deleted on the
// spot, which is how the list stays clean without a cron job.
import { neon } from '@neondatabase/serverless';

// web-push is CommonJS and is kept out of the bundle (next.config.js). A static
// default import compiled to something without the functions on it, so the
// module is resolved at call time and both interop shapes are accepted.
let webpushLib = null;
async function webpush() {
  if (!webpushLib) {
    const mod = await import('web-push');
    webpushLib = mod?.generateVAPIDKeys ? mod : mod?.default || mod;
  }
  if (typeof webpushLib?.generateVAPIDKeys !== 'function') {
    throw new Error('web-push module unavailable');
  }
  return webpushLib;
}

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:mzazitechinc@gmail.com';

let ready = null;
let vapid = null;

async function ensure() {
  if (!ready) {
    ready = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS settings (key VARCHAR(100) PRIMARY KEY, value TEXT)`;
      await sql`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen_at TIMESTAMP
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id)`;
    })().catch((e) => { ready = null; throw e; });
  }
  await ready;
}

/** Loads (or lazily creates) the VAPID key pair and configures web-push. */
export async function configure() {
  if (vapid) return vapid;
  await ensure();

  const rows = await sql`
    SELECT key, value FROM settings WHERE key = ANY(ARRAY['vapidPublicKey', 'vapidPrivateKey'])
  `;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  let { vapidPublicKey: pub, vapidPrivateKey: priv } = map;
  if (!pub || !priv) {
    const keys = (await webpush()).generateVAPIDKeys();
    pub = keys.publicKey;
    priv = keys.privateKey;
    await sql`
      INSERT INTO settings (key, value) VALUES ('vapidPublicKey', ${pub}), ('vapidPrivateKey', ${priv})
      ON CONFLICT (key) DO NOTHING
    `;
    // Re-read: two cold starts can race here, and the loser must use the winner's key.
    const again = await sql`
      SELECT key, value FROM settings WHERE key = ANY(ARRAY['vapidPublicKey', 'vapidPrivateKey'])
    `;
    const m2 = Object.fromEntries(again.map((r) => [r.key, r.value]));
    pub = m2.vapidPublicKey || pub;
    priv = m2.vapidPrivateKey || priv;
  }

  (await webpush()).setVapidDetails(SUBJECT, pub, priv);
  vapid = { publicKey: pub };
  return vapid;
}

export async function publicKey() {
  const { publicKey: key } = await configure();
  return key;
}

export async function saveSubscription(userId, subscription, userAgent) {
  await ensure();
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) throw new Error('INVALID_SUBSCRIPTION');

  await sql`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, last_seen_at)
    VALUES (${userId}, ${endpoint}, ${p256dh}, ${auth}, ${String(userAgent || '').slice(0, 200)}, NOW())
    ON CONFLICT (endpoint) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      user_agent = EXCLUDED.user_agent,
      last_seen_at = NOW()
  `;
}

export async function removeSubscription(userId, endpoint) {
  await ensure();
  if (endpoint) {
    await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint} AND user_id = ${userId}`;
  } else {
    await sql`DELETE FROM push_subscriptions WHERE user_id = ${userId}`;
  }
}

export async function subscriptionCount(userId) {
  try {
    await ensure();
    const rows = await sql`SELECT COUNT(*)::int AS n FROM push_subscriptions WHERE user_id = ${userId}`;
    return rows[0]?.n || 0;
  } catch {
    return 0;
  }
}

/**
 * Push one notification to every device the user has enabled.
 * Returns { sent, failed } — never throws.
 */
export async function sendPush(userId, { title, body, url = '/dashboard', tag = null, actions = null } = {}) {
  try {
    if (!userId || !title) return { sent: 0, failed: 0 };
    await configure();

    const subs = await sql`
      SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${userId}
    `;
    if (subs.length === 0) return { sent: 0, failed: 0, reason: 'no_subscriptions' };

    const payload = JSON.stringify({
      title,
      body: String(body || '').slice(0, 180),
      url,
      tag: tag || `mzazi-${Date.now()}`,
      // Two taps, like the notification in a banking app. `url` may be omitted,
      // which makes the button close the notification instead of navigating.
      actions: actions || [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });

    const wp = await webpush();
    let sent = 0;
    let failed = 0;
    for (const s of subs) {
      try {
        await wp.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 60 * 60 * 24 }
        );
        sent += 1;
      } catch (e) {
        failed += 1;
        // 404/410: the browser dropped this subscription. Keep the table honest.
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await sql`DELETE FROM push_subscriptions WHERE id = ${s.id}`.catch(() => {});
        }
      }
    }
    return { sent, failed };
  } catch (e) {
    console.error('[mzazi] push failed:', e.message);
    return { sent: 0, failed: 0, reason: 'error', error: e.message };
  }
}
