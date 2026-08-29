// ─────────────────────────────────────────────────────────────────────────────
// Paystack server-side client — wallet deposits (Kenya, KES)
// SERVER ONLY. Never import this module from client components.
//
// Official API facts (verified against paystack.com/docs, 2026):
//  - Charge API:  POST https://api.paystack.co/charge
//      body: { email, amount, currency, reference, mobile_money: { phone, provider } }
//      mobile money providers (Kenya): mpesa | atl (Airtel Money) | mptill (Till)
//      M-PESA Till: mobile_money: { account: <till>, provider: 'mptill' }
//  - M-PESA phone must be international format (+254…).
//  - Amount is sent in the SUBUNIT of the currency → KES subunit = cent (×100).
//    Minimum Ksh 3.00. Safaricom caps M-PESA at KES 150,000 per transaction.
//  - Charge response: data.status = "pay_offline", data.display_text,
//    data.reference — customer must authorize within 180 seconds.
//  - Webhook: header x-paystack-signature = HMAC-SHA512(secret, raw body).
//    Events: charge.success / charge.failed. Acknowledge with 200 OK.
//  - Verify: GET /transaction/verify/:reference
// ─────────────────────────────────────────────────────────────────────────────
import https from 'https';
import crypto from 'crypto';

const HOST = 'api.paystack.co';

export const PAYSTACK_CURRENCY = 'KES';
export const MIN_DEPOSIT_KES = 10;
export const MAX_DEPOSIT_KES = 150000; // Safaricom M-PESA per-transaction cap
export const CHARGE_TTL_MS = 180_000; // mobile-money prompt must be authorized within 180s

// Official provider codes for the Charge API mobile_money object
export const PROVIDERS = {
  mpesa: 'mpesa',
  airtel: 'atl', // ATMoney & Airtel Money — Ghana and Kenya
  mpesa_till: 'mptill',
};

export const PAYMENT_METHODS = {
  card: 'card',
  mpesa: 'mpesa',
  airtel: 'airtel',
  mpesa_till: 'mpesa_till',
};

// ─── Low-level HTTPS request wrapper ─────────────────────────────────────────
function request(path, { method = 'GET', body } = {}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return Promise.reject(new Error('PAYSTACK_SECRET_KEY is not configured on the server'));
  }

  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: HOST,
        port: 443,
        path,
        method,
        headers: {
          Authorization: `Bearer ${secret}`,
          ...(payload ? { 'Content-Type': 'application/json' } : {}),
        },
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, json: JSON.parse(data) });
          } catch {
            reject(new Error('Paystack returned an unreadable response'));
          }
        });
      }
    );

    req.setTimeout(15000, () => req.destroy(new Error('Paystack request timed out')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Card: official Paystack checkout (redirect flow, PCI-safe) ─────────────
// Returns the authorization_url the user is redirected to. No card data ever
// touches our server.
export async function initializeCardTransaction({ email, amountKsh, reference, callbackUrl, userId }) {
  const { statusCode, json } = await request('/transaction/initialize', {
    method: 'POST',
    body: {
      email,
      amount: Math.round(amountKsh * 100), // KES subunit = cent
      currency: PAYSTACK_CURRENCY,
      reference,
      callback_url: callbackUrl,
      channels: ['card'],
      metadata: {
        user_id: userId,
        type: 'wallet_deposit',
        payment_method: 'card',
        amount_ksh: amountKsh,
      },
    },
  });
  return { statusCode, json };
}

// ─── Mobile money: Paystack Charge API (STK/USSD push, no redirect) ─────────
// provider ∈ PROVIDERS (mpesa | atl | mptill)
// phone      → customer's normalized international number (+254…)
// tillNumber → M-PESA Till number (used INSTEAD of phone when provider=mptill)
export async function chargeMobileMoney({ email, amountKsh, reference, provider, phone = null, tillNumber = null }) {
  const mobileMoney = { provider };
  if (tillNumber) mobileMoney.account = tillNumber;
  else if (phone) mobileMoney.phone = phone;

  const { statusCode, json } = await request('/charge', {
    method: 'POST',
    body: {
      email,
      amount: Math.round(amountKsh * 100), // KES subunit = cent
      currency: PAYSTACK_CURRENCY,
      reference,
      mobile_money: mobileMoney,
      metadata: { type: 'wallet_deposit' },
    },
  });
  return { statusCode, json };
}

// ─── Verify a transaction by reference ───────────────────────────────────────
export async function verifyTransaction(reference) {
  const { statusCode, json } = await request(`/transaction/verify/${encodeURIComponent(reference)}`);
  return { statusCode, json };
}

// ─── Webhook signature: HMAC-SHA512(secret, raw body) ────────────────────────
export function isValidWebhookSignature(rawBody, signature) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature || typeof rawBody !== 'string') return false;
  const hash = crypto.createHmac('sha512', secret).update(rawBody, 'utf8').digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch {
    return hash === signature;
  }
}
