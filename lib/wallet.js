// ─────────────────────────────────────────────────────────────────────────────
// Shared server-side wallet logic — used by deposit, status, verify & webhook.
// SERVER ONLY.
//
// Wallet safety model:
//  - The wallet balance is NEVER increased by the frontend, by the Charge API
//    returning 200, by "I have paid" clicks, by callbacks, or by page reloads.
//  - The ONLY path that credits the wallet is creditWalletOnce(), which:
//      1) is reached from Paystack verification (webhook / verify / status),
//      2) checks amount + currency + status against Paystack's response,
//      3) performs the status update AND balance credit in ONE atomic SQL
//         statement guarded by status IN ('pending','processing'), so the same
//         reference can never be credited twice, no matter how many webhook
//         copies arrive.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';
import { verifyTransaction, PAYSTACK_CURRENCY } from './paystack';

export const sql = neon(process.env.DATABASE_URL);

// ─── Unique transaction reference ────────────────────────────────────────────
// Paystack allows only alphanumeric + `-` `.` `=` in references.
export function generateReference(userId) {
  const rand = crypto.randomBytes(5).toString('hex');
  return `WALLET-${userId}-${Date.now()}-${rand}`;
}

// ─── Idempotent schema bootstrap (additive, safe on every run) ───────────────
let _schemaPromise = null;
export async function ensureWalletSchema() {
  if (!_schemaPromise) {
    _schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          type VARCHAR(50) NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          reference VARCHAR(255),
          description TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'KES'`;
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`;
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)`;
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'paystack'`;
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS paystack_id BIGINT`;
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS failure_reason TEXT`;
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`;
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
      // Deposit-offer columns: the multiplier is STAMPED at deposit creation
      // (what the user saw advertised), and bonus_amount is computed + credited
      // atomically when Paystack confirms the payment.
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS bonus_multiplier NUMERIC(5, 2)`;
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS bonus_amount NUMERIC(12, 2) DEFAULT 0.00`;
      await sql`CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created ON wallet_transactions(user_id, created_at DESC)`;
    })().catch((e) => {
      _schemaPromise = null; // allow a later retry
      throw e;
    });
  }
  await _schemaPromise;
}

// ─── Wallet row helpers ──────────────────────────────────────────────────────
export async function ensureWallet(userId) {
  await sql`INSERT INTO wallet (user_id, balance) VALUES (${userId}, 0.00) ON CONFLICT (user_id) DO NOTHING`;
}

export async function getTransactionByReference(reference) {
  const rows = await sql`SELECT * FROM wallet_transactions WHERE reference = ${reference} LIMIT 1`;
  return rows[0] || null;
}

// ─── Status transitions (only ever from pending/processing) ──────────────────
export async function markTransactionFailed(reference, reason) {
  await sql`
    UPDATE wallet_transactions
    SET status = 'failed', failure_reason = ${reason || null}, updated_at = NOW()
    WHERE reference = ${reference} AND status IN ('pending', 'processing')
  `;
}

export async function markTransactionAbandoned(reference, reason) {
  await sql`
    UPDATE wallet_transactions
    SET status = 'abandoned', failure_reason = ${reason || null}, updated_at = NOW()
    WHERE reference = ${reference} AND status IN ('pending', 'processing')
  `;
}

// ─── Deposit offer (bonus) ───────────────────────────────────────────────────
// Reads the promo config from the shared `settings` table (managed in the admin
// panel). Keys:
//   depositOfferEnabled      '1' / 'true'  → offer active
//   depositOfferMultiplier   e.g. '2'      → deposit KES X credits KES X × 2
//   depositOfferAdText       banner text shown on the wallet page
// A multiplier ≤ 1 means no bonus even if enabled.
export async function getDepositOffer() {
  try {
    const rows = await sql`
      SELECT key, value FROM settings
      WHERE key = ANY(ARRAY['depositOfferEnabled', 'depositOfferMultiplier', 'depositOfferAdText'])
    `;
    const map = {};
    for (const r of rows) map[r.key] = r.value;

    const rawEnabled = String(map.depositOfferEnabled || '').trim().toLowerCase();
    const enabled = rawEnabled === '1' || rawEnabled === 'true' || rawEnabled === 'yes' || rawEnabled === 'on';
    const multiplier = Math.max(1, Number.parseFloat(map.depositOfferMultiplier) || 0);
    const active = enabled && multiplier > 1;

    return {
      enabled: active,
      multiplier: active ? multiplier : null,
      bonusRate: active ? multiplier - 1 : 0,
      adText: String(map.depositOfferAdText || '').trim() || null,
    };
  } catch (e) {
    // settings table missing / DB unavailable → offer simply off
    return { enabled: false, multiplier: null, bonusRate: 0, adText: null };
  }
}

export function computeDepositBonus(amount, multiplier) {
  if (!multiplier || multiplier <= 1) return { bonus: 0, total: amount };
  const bonus = Math.round(Number(amount) * (multiplier - 1) * 100) / 100;
  return { bonus, total: Math.round((Number(amount) + bonus) * 100) / 100 };
}

// ─── ATOMIC, idempotent credit ───────────────────────────────────────────────
// One SQL statement: marks the tx success, computes any stamped bonus, adds
// amount + bonus to the balance. If the tx is already success (duplicate
// webhook), the UPDATE matches 0 rows and nothing is credited. If any part
// fails, Postgres rolls back the whole statement.
export async function creditWalletOnce({ reference, paystackId = null, paidAt = null }) {
  const rows = await sql`
    WITH updated AS (
      UPDATE wallet_transactions
      SET status = 'success',
          paid_at = COALESCE(${paidAt}::timestamp, NOW()),
          paystack_id = ${paystackId},
          updated_at = NOW(),
          failure_reason = NULL,
          bonus_amount = CASE
            WHEN bonus_multiplier IS NOT NULL AND bonus_multiplier > 1
              THEN ROUND(CAST(amount AS NUMERIC) * (bonus_multiplier - 1), 2)
            ELSE 0.00
          END
      WHERE reference = ${reference}
        AND status IN ('pending', 'processing')
      RETURNING user_id, amount, bonus_amount
    ),
    credit AS (
      INSERT INTO wallet (user_id, balance)
      SELECT user_id, amount + bonus_amount FROM updated
      ON CONFLICT (user_id) DO UPDATE
        SET balance = wallet.balance + EXCLUDED.balance, updated_at = NOW()
      RETURNING user_id, balance
    )
    SELECT u.user_id, u.amount, u.bonus_amount, c.balance
    FROM updated u JOIN credit c USING (user_id)
  `;

  if (rows.length > 0) {
    return {
      credited: true,
      userId: rows[0].user_id,
      amount: Number(rows[0].amount),
      bonus: Number(rows[0].bonus_amount),
      balance: Number(rows[0].balance),
    };
  }

  // Classify the no-op for logging only (the atomic guard already did its job)
  const existing = await getTransactionByReference(reference);
  if (!existing) return { credited: false, reason: 'not_found' };
  if (existing.status === 'success') return { credited: false, reason: 'already_success' };
  return { credited: false, reason: 'not_creditable', status: existing.status };
}

// ─── Full verify + credit pipeline ───────────────────────────────────────────
// Single source of truth for webhook / status polling / callback / manual
// verify. Never credits unless Paystack itself confirms success.
export async function verifyAndCreditWalletDeposit(reference, { expectedUserId = null } = {}) {
  const tx = await getTransactionByReference(reference);
  if (!tx) return { success: false, code: 'not_found' };

  if (expectedUserId !== null && Number(tx.user_id) !== Number(expectedUserId)) {
    return { success: false, code: 'user_mismatch' };
  }

  if (tx.status === 'success') return { success: true, already: true, amount: Number(tx.amount), bonus: Number(tx.bonus_amount || 0), bonusMultiplier: tx.bonus_multiplier ? Number(tx.bonus_multiplier) : null };
  if (!['pending', 'processing'].includes(tx.status)) {
    return { success: false, code: 'not_creditable', status: tx.status };
  }

  let json;
  try {
    ({ json } = await verifyTransaction(reference));
  } catch (e) {
    return { success: false, code: 'verify_error', error: e.message };
  }

  if (!json || json.status !== true || !json.data) {
    return { success: false, code: 'verify_error' };
  }

  const data = json.data;

  // Paystack confirmed a terminal non-success state → reflect it
  if (data.status !== 'success') {
    if (data.status === 'failed' || data.status === 'abandoned') {
      await markTransactionFailed(reference, data.gateway_response || data.message || 'Payment not completed');
    }
    return { success: false, code: 'not_success', paystackStatus: data.status };
  }

  // Reference / amount / currency sanity checks
  if (data.reference && data.reference !== reference) {
    return { success: false, code: 'reference_mismatch' };
  }
  if (data.currency !== PAYSTACK_CURRENCY) {
    return { success: false, code: 'currency_mismatch', currency: data.currency };
  }
  const expectedCents = Math.round(Number(tx.amount) * 100);
  if (Number(data.amount) !== expectedCents) {
    return { success: false, code: 'amount_mismatch', paystackAmount: data.amount, expectedCents };
  }

  const credited = await creditWalletOnce({
    reference,
    paystackId: data.id ?? null,
    paidAt: data.paid_at || new Date().toISOString(),
  });

  if (credited.credited) {
    return {
      success: true,
      already: false,
      amount: Number(tx.amount),
      bonus: credited.bonus || 0,
      bonusMultiplier: tx.bonus_multiplier ? Number(tx.bonus_multiplier) : null,
      balance: credited.balance,
    };
  }
  if (credited.reason === 'already_success') {
    const fresh = await getTransactionByReference(reference);
    return {
      success: true,
      already: true,
      amount: Number(tx.amount),
      bonus: fresh ? Number(fresh.bonus_amount || 0) : 0,
      bonusMultiplier: tx.bonus_multiplier ? Number(tx.bonus_multiplier) : null,
    };
  }
  return { success: false, code: credited.reason };
}
