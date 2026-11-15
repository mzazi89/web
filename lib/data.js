// MZAZI — data bundles.
//
// Two halves. The shop half is ours and fully known: catalogue, wallet debit,
// order row, refund when fulfilment fails. The fulfilment half is Safaricom's
// dynamic-offers gateway, whose request shape is not published in a form that
// can be hard-coded here — so it is configuration, not code:
//
//   offers_path      path suffix after /v1/dynamic-offers/
//   offers_method    POST (default) or PUT
//   offers_body      JSON template: {{phone}} {{amount}} {{plan}} {{reference}}
//   offers_ok        optional substring that marks success in the reply
//
// The day the contract is pinned down is a settings change, not a deploy. Until
// then the shop refuses honestly rather than charging somebody for nothing.
import { sql } from '@/lib/wallet';
import { mpesaConfig, accessToken } from '@/lib/mpesa';

let ready = null;

export function ensureDataSchema() {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS data_plans (
          id SERIAL PRIMARY KEY,
          network VARCHAR(24) NOT NULL DEFAULT 'safaricom',
          name VARCHAR(80) NOT NULL,
          size_mb INTEGER NOT NULL,
          validity_days INTEGER NOT NULL DEFAULT 1,
          price NUMERIC(10,2) NOT NULL,
          cost NUMERIC(10,2),
          active BOOLEAN NOT NULL DEFAULT true,
          sort_order INTEGER NOT NULL DEFAULT 100,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS data_orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          plan_id INTEGER,
          phone VARCHAR(15) NOT NULL,
          amount NUMERIC(10,2) NOT NULL,
          status VARCHAR(16) NOT NULL DEFAULT 'pending',
          reference VARCHAR(40) NOT NULL,
          provider_ref VARCHAR(80),
          response TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_data_orders_user ON data_orders(user_id, created_at DESC)`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_data_orders_ref ON data_orders(reference)`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

// ── catalogue ────────────────────────────────────────────────────────────────
export async function listPlans({ includeInactive = false } = {}) {
  await ensureDataSchema();
  return sql`
    SELECT id, network, name, size_mb, validity_days, price::float AS price,
           cost::float AS cost, active, sort_order
    FROM data_plans
    WHERE ${includeInactive ? sql`true` : sql`active = true`}
    ORDER BY sort_order, price
  `;
}

// Fulfilment configuration, in one place so the route and the admin test panel
// cannot disagree about what is set.
export async function offersConfig() {
  await ensureDataSchema();
  let rows = [];
  try {
    rows = await sql`SELECT key, value FROM settings WHERE key LIKE 'offers%'`;
  } catch {
    rows = [];
  }
  const map = Object.fromEntries(rows.map((r) => [r.key, String(r.value ?? '')]));
  return {
    path: (map.offers_path || '').trim(),
    base: (map.offers_base || '').trim(),
    method: (map.offers_method || 'POST').trim().toUpperCase(),
    body: (map.offers_body || '').trim(),
    ok: (map.offers_ok || '').trim(),
  };
}

const fill = (tpl, vars) =>
  tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] === undefined ? '' : String(vars[k])));

