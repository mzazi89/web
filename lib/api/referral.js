// MZAZI referral system
//
// The rule, in one sentence: a referrer earns KES 40 once — when the person they
// referred makes their first successful transaction of KES 100 or more.
//
// Three details make that rule honest:
//   * "once" is enforced per *referred user*, not per order. An earlier version
//     keyed the unique constraint to order_id, so a busy referee would have paid
//     their referrer again on every purchase.
//   * "successful" means settled money: a failed or abandoned attempt, or a
//     transaction still pending, does not qualify.
//   * the reward itself is not a qualifying transaction, otherwise one referral
//     could cascade through a chain of accounts.
//
// Both amounts are env-tunable (REFERRAL_BONUS, REFERRAL_MIN) but default to the
// advertised 40 / 100 so the site copy and the code cannot drift apart.
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

export const REFERRAL_BONUS = Math.max(0, Number.parseFloat(process.env.REFERRAL_BONUS || '40') || 0);
export const REFERRAL_MIN = Math.max(1, Number.parseFloat(process.env.REFERRAL_MIN || '100') || 100);

export function generateReferralCode() {
  // 8-char unambiguous base32-ish code (no 0/O/1/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) out += chars[bytes[i] % chars.length];
  return out;
}

// ── schema ───────────────────────────────────────────────────────────────────
// Runs once per process. Everything is IF NOT EXISTS / tolerated, because this
// executes against whatever vintage of the table the database happens to hold:
// the original one required an order_id, which a wallet top-up does not have.
let schemaReady = null;
export function ensureReferralSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id)`;
      await sql`
        CREATE TABLE IF NOT EXISTS referral_commissions (
          id SERIAL PRIMARY KEY,
          referrer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          referred_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          order_id INTEGER,
          amount NUMERIC(10, 2) NOT NULL DEFAULT 40.00,
          status VARCHAR(20) DEFAULT 'paid',
          source VARCHAR(40),
          trigger_amount NUMERIC(10, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`ALTER TABLE referral_commissions ADD COLUMN IF NOT EXISTS order_id INTEGER`;
      await sql`ALTER TABLE referral_commissions ADD COLUMN IF NOT EXISTS source VARCHAR(40)`;
      await sql`ALTER TABLE referral_commissions ADD COLUMN IF NOT EXISTS trigger_amount NUMERIC(10, 2)`;
      await sql`ALTER TABLE referral_commissions ALTER COLUMN order_id DROP NOT NULL`;
      await sql`ALTER TABLE referral_commissions ALTER COLUMN amount SET DEFAULT 40.00`;

      // One reward per referred person. Created on a best-effort basis: a
      // database that already paid somebody twice cannot take the index, and the
      // application-level guard below still holds the line.
      try {
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_commissions_referred ON referral_commissions(referred_user_id)`;
      } catch { /* historical duplicates — guarded in code instead */ }
      await sql`CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions(referrer_user_id, created_at DESC)`;
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

// Make sure a user has a unique referral code (backfill)
export async function ensureReferralCode(userId) {
  const rows = await sql`SELECT referral_code FROM users WHERE id = ${userId} LIMIT 1`;
  if (rows.length === 0) return null;
  if (rows[0].referral_code) return rows[0].referral_code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    try {
      await sql`UPDATE users SET referral_code = ${code} WHERE id = ${userId} AND referral_code IS NULL`;
      return code;
    } catch {
      // unique collision — try again
    }
  }
  return null;
}

// Resolve a referral code to a user id (null if invalid)
export async function resolveReferralCode(code) {
  if (!code || typeof code !== 'string') return null;
  const rows = await sql`
    SELECT id FROM users WHERE UPPER(referral_code) = UPPER(${code.trim()}) LIMIT 1
  `;
  return rows.length > 0 ? rows[0].id : null;
}

/**
 * The qualifying transaction, if there is one: the first settled movement of at
 * least REFERRAL_MIN, whether it was a top-up or a purchase.
 *
 * `orders` is the legacy panel-purchase table, still used by /api/payment/verify,
 * and it is read in its own try/catch so a database without it is not an error.
 */
async function firstQualifyingTransaction(userId, db = sql) {
  const rows = await db`
    SELECT id, reference, (amount + COALESCE(bonus_amount, 0)) AS gross, created_at
    FROM wallet_transactions
    WHERE user_id = ${userId}
      AND status = 'success'
      AND type <> 'referral'
      AND (amount + COALESCE(bonus_amount, 0)) >= ${REFERRAL_MIN}
    ORDER BY created_at, id
    LIMIT 1
  `;
  if (rows.length > 0) return { ...rows[0], source: 'wallet' };

  try {
    const legacy = await db`
      SELECT id, reference, amount AS gross, created_at
      FROM orders
      WHERE user_id = ${userId} AND status = 'completed' AND amount >= ${REFERRAL_MIN}
      ORDER BY created_at, id
      LIMIT 1
    `;
    if (legacy.length > 0) return { ...legacy[0], source: 'order' };
  } catch { /* orders table absent or shaped differently */ }

  return null;
}

/**
 * Credit the referrer if, and only if, this user has now qualified.
 * Safe to call on every transaction — it is idempotent and never throws, because
 * a referral problem must never fail a customer's purchase.
 *
 * Returns { rewarded: true, amount } | { rewarded: false, reason }.
 */
const claimIdOf = (row) => (row && (row.id ?? 'X')) || 'X';

export async function maybeQualifyReferral(userId, { orderId = null } = {}) {
  return qualifyWith(sql, userId, { orderId });
}

/**
 * The rule itself, with the database injected. `maybeQualifyReferral` is the
 * production entry point; this split exists so the decision can be tested
 * against a stub without a live Postgres (see scripts in the repo history).
 */
export async function qualifyWith(db, userId, { orderId = null } = {}) {
  try {
    if (!userId) return { rewarded: false, reason: 'no_user' };
    if (db === sql) await ensureReferralSchema();

    const rows = await db`SELECT id, referred_by FROM users WHERE id = ${userId} LIMIT 1`;
    const buyer = rows[0];
    if (!buyer || !buyer.referred_by) return { rewarded: false, reason: 'not_referred' };
    if (Number(buyer.referred_by) === Number(userId)) return { rewarded: false, reason: 'self_referral' };

    const referrerId = Number(buyer.referred_by);

    // Already paid for this person? Then nothing else qualifies them again.
    const paid = await db`
      SELECT id FROM referral_commissions WHERE referred_user_id = ${userId} LIMIT 1
    `;
    if (paid.length > 0) return { rewarded: false, reason: 'already_rewarded' };

    const trigger = await firstQualifyingTransaction(userId, db);
    if (!trigger) return { rewarded: false, reason: 'below_threshold' };

    // Insert-guard: only writes if no other request claimed this referee first.
    const claimed = await db`
      INSERT INTO referral_commissions
        (referrer_user_id, referred_user_id, order_id, amount, status, source, trigger_amount)
      SELECT ${referrerId}, ${userId}, ${orderId}, ${REFERRAL_BONUS}, 'paid',
             ${trigger.source}, ${Number(trigger.gross)}
      WHERE NOT EXISTS (
        SELECT 1 FROM referral_commissions WHERE referred_user_id = ${userId}
      )
      RETURNING id
    `;
    if (claimed.length === 0) return { rewarded: false, reason: 'already_rewarded' };

    await db`
      INSERT INTO wallet (user_id, balance)
      VALUES (${referrerId}, ${REFERRAL_BONUS})
      ON CONFLICT (user_id) DO UPDATE SET
        balance = wallet.balance + ${REFERRAL_BONUS},
        updated_at = CURRENT_TIMESTAMP
    `;

    await db`
      INSERT INTO wallet_transactions (user_id, type, amount, reference, description, status, paid_at)
      VALUES (
        ${referrerId}, 'referral', ${REFERRAL_BONUS}, ${`REF-${claimIdOf(claimed[0])}`},
        ${`Referral bonus — KES ${REFERRAL_BONUS} for a friend's first KES ${REFERRAL_MIN}+ payment`},
        'success', CURRENT_TIMESTAMP
      )
    `;

    return { rewarded: true, amount: REFERRAL_BONUS, referrerId };
  } catch (e) {
    console.error('[mzazi] referral reward failed:', e.message);
    return { rewarded: false, reason: 'error', error: e.message };
  }
}

// Kept for callers that still pass an order id (the legacy panel checkout).
export async function creditReferralCommission({ orderId = null, buyerUserId }) {
  return maybeQualifyReferral(buyerUserId, { orderId });
}
