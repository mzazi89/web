// MZAZI — Daraja configuration and the Dynamic Offers contract.
//
// Dynamic Offers is not in Daraja's public API catalogue (Authorization, STK,
// C2B, B2C, Transaction Status, Balance, Reversal, Tax Remittance, Bill Manager,
// Pull Transactions). It is a subscribed product on the WSO2 gateway, so its
// paths and payloads only exist inside your app's API definition. Until that
// definition is pasted in, every call here fails loudly and changes nothing.
//
// Resolution order for each value: settings table (admin panel) → environment.
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

export const BASES = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
};

let cache = { at: 0, map: {} };

async function settings() {
  if (Date.now() - cache.at < 60_000 && Object.keys(cache.map).length) return cache.map;
  let rows = [];
  try {
    rows = await sql`SELECT key, value FROM settings WHERE key LIKE 'offers%' OR key LIKE 'mpesa%' OR key LIKE 'daraja%'`;
  } catch {
    rows = [];
  }
  const map = Object.fromEntries(rows.map((r) => [r.key, String(r.value ?? '').trim()]));
  cache = { at: Date.now(), map };
  return map;
}

export function bustCache() {
  cache = { at: 0, map: {} };
}

const pick = (s, key, envName) => (s[key] || process.env[envName] || '').trim();

export async function darajaConfig() {
  const s = await settings();
  const env = (pick(s, 'daraja_env', 'DARAJA_ENV') || 'sandbox').toLowerCase();
  return {
    env: env === 'production' ? 'production' : 'sandbox',
    base: BASES[env === 'production' ? 'production' : 'sandbox'],
    consumerKey: pick(s, 'daraja_consumer_key', 'DARAJA_CONSUMER_KEY') || pick(s, 'mpesa_consumer_key', 'MPESA_CONSUMER_KEY'),
    consumerSecret: pick(s, 'daraja_consumer_secret', 'DARAJA_CONSUMER_SECRET') || pick(s, 'mpesa_consumer_secret', 'MPESA_CONSUMER_SECRET'),
    passkey: pick(s, 'mpesa_passkey', 'MPESA_PASSKEY'),
    shortcode: pick(s, 'mpesa_shortcode', 'MPESA_SHORTCODE'),
    timeoutMs: Number(pick(s, 'offers_timeout', 'PROVIDER_TIMEOUT_MS')) || 9000,
  };
}

// The three calls we need, described as data. `body` is a JSON template with
// {{msisdn}} {{offer}} {{reference}} {{amount}} placeholders.
export async function offersContract() {
  const s = await settings();
  return {
    listPath: pick(s, 'offers_list_path', 'OFFERS_LIST_PATH'),
    listBody: pick(s, 'offers_list_body', 'OFFERS_LIST_BODY'),
    buyPath: pick(s, 'offers_buy_path', 'OFFERS_BUY_PATH'),
    buyBody: pick(s, 'offers_buy_body', 'OFFERS_BUY_BODY'),
    statusPath: pick(s, 'offers_status_path', 'OFFERS_STATUS_PATH'),
    statusBody: pick(s, 'offers_status_body', 'OFFERS_STATUS_BODY'),
    method: (pick(s, 'offers_method', 'OFFERS_METHOD') || 'POST').toUpperCase(),
    okMarker: pick(s, 'offers_ok', 'OFFERS_OK'),
  };
}

export function fill(tpl, vars) {
  return String(tpl).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] === undefined ? '' : String(vars[k])));
}

// Map whatever the gateway returned onto our shape. Anything we cannot read is
// reported, never guessed: a bundle with an invented price is worse than none.
export function normaliseOffers(json) {
  const candidates = [
    json?.offers,
    json?.data?.offers,
    json?.body?.offers,
    json?.data,
    json?.body?.data,
    Array.isArray(json) ? json : null,
  ];
  const list = candidates.find((c) => Array.isArray(c));
  if (!list) return { offers: [], shapeKnown: false };

  const offers = [];
  for (const o of list) {
    if (!o || typeof o !== 'object') continue;
    const id = o.offerId ?? o.offer_id ?? o.id ?? o.code ?? o.bundleId ?? null;
    if (!id) continue;
    offers.push({
      id: String(id),
      name: o.name ?? o.offerName ?? o.description ?? o.title ?? `Offer ${id}`,
      sizeMb: numberOrNull(o.sizeMb ?? o.size ?? o.dataVolume ?? o.volume),
      price: numberOrNull(o.price ?? o.amount ?? o.cost ?? o.charge),
      validity: o.validity ?? o.validityDays ?? o.expiry ?? null,
      currency: o.currency ?? 'KES',
      raw: o,
    });
  }
  return { offers, shapeKnown: true };
}

function numberOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}
