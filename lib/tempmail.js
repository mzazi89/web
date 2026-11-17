// MZAZI — disposable inboxes.
//
// Provider: Guerrilla Mail. mail.tm was the first choice and it is better — real
// MX, several domains — but its edge answers 403 to this deployment's egress,
// which is why the page reported "refusing new mailboxes" instead of working.
// Guerrilla answers 200 from the same host, so it is the provider that actually
// delivers.
//
// The trade-off is honest and worth knowing: Guerrilla issues addresses on
// guerrillamailblock.com only, and a number of signup forms blacklist it. The
// tool works; some sites will refuse the address.
//
// What lives in Postgres is only the session token and the address, so the
// browser never holds provider credentials and we can expire a mailbox on our
// own schedule.
import crypto from 'node:crypto';
import { sql } from '@/lib/wallet';

const API = 'https://api.guerrillamail.com/ajax.php';
const LIFETIME_MIN = 60;
const MAX_ACTIVE_PER_IP = 3;

async function call(params) {
  const url = `${API}?${new URLSearchParams({ lang: 'en', ...params })}`;
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: c.signal,
      headers: { accept: 'application/json', 'user-agent': 'MZAZI-TempMail/1.0 (+https://www.mzazi.shop)' },
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    if (!res.ok || !json) throw new Error(`provider ${res.status}`);
    return json;
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
      password VARCHAR(80) DEFAULT '',
      provider VARCHAR(24) DEFAULT 'guerrilla',
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

  let issued;
  try {
    issued = await call({ f: 'get_email_address' });
  } catch (e) {
    throw Object.assign(new Error(`provider unreachable (${e.message})`), { code: 'DOMAINS' });
  }
  if (!issued?.email_addr || !issued?.sid_token) {
    throw Object.assign(new Error('provider returned no address'), { code: 'ACCOUNT' });
  }

  const sid = crypto.randomBytes(18).toString('base64url');
  const [row] = await sql`
    INSERT INTO temp_mailboxes (sid, address, token, token_at, ip, expires_at)
    VALUES (${sid}, ${issued.email_addr}, ${issued.sid_token}, CURRENT_TIMESTAMP, ${ip},
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
  const data = await call({ f: 'get_email_list', offset: '0', sid_token: box.token });
  return (data?.list || []).map((m) => ({
    id: String(m.mail_id),
    from: m.mail_from || '',
    fromName: '',
    subject: m.mail_subject || '(no subject)',
    intro: m.mail_excerpt || '',
    seen: String(m.mail_read) === '1',
    at: m.mail_timestamp ? new Date(Number(m.mail_timestamp) * 1000).toISOString() : null,
  }));
}

/** Guerrilla returns an HTML body; this page shows text, so tags come out. */
function toText(html) {
  return String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function readMessage(box, messageId) {
  const m = await call({ f: 'fetch_email', email_id: String(messageId), sid_token: box.token });
  if (!m || !m.mail_subject) throw new Error('That message is no longer available');

  return {
    id: String(m.mail_id || messageId),
    from: m.mail_from || '',
    fromName: '',
    to: box.address,
    subject: m.mail_subject || '(no subject)',
    at: m.mail_timestamp ? new Date(Number(m.mail_timestamp) * 1000).toISOString() : null,
    text: toText(m.mail_body),
  };
}

export async function destroyMailbox(box) {
  try {
    await call({ f: 'forget_me', sid_token: box.token });
  } catch {}
  await sql`DELETE FROM temp_mailboxes WHERE id = ${box.id}`;
}

/** Housekeeping: drop rows that expired, and release their upstream sessions. */
export async function purgeExpired() {
  await ensureSchema();
  const rows = await sql`SELECT * FROM temp_mailboxes WHERE expires_at <= CURRENT_TIMESTAMP LIMIT 20`;
  for (const box of rows) {
    try { await destroyMailbox(box); } catch {}
  }
}
