// MZAZI — temporary numbers, straight from the provider.
//
// No aggregator in the middle: this talks to 5SIM's own REST API, whose contract
// is documented and stable. The previous implementation proxied a third-party
// reseller, which meant our uptime was somebody else's, numbers were shared with
// the whole internet, and the schema could change without warning.
//
// Two halves:
//   * browsing is public — countries, services, live prices and stock
//   * buying needs a provider key, because a number costs money
//
// The key is read from SMS_API_KEY, or from the admin settings row `sms_api_key`,
// so it can be rotated without a redeploy.
import { sql } from '@/lib/wallet';

const API = 'https://5sim.net/v1';
const UA = 'MZAZI-TempNumber/1.0 (+https://www.mzazi.shop)';
const TIMEOUT = 9000;

async function call(path, { method = 'GET', token } = {}) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), TIMEOUT);
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      signal: c.signal,
      headers: {
        accept: 'application/json',
        'user-agent': UA,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

let keyCache = { at: 0, key: '' };

export async function apiKey() {
  if (process.env.SMS_API_KEY) return process.env.SMS_API_KEY.trim();
  if (Date.now() - keyCache.at < 60_000) return keyCache.key;
  let key = '';
  try {
    const [row] = await sql`SELECT value FROM settings WHERE key = 'sms_api_key' LIMIT 1`;
    key = String(row?.value || '').trim();
  } catch {}
  keyCache = { at: Date.now(), key };
  return key;
}

export async function configured() {
  return Boolean(await apiKey());
}

/** Countries the provider serves, with a display name. Cached 5 minutes. */
let countryCache = { at: 0, data: null };

export async function countries() {
  if (countryCache.data && Date.now() - countryCache.at < 5 * 60 * 1000) return countryCache.data;

  // /guest/prices?product=any is not a valid pair — the catalogue endpoint is
  // the list of countries itself.
  const res = await call('/guest/countries');
  if (!res.ok || !res.json) throw Object.assign(new Error('catalog unavailable'), { code: 'UPSTREAM' });

  const out = [];
  for (const [id, meta] of Object.entries(res.json)) {
    const available = Object.values(meta || {}).some(
      (v) => v && typeof v === 'object' && (Number(v.activation) > 0 || Number(v.count) > 0)
    );
    if (available) out.push({ country: id, label: meta?.text_en || id });
  }
  out.sort((a, b) => a.label.localeCompare(b.label));
  countryCache = { at: Date.now(), data: out };
  return countryCache.data;
}

/** Services available in one country, cheapest first. */
export async function services(country) {
  const safe = String(country || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!safe) throw new Error('country required');

  const res = await call(`/guest/prices?country=${encodeURIComponent(safe)}`);
  if (!res.ok || !res.json) throw Object.assign(new Error('catalog unavailable'), { code: 'UPSTREAM' });

  const list = [];
  for (const [service, operators] of Object.entries(res.json[safe] || {})) {
    let stock = 0;
    let price = Infinity;
    let operator = null;
    for (const [op, item] of Object.entries(operators || {})) {
      const count = Number(item?.count || 0);
      const cost = Number(item?.cost || 0);
      if (count > 0 && cost < price) { price = cost; operator = op; }
      stock += count;
    }
    if (stock > 0) list.push({ service, stock, price: Number.isFinite(price) ? price : null, operator });
  }

  list.sort((a, b) => (a.price ?? 9e9) - (b.price ?? 9e9));
  return list.slice(0, 60);
}

export async function ensureOrders() {
  await sql`
    CREATE TABLE IF NOT EXISTS sms_orders (
      id SERIAL PRIMARY KEY,
      sid VARCHAR(40) UNIQUE NOT NULL,
      provider_id BIGINT NOT NULL,
      user_id INTEGER,
      ip VARCHAR(64),
      country VARCHAR(64),
      service VARCHAR(64),
      phone VARCHAR(40),
      price NUMERIC(10, 4),
      status VARCHAR(24) DEFAULT 'PENDING',
      code TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export async function buy({ country, service, userId, ip }) {
  const key = await apiKey();
  if (!key) throw Object.assign(new Error('provider key not configured'), { code: 'NOKEY' });

  const safeCountry = String(country || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const safeService = String(service || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!safeCountry || !safeService) throw Object.assign(new Error('country and service are required'), { code: 'INPUT' });

  const res = await call(`/user/buy/activation/${safeCountry}/any/${safeService}`, { token: key });
  if (res.status === 401) throw Object.assign(new Error('provider rejected the key'), { code: 'AUTH' });
  if (res.status === 402) throw Object.assign(new Error('provider balance is empty'), { code: 'BALANCE' });
  if (!res.ok || !res.json?.id) {
    throw Object.assign(new Error(res.json?.message || 'no number available for that pair'), { code: 'UPSTREAM' });
  }

  const order = res.json;
  await ensureOrders();
  const sid = cryptoRandom();
  const [row] = await sql`
    INSERT INTO sms_orders (sid, provider_id, user_id, ip, country, service, phone, price, status)
    VALUES (${sid}, ${order.id}, ${userId ?? null}, ${ip ?? null}, ${safeCountry}, ${safeService},
            ${String(order.phone || '')}, ${Number(order.price || 0)}, ${String(order.status || 'PENDING')})
    RETURNING sid, phone, price, status, country, service
  `;
  return row;
}

const cryptoRandom = () => {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
};

export async function findBySid(sid) {
  await ensureOrders();
  const [row] = await sql`SELECT * FROM sms_orders WHERE sid = ${sid} LIMIT 1`;
  return row || null;
}

/** Ask the provider for the current state, and cache the code when it lands. */
export async function refresh(order) {
  const key = await apiKey();
  if (!key) return order;

  const res = await call(`/user/check/${order.provider_id}`, { token: key });
  if (!res.ok || !res.json) return order;

  const data = res.json;
  const sms = (data.sms || []).map((s) => s.code).filter(Boolean);
  const code = sms.length ? sms.join(', ') : order.code;
  const status = String(data.status || order.status).toUpperCase();

  if (code !== order.code || status !== order.status) {
    await sql`
      UPDATE sms_orders SET status = ${status}, code = ${code}, updated_at = CURRENT_TIMESTAMP
      WHERE sid = ${order.sid}
    `;
  }
  return { ...order, status, code };
}

export async function cancel(order) {
  const key = await apiKey();
  if (!key) return { status: order.status };
  await call(`/user/cancel/${order.provider_id}`, { token: key });
  await sql`UPDATE sms_orders SET status = 'CANCELED', updated_at = CURRENT_TIMESTAMP WHERE sid = ${order.sid}`;
  return { status: 'CANCELED' };
}
