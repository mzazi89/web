// MZAZI — Safaricom Daraja, STK push (Lipa na M-PESA online).
//
// The direct rail: the customer enters an amount here, Safaricom asks their
// phone for the PIN, and the money lands on our paybill/till without Paystack in
// the middle. It sits beside Paystack, not instead of it: cards still go through
// Paystack, and its mobile-money charge stays as a fallback when Daraja is down.
//
// Configuration comes from environment variables, never the database:
//
//   MPESA_CONSUMER_KEY      Daraja app key
//   MPESA_CONSUMER_SECRET   Daraja app secret
//   MPESA_PASSKEY           Lipa na M-PESA online passkey
//   MPESA_SHORTCODE         paybill or till number (PartyB)
//   MPESA_ENV               sandbox | production     (default sandbox)
//   MPESA_TYPE              paybill | till           (default paybill)
//   MPESA_CALLBACK_URL      public https URL of /api/mpesa/callback
//   MPESA_CALLBACK_SECRET   optional; appended as ?k= so we can reject noise
//
// Nothing here throws on import: an unconfigured deployment simply reports
// `configured: false` and the deposit page keeps offering Paystack alone.
const SANDBOX = 'https://sandbox.safaricom.co.ke';
const LIVE = 'https://api.safaricom.co.ke';

const env = (k, d = '') => String(process.env[k] || d).trim();

// Daraja keys are editable from the admin panel (Settings → M-PESA) rather than
// only from Vercel's dashboard, so switching between sandbox and production, or
// rotating a passkey, does not need a redeploy. Environment variables still win
// when present, which keeps CI and a locked-down deployment predictable.
const SETTING_KEYS = {
  mpesa_consumer_key: 'key',
  mpesa_consumer_secret: 'secret',
  mpesa_passkey: 'passkey',
  mpesa_shortcode: 'shortcode',
  mpesa_env: 'env',
  mpesa_type: 'type',
  mpesa_callback_url: 'callbackUrl',
  mpesa_callback_secret: 'callbackSecret',
  // Buy Goods (till) only: the head-office / agent number the till sits under.
  // Safaricom pairs the two and rejects the prompt when they are the same
  // ("The Agent number and Store number entered do not match").
  mpesa_party_b: 'partyB',
};

let stored = { at: 0, map: {} };
async function storedConfig() {
  if (Date.now() - stored.at < 60_000) return stored.map;
  try {
    const { sql } = await import('@/lib/wallet');
    const rows = await sql`SELECT key, value FROM settings WHERE key LIKE 'mpesa\_%'`;
    const map = {};
    for (const row of rows) {
      const slot = SETTING_KEYS[row.key];
      if (slot && String(row.value || '').trim()) map[slot] = String(row.value).trim();
    }
    stored = { at: Date.now(), map };
  } catch {
    stored = { at: Date.now(), map: {} }; // settings table missing — fall back to env
  }
  return stored.map;
}

export async function mpesaConfig() {
  const s = await storedConfig();
  const pick = (slot, envKey, d = '') => s[slot] || env(envKey, d);

  const shortcode = pick('shortcode', 'MPESA_SHORTCODE');
  const type = String(pick('type', 'MPESA_TYPE', 'paybill')).toLowerCase() === 'till' ? 'till' : 'paybill';
  const base = String(pick('env', 'MPESA_ENV', 'sandbox')).toLowerCase() === 'production' ? LIVE : SANDBOX;

  return {
    key: pick('key', 'MPESA_CONSUMER_KEY'),
    secret: pick('secret', 'MPESA_CONSUMER_SECRET'),
    passkey: pick('passkey', 'MPESA_PASSKEY'),
    shortcode,
    // For a till, PartyB is the agent/head-office number, not the store number.
    partyB: pick('partyB', 'MPESA_PARTY_B') || shortcode,
    type,
    base,
    // Defaulting the callback removes the most common setup mistake: the URL must
    // be public https and must match the deployment actually serving the route.
    callbackUrl:
      pick('callbackUrl', 'MPESA_CALLBACK_URL') ||
      `${env('NEXT_PUBLIC_SITE_URL', 'https://www.mzazi.shop').replace(/\/$/, '')}/api/mpesa/callback`,
    callbackSecret: pick('callbackSecret', 'MPESA_CALLBACK_SECRET'),
  };
}

export async function isConfigured() {
  const c = await mpesaConfig();
  return Boolean(c.key && c.secret && c.passkey && c.shortcode && c.callbackUrl);
}