// One attempt at fulfilment. Never throws: a gateway that is down must become a
// refundable order, not a 500 the customer has to interpret.
export async function fulfil({ phone, amount, planId, reference }) {
  const cfg = await offersConfig();
  if (!cfg.path) {
    return { ok: false, configured: false, error: 'Data bundles are not switched on yet.' };
  }
  const conf = await mpesaConfig();
  let token;
  try {
    token = await accessToken();
  } catch (e) {
    return { ok: false, configured: true, error: 'Safaricom rejected our credentials — try again shortly.' };
  }

  const vars = { phone, amount, plan: planId, reference };
  const hasBody = cfg.body.length > 0;
  const init = {
    method: cfg.method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
  if (hasBody && cfg.method !== 'GET') init.body = fill(cfg.body, vars);

  // The offers API can live on a different host from M-PESA itself (sandbox vs
  // production). An explicit base wins; otherwise follow the M-PESA environment.
  const base = (cfg.base || conf.base).replace(/\/+$/, '');
  const url = `${base}/v1/dynamic-offers/${cfg.path.replace(/^\/+/, '')}`;
  try {
    const res = await fetch(url, { ...init, cache: 'no-store' });
    const text = await res.text();
    const ok = res.ok && (!cfg.ok || text.includes(cfg.ok));
    return { ok, configured: true, status: res.status, raw: text.slice(0, 900), error: ok ? '' : safeError(text, res.status) };
  } catch (e) {
    return { ok: false, configured: true, error: 'Could not reach Safaricom — nothing was charged.' };
  }
}

// Turn a gateway error body into one line a customer can act on, without
// echoing whatever internal reference Safaricom chose to include.
function safeError(text, status) {
  try {
    const j = JSON.parse(text);
    const msg = j?.header?.customerMessage || j?.header?.responseMessage || j?.message || j?.error_description;
    if (msg) return String(msg).slice(0, 160);
  } catch {
    /* not JSON — fall through */
  }
  if (status === 401 || status === 403) return 'Safaricom refused the request (authorisation).';
  if (status === 404) return 'That offer is not available on Safaricom right now.';
  return `Safaricom could not fulfil this (${status}).`;
}

// ── ordering ─────────────────────────────────────────────────────────────────
const ref = () => `D${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

// Buy one bundle. The order is written and the wallet debited before Safaricom
// is called, and refunded in full if the call fails — a customer should never be
// left short because a gateway timed out.
export async function placeOrder(userId, { planId, phone }) {
  await ensureDataSchema();
  const { normalizeMpesaPhone } = await import('@/lib/mpesa');
  const msisdn = normalizeMpesaPhone(phone);
  if (!msisdn) return { error: 'Enter the M-PESA number that should receive the bundle.', status: 400 };

  const rows = await sql`SELECT id, name, price::float AS price FROM data_plans WHERE id = ${planId} AND active = true LIMIT 1`;
  const plan = rows[0];
  if (!plan) return { error: 'That bundle is no longer available.', status: 404 };

  const wallet = await sql`SELECT balance::float AS balance FROM wallet WHERE user_id = ${userId}`;
  const balance = Number(wallet[0]?.balance || 0);
  if (balance < plan.price) {
    return {
      error: `Your wallet holds KES ${balance.toFixed(2)}; this bundle costs KES ${plan.price.toFixed(2)}.`,
      status: 402,
      shortfall: +(plan.price - balance).toFixed(2),
    };
  }

  const reference = ref();
  const inserted = await sql`
    INSERT INTO data_orders (user_id, plan_id, phone, amount, status, reference)
    VALUES (${userId}, ${plan.id}, ${msisdn}, ${plan.price}, 'pending', ${reference})
    RETURNING id
  `;
  const orderId = inserted[0].id;

  await sql`UPDATE wallet SET balance = balance - ${plan.price}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}`;
  await sql`
    INSERT INTO wallet_transactions (user_id, type, amount, description, status, reference, payment_method, paid_at)
    VALUES (${userId}, 'debit', ${plan.price}, ${`Data: ${plan.name}`}, 'success', ${reference}, 'wallet', CURRENT_TIMESTAMP)
  `;

  const result = await fulfil({ phone: msisdn, amount: plan.price, planId: plan.id, reference });

  if (result.ok) {
    await sql`
      UPDATE data_orders SET status = 'fulfilled', response = ${result.raw || ''}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${orderId}
    `;
    void import('@/lib/push')
      .then(({ notify }) => notify(userId, {
        title: 'Data on the way',
        body: `${plan.name} is being sent to ${msisdn}.`,
        url: '/data',
        tag: `data-${orderId}`,
        actions: [{ action: 'data', title: 'Buy more', url: '/data' }, { action: 'wallet', title: 'Wallet', url: '/dashboard/wallet' }],
      }))
      .catch(() => {});
    return { ok: true, orderId, reference, plan: plan.name };
  }

  // Refund, and say why. The wallet row is written with its own reference so it
  // is never mistaken for a deposit.
  await sql`UPDATE wallet SET balance = balance + ${plan.price}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}`;
  await sql`
    INSERT INTO wallet_transactions (user_id, type, amount, description, status, reference, payment_method, paid_at)
    VALUES (${userId}, 'credit', ${plan.price}, ${`Refund: ${plan.name} could not be sent`}, 'success', ${`${reference}-R`}, 'wallet', CURRENT_TIMESTAMP)
  `;
  await sql`
    UPDATE data_orders SET status = 'failed', response = ${String(result.error || '') + (result.raw ? ` | ${result.raw}` : '')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${orderId}
  `;

  return { error: result.error || 'Safaricom could not complete this order — your wallet has been refunded.', status: result.configured === false ? 503 : 502, refunded: true };
}
