// MZAZI — disposable inboxes.
//
// Built on mail.tm, which gives a real receiving mailbox over a plain HTTPS API:
// no SMTP server of ours, no MX records, and nothing to deliver from our side.
//
// The customer never sees the upstream account or its password. Each visitor
// gets one row in `temp_mailboxes`, a random session id in an httpOnly cookie,
// and a hard expiry — an address that lives forever is a spam magnet and a
// privacy problem at once.
import crypto from 'node:crypto';
import { sql } from '@/lib/wallet';

const API = 'https://api.mail.tm';
const LIFETIME_MIN = 60;
const MAX_ACTIVE_PER_IP = 3;

let domainCache = { at: 0, list: [] };

async function call(path, { method = 'GET', token, body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    return { ok: res.ok, status: res.status, json, text };
  } finally {
    clearTimeout(timer);
  }
}

export async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS temp_mailboxes (
      id SERIAL PRIMARY KEY,
      sid VARCHAR(40) UNIQUE NOT NULL,
      address VARCHAR(120) NOT NULL,
      password VARCHAR(80) NOT NULL,
      token TEXT,
      token_at TIMESTAMP,
      ip VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_tm_sid ON temp_mailboxes(sid)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tm_exp ON temp_mailboxes(expires_at)`;
}

async function domains() {
  if (domainCache.list.length && Date.now() - domainCache.at < 10 * 60 * 1000) return domainCache.list;
  const { ok, status, json } = await call('/domains?page=1');
  if (!ok) {
    throw Object.assign(new Error(`mail service refused domains (${status})`), { code: 'DOMAINS' });
  }
  const list = (json?.['hydra:member'] || []).filter((d) => d.isActive && !d.isPrivate).map((d) => d.domain);
  if (!list.length) throw new Error('No mailbox domain available right now');
  domainCache = { at: Date.now(), list };
  return list;
}

const randomLocal = () => `mz${crypto.randomBytes(4).toString('hex')}`;
const randomPass = () => crypto.randomBytes(16).toString('base64url');

/** Re-auth when the token is missing, old, or the API says it is invalid. */
async function tokenFor(box, force = false) {
  const fresh = box.token && box.token_at && Date.now() - new Date(box.token_at).getTime() < 25 * 60 * 1000;
  if (fresh && !force) return box.token;

  const { ok, json } = await call('/token', { method: 'POST', body: { address: box.address, password: box.password } });
  if (!ok || !json?.token) throw new Error('Mailbox sign-in failed');
  await sql`UPDATE temp_mailboxes SET token = ${json.token}, token_at = CURRENT_TIMESTAMP WHERE id = ${box.id}`;
  return json.token;
}

export async function activeCount(ip) {
  await ensureSchema();
  const [row] = await sql`
    SELECT COUNT(*)::int AS n FROM temp_mailboxes
    WHERE ip = ${ip} AND expires_at > CURRENT_TIMESTAMP
  `;
  return row?.n || 0;
}

export async function createMailbox(ip) {
  await ensureSchema();
  if ((await activeCount(ip)) >= MAX_ACTIVE_PER_IP) {
    throw Object.assign(new Error('Too many open inboxes from this connection'), { code: 'LIMIT' });
  }

  const [domain] = await domains();
  let address = '';
  let created = null;

  // Two attempts: a random local part can collide, and a taken address answers 422.
  for (let attempt = 0; attempt < 2 && !created; attempt += 1) {
    address = `${randomLocal()}@${domain}`;
    const password = randomPass();
    const res = await call('/accounts', { method: 'POST', body: { address, password } });
    if (res.ok) {
      created = { address, password };
    } else if (res.status !== 422) {
      throw Object.assign(new Error(`upstream refused the account (${res.status})`), { code: 'ACCOUNT' });
    }
  }
  if (!created) throw Object.assign(new Error('address collision twice'), { code: 'ACCOUNT' });

  const sid = crypto.randomBytes(18).toString('base64url');
  const [row] = await sql`
    INSERT INTO temp_mailboxes (sid, address, password, ip, expires_at)
    VALUES (${sid}, ${created.address}, ${created.password}, ${ip},
            CURRENT_TIMESTAMP + (${LIFETIME_MIN} * INTERVAL '1 minute'))
    RETURNING id, sid, address, expires_at
  `;
  return row;
}

export async function findBySid(sid) {
  if (!sid) return null;
  await ensureSchema();
  const [row] = await sql`
    SELECT * FROM temp_mailboxes
    WHERE sid = ${sid} AND expires_at > CURRENT_TIMESTAMP
    LIMIT 1
  `;
  return row || null;
}

export async function listMessages(box) {
  const token = await tokenFor(box);
  let res = await call('/messages?page=1', { token });
  if (res.status === 401) res = await call('/messages?page=1', { token: await tokenFor(box, true) });
  if (!res.ok) throw new Error('Could not read the inbox');

  return (res.json?.['hydra:member'] || []).map((m) => ({
    id: m.id,
    from: m.from?.address || '',
    fromName: m.from?.name || '',
    subject: m.subject || '(no subject)',
    intro: m.intro || '',
    seen: Boolean(m.seen),
    at: m.createdAt,
  }));
}

export async function readMessage(box, messageId) {
  const token = await tokenFor(box);
  let res = await call(`/messages/${encodeURIComponent(messageId)}`, { token });
  if (res.status === 401) res = await call(`/messages/${encodeURIComponent(messageId)}`, { token: await tokenFor(box, true) });
  if (!res.ok || !res.json) throw new Error('That message is no longer available');

  const m = res.json;
  // Mark as read upstream so the unread count means something on refresh.
  call(`/messages/${encodeURIComponent(messageId)}`, { method: 'PATCH', token, body: { seen: true } }).catch(() => {});

  return {
    id: m.id,
    from: m.from?.address || '',
    fromName: m.from?.name || '',
    to: (m.to || []).map((t) => t.address).join(', '),
    subject: m.subject || '(no subject)',
    at: m.createdAt,
    // Only the plain-text body is ever shown. Email HTML is a script delivery
    // mechanism, and this page runs on our own origin.
    text: Array.isArray(m.text) ? m.text.join('\n') : String(m.text || ''),
    html: undefined,
  };
}

export async function destroyMailbox(box) {
  // Release the upstream account first: if this fails, the row still goes, and
  // the upstream copy expires on its own terms.
  try {
    const token = await tokenFor(box);
    const me = await call('/me', { token });
    if (me.ok && me.json?.id) await call(`/accounts/${me.json.id}`, { method: 'DELETE', token });
  } catch {}
  await sql`DELETE FROM temp_mailboxes WHERE id = ${box.id}`;
}

/** Housekeeping: drop rows that expired, and release their upstream accounts. */
export async function purgeExpired() {
  await ensureSchema();
  const rows = await sql`SELECT * FROM temp_mailboxes WHERE expires_at <= CURRENT_TIMESTAMP LIMIT 20`;
  for (const box of rows) {
    try { await destroyMailbox(box); } catch {}
  }
}