// Nairobi time as Daraja expects it: YYYYMMDDHHmmss, not UTC.
function timestamp(date = new Date()) {
  const nairobi = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return (
    nairobi.getUTCFullYear() +
    p(nairobi.getUTCMonth() + 1) +
    p(nairobi.getUTCDate()) +
    p(nairobi.getUTCHours()) +
    p(nairobi.getUTCMinutes()) +
    p(nairobi.getUTCSeconds())
  );
}

function passwordOf(shortcode, passkey, ts) {
  return Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64');
}

// ── OAuth ─────────────────────────────────────────────────────────────────────
// One token per function instance, refreshed a minute early. Daraja invalidates
// tokens hourly and returns 404.001.03 "Invalid Access Token" rather than 401,
// which is why callers retry once on a fresh token instead of trusting a 401.
let cache = { token: '', expires: 0 };

export async function accessToken(force = false) {
  const c = await mpesaConfig();
  if (!force && cache.token && Date.now() < cache.expires) return cache.token;

  const auth = Buffer.from(`${c.key}:${c.secret}`).toString('base64');
  const res = await fetch(`${c.base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  });
  const text = await res.text();
  let json = {};
  try { json = JSON.parse(text); } catch { /* handled below */ }

  if (!res.ok || !json.access_token) {
    const detail = json.errorMessage || json.error_description || text.slice(0, 200);
    throw new Error(`Daraja auth failed (${res.status}): ${detail}`);
  }

  const ttl = Math.max(60, Number(json.expires_in || 3599) - 60) * 1000;
  cache = { token: json.access_token, expires: Date.now() + ttl };
  return cache.token;
}

// ── STK push ──────────────────────────────────────────────────────────────────
// Returns Daraja's raw answer; the caller decides what is fatal. A ResponseCode
// of "0" means the prompt was delivered, not that money moved — the payment is
// only real once the callback (or a successful query) arrives.
export async function stkPush({ phone, amount, accountRef, description = 'Wallet deposit', retry = true }) {
  const c = await mpesaConfig();
  const ts = timestamp();
  const body = {
    BusinessShortCode: c.shortcode,
    Password: passwordOf(c.shortcode, c.passkey, ts),
    Timestamp: ts,
    TransactionType: c.type === 'till' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline',
    Amount: Math.round(Number(amount)),
    PartyA: phone,
    PartyB: c.type === 'till' ? c.partyB : c.shortcode,
    PhoneNumber: phone,
    CallBackURL: c.callbackSecret
      ? `${c.callbackUrl}${c.callbackUrl.includes('?') ? '&' : '?'}k=${encodeURIComponent(c.callbackSecret)}`
      : c.callbackUrl,
    AccountReference: String(accountRef).slice(0, 12),
    TransactionDesc: String(description).slice(0, 60),
  };

  const res = await fetch(`${c.base}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));

  if (retry && json.errorCode === '404.001.03') {
    await accessToken(true);
    return stkPush({ phone, amount, accountRef, description, retry: false });
  }
  return json;
}

