// ─────────────────────────────────────────────────────────────────────────────
// Paystack client — SERVER ONLY. Never import this module from client code.
// The secret key must NEVER leave the server (PAYSTACK_SECRET_KEY env var).
//
// Implemented against Paystack's official API docs:
//   - Charge API (Kenya mobile money: mpesa / atl / mptill):
//     https://paystack.com/docs/api/charge/
//   - Payment channels / mobile money (Kenya):
//     https://paystack.com/docs/payments/payment-channels/
//   - Webhooks (HMAC SHA512 signature):
//     https://paystack.com/docs/payments/webhooks/
//   - Verify transaction:
//     https://paystack.com/docs/api/transaction/
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';

// Amounts are sent in the currency's subunit. KES has 2 decimal places,
// so KES 500 → 50000.
export const toSubunit = (amountKes) => Math.round(Number(amountKes) * 100);

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured (server-side only)');
  }
  return key;
}

/**
 * Low-level fetch wrapper for the Paystack API.
 * Returns the parsed JSON response (never throws on HTTP errors).
 */
export async function paystackFetch(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, ...(json || {}) };
}

/**
 * Normalize and validate a Kenyan phone number to international format.
 *
 * Accepted inputs:
 *   0722000000, 0712345678, +254722000000, 254722000000, 722000000
 *
 * Returns "+2547XXXXXXXX" / "+2541XXXXXXXX" or null when invalid.
 */
export function normalizeKenyanPhone(raw) {
  let p = String(raw || '').replace(/[\s().\-]/g, '');
  if (!p) return null;
  if (p.startsWith('+')) p = p.slice(1);

  if (p.startsWith('0') && p.length === 10) {
    p = '254' + p.slice(1); // 0722000000 → 254722000000
  } else if (p.length === 9 && /^[71]/.test(p)) {
    p = '254' + p; // 722000000 → 254722000000
  } else if (!p.startsWith('254')) {
    return null;
  }

  // Kenyan mobile numbers: 254 + (7|1) + 8 digits
  if (!/^254(7|1)\d{8}$/.test(p)) return null;
  return '+' + p;
}

/**
 * Charge a customer's mobile-money wallet (M-PESA / Airtel Money).
 * Paystack sends the authorization prompt to the customer's phone
 * (STK push). The response carries `data.status = "pay_offline"` and
 * `data.display_text` — show that text to the customer.
 */
export function createMobileMoneyCharge({ email, amountKes, provider, phone, reference, metadata }) {
  return paystackFetch('/charge', {
    method: 'POST',
    body: {
      email,
      amount: toSubunit(amountKes),
      currency: 'KES',
      reference,
      metadata,
      mobile_money: { provider, phone }, // provider: 'mpesa' | 'atl'
    },
  });
}

/**
 * Charge an M-PESA Till account (official Paystack `mptill` provider).
 * The phone assigned to the till receives the authorization prompt.
 * `account` is the till number — never a personal phone number.
 */
export function createTillCharge({ email, amountKes, account, reference, metadata }) {
  return paystackFetch('/charge', {
    method: 'POST',
    body: {
      email,
      amount: toSubunit(amountKes),
      currency: 'KES',
      reference,
      metadata,
      mobile_money: { provider: 'mptill', account },
    },
  });
}

/**
 * Standard Paystack checkout for card payments (PCI-safe — card details are
 * collected by Paystack's hosted checkout, never by our server).
 */
export function initializeCardCheckout({ email, amountKes, reference, callbackUrl, metadata }) {
  return paystackFetch('/transaction/initialize', {
    method: 'POST',
    body: {
      email,
      amount: toSubunit(amountKes),
      currency: 'KES',
      reference,
      callback_url: callbackUrl,
      metadata,
    },
  });
}

/** Verify a transaction with Paystack: GET /transaction/verify/:reference */
export function verifyTransaction(reference) {
  return paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Check the current state of a Charge API transaction: GET /charge/:reference */
export function checkCharge(reference) {
  return paystackFetch(`/charge/${encodeURIComponent(reference)}`);
}

/**
 * Verify that a webhook request genuinely came from Paystack.
 * Paystack signs the raw request body with HMAC-SHA512 using the secret key
 * and sends it in the `x-paystack-signature` header.
 */
export function verifyWebhookSignature(rawBody, signature) {
  if (!signature || !rawBody) return false;
  const hash = crypto.createHmac('sha512', secretKey()).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return hash === signature;
  }
}