// ── Query ─────────────────────────────────────────────────────────────────────
// Used when Safaricom's callback never lands (they are best-effort). ResultCode
// "0" here means the customer paid; anything else is a terminal failure with a
// human-readable ResultDesc we can show.
export async function stkQuery(checkoutRequestId, retry = true) {
  const c = await mpesaConfig();
  const ts = timestamp();
  const body = {
    BusinessShortCode: c.shortcode,
    Password: passwordOf(c.shortcode, c.passkey, ts),
    Timestamp: ts,
    CheckoutRequestID: checkoutRequestId,
  };

  const res = await fetch(`${c.base}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));

  if (retry && json.errorCode === '404.001.03') {
    await accessToken(true);
    return stkQuery(checkoutRequestId, false);
  }
  return json;
}

// ── Phone numbers ─────────────────────────────────────────────────────────────
// Daraja only accepts 2547XXXXXXXX / 2541XXXXXXXX. Kenyans write 07…, 01…,
// +254…, 254… and with spaces — all of it has to land on one shape.
export function normalizeMpesaPhone(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (/^254(7|1)\d{8}$/.test(digits)) return digits;
  if (/^0(7|1)\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^(7|1)\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

// ── B2C: paying money OUT ─────────────────────────────────────────────────────
// The STK rail above takes money in; this one sends a wallet balance back to a
// customer's phone. It is a different Daraja product with different credentials:
//
//   MPESA_B2C_SHORTCODE            the B2C shortcode (often the same paybill)
//   MPESA_B2C_INITIATOR            initiator username from the Daraja portal
//   MPESA_B2C_SECURITY_CREDENTIAL  initiator password, RSA-encrypted, base64 —
//                                  paste this if you already generated it
//   MPESA_B2C_CERT                 or: the Safaricom public certificate (PEM),
//   MPESA_B2C_INITIATOR_PASSWORD   or: together with the plain password, which
//                                  we encrypt here with RSA/ECB/PKCS1Padding
//   MPESA_B2C_COMMAND              BusinessPayment (default) | SalaryPayment |
//                                  PromotionPayment
//
// A withdrawal is only possible when this is complete; until then the route
// answers 503 and the UI hides the action, rather than accepting money it cannot
// send.
import crypto from 'crypto';

const b2cSettings = (map) => ({
  b2cShortcode: map.b2cShortcode || env('MPESA_B2C_SHORTCODE'),
  initiator: map.b2cInitiator || env('MPESA_B2C_INITIATOR'),
  credential: map.b2cCredential || env('MPESA_B2C_SECURITY_CREDENTIAL'),
  cert: map.b2cCert || env('MPESA_B2C_CERT'),
  initiatorPassword: map.b2cPassword || env('MPESA_B2C_INITIATOR_PASSWORD'),
  commandID: map.b2cCommand || env('MPESA_B2C_COMMAND', 'BusinessPayment'),
});

export async function b2cConfig() {
  const [c, map] = await Promise.all([mpesaConfig(), storedConfig()]);
  const b = b2cSettings(map);
  const site = env('NEXT_PUBLIC_SITE_URL', 'https://www.mzazi.shop').replace(/\/$/, '');
  const suffix = c.callbackSecret ? `?k=${encodeURIComponent(c.callbackSecret)}` : '';

  return {
    ...c,
    shortcode: b.b2cShortcode || c.shortcode,
    initiator: b.initiator,
    credential: b.credential,
    cert: b.cert,
    initiatorPassword: b.initiatorPassword,
    commandID: b.commandID || 'BusinessPayment',
    resultUrl: `${site}/api/mpesa/b2c/result${suffix}`,
    timeoutUrl: `${site}/api/mpesa/b2c/timeout${suffix}`,
  };
}

/** True when a payout could actually be attempted. */
export async function b2cReady() {
  const c = await b2cConfig();
  const hasCredential = Boolean(c.credential || (c.cert && c.initiatorPassword));
  return Boolean(c.key && c.secret && c.shortcode && c.initiator && hasCredential && c.resultUrl);
}

/**
 * Daraja wants the initiator password encrypted with its public certificate,
 * RSA/ECB/PKCS1Padding, base64. Accepted either pre-encrypted or as a PEM +
 * plain password, so an operator who already has the blob can just paste it.
 */
function securityCredential(c) {
  if (c.credential) return c.credential;
  if (!c.cert || !c.initiatorPassword) return '';

  const body = String(c.cert).replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const pem = `-----BEGIN CERTIFICATE-----\n${body.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----`;

  return crypto
    .publicEncrypt({ key: pem, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(c.initiatorPassword))
    .toString('base64');
}

/**
 * Ask Safaricom to pay `phone`.
 *
 * Returns Daraja's raw answer. ResponseCode "0" means the request was accepted
 * for processing — not that money moved. The only proof of payment is the result
 * callback, which is why the caller keeps the row pending until it arrives.
 */
export async function b2cPayment({ phone, amount, remarks, occasion, originatorId, retry = true }) {
  const c = await b2cConfig();
  const credential = securityCredential(c);
  if (!credential) throw new Error('B2C security credential is not configured');

  const body = {
    OriginatorConversationID: String(originatorId).slice(0, 32),
    InitiatorName: c.initiator,
    SecurityCredential: credential,
    CommandID: c.commandID,
    Amount: Math.round(Number(amount)),
    PartyA: String(c.shortcode),
    PartyB: String(phone),
    Remarks: String(remarks || 'Wallet withdrawal').slice(0, 100),
    QueueTimeOutURL: c.timeoutUrl,
    ResultURL: c.resultUrl,
    Occasion: String(occasion || '').slice(0, 60),
  };

  const res = await fetch(`${c.base}/mpesa/b2c/v1/paymentrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const json = await res.json().catch(() => ({}));
  if (retry && json.errorCode === '404.001.03') {
    await accessToken(true);
    return b2cPayment({ phone, amount, remarks, occasion, originatorId, retry: false });
  }
  return json;
}
