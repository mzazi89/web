// ─────────────────────────────────────────────────────────────────────────────
// Wallet payment business logic — shared by the deposit route, the polling
// status route, the Paystack webhook and the verify callback.
//
// Safety rules enforced here:
//   - The wallet is ONLY credited after Paystack confirms the transaction as
//     successful (verified via the Verify Transaction API).
//   - Crediting happens exactly once per reference: the status flip from
//     pending/processing → success is conditional, and the wallet credit is
//     fused into the SAME atomic SQL statement. Concurrent webhook/verify
//     calls can never double-credit.
//   - A successful webhook that arrives twice is ignored the second time.
// ─────────────────────────────────────────────────────────────────────────────
import { neon } from '@neondatabase/serverless';
import { verifyTransaction, toSubunit } from './paystack';

const sql = neon(process.env.DATABASE_URL);

/** Generate a unique deposit reference. */
export function generateDepositReference(userId) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `WLT-${userId}-${ts}-${rand}`;
}

/**
 * Insert a pending wallet transaction. Returns the row or null when the
 * reference already exists (unique index → idempotent creation).
 */
export async function createPendingWalletTransaction({ userId, amount, reference, paymentMethod, phoneNumber, description }) {
  try {
    const rows = await sql`
      INSERT INTO wallet_transactions
        (user_id, type, amount, reference, description, status, currency, payment_method, phone_number, provider)
      VALUES
        (${userId}, 'deposit', ${amount}, ${reference}, ${description || 'Wallet top-up'}, 'pending', 'KES',
         ${paymentMethod}, ${phoneNumber || null}, 'paystack')
      RETURNING id, user_id, amount, reference, status, currency, payment_method, phone_number, created_at
    `;
    return rows[0] || null;
  } catch (e) {
    if (String(e.message || e).includes('duplicate key')) return null; // reference already exists
    throw e;
  }
}

/** Mark a transaction as processing once the charge was initiated. */
export async function markTransactionProcessing(reference, paystackTransactionId = null) {
  await sql`
    UPDATE wallet_transactions
    SET status = 'processing', updated_at = NOW(),
        paystack_transaction_id = COALESCE(${paystackTransactionId}, paystack_transaction_id)
    WHERE reference = ${reference} AND status = 'pending'
  `;
}

/** Mark a transaction terminal (never credits the wallet). Default: failed. */
export async function markTransactionFailed(reference, reason = 'payment_failed', status = 'failed') {
  await sql`
    UPDATE wallet_transactions
    SET status = ${status}, updated_at = NOW(),
        description = COALESCE(description, '') || CASE WHEN ${reason} IS NOT NULL THEN ' — ' || ${reason} ELSE '' END
    WHERE reference = ${reference} AND status IN ('pending', 'processing')
  `;
}

/** Look up a transaction by reference (only wallet deposits). */
export async function getWalletTransaction(reference) {
  const rows = await sql`
    SELECT * FROM wallet_transactions
    WHERE reference = ${reference} AND type = 'deposit'
  `;
  return rows[0] || null;
}

/**
 * Core idempotent processor — the ONLY place that credits the wallet.
 *
 * 1. Verify the transaction with Paystack.
 * 2. Re-check reference, amount, currency and ownership against the local row.
 * 3. Atomically flip pending/processing → success AND credit the wallet in a
 *    single SQL statement. If the row was already claimed (status success),
 *    no credit happens — duplicate webhooks are safely ignored.
 *
 * Returns { credited: boolean, already: boolean, reason: string, tx: row|null }
 */
export async function processSuccessfulWalletPayment(reference) {
  // 1) Verify with Paystack
  const pay = await verifyTransaction(reference);
  if (!pay.ok || pay.status === false || !pay.data) {
    return { credited: false, already: false, reason: 'verify_failed' };
  }

  const payData = pay.data;

  // Terminal non-success states from Paystack: record them, never credit.
  if (payData.status === 'failed' || payData.status === 'abandoned') {
    await markTransactionFailed(reference, payData.gateway_response || payData.status, payData.status);
    return { credited: false, already: false, reason: payData.status };
  }

  if (payData.status !== 'success') {
    // Still pending/processing on Paystack's side — wait for webhook/polling.
    return { credited: false, already: false, reason: 'not_success' };
  }

  // 2) Local row must exist and be a wallet deposit.
  const tx = await getWalletTransaction(reference);
  if (!tx) {
    return { credited: false, already: false, reason: 'transaction_not_found' };
  }

  // If already success, this is a duplicate event — ignore safely.
  if (tx.status === 'success') {
    return { credited: false, already: true, reason: 'already_credited' };
  }

  // 3) Confirm the checks: reference matches (implicit), amount matches,
  //    currency matches, transaction belongs to the expected user.
  const payAmount = Number(payData.amount);
  const localAmountSubunit = toSubunit(tx.amount);
  if (payAmount !== localAmountSubunit) {
    await markTransactionFailed(reference, `amount_mismatch:${payAmount}`);
    return { credited: false, already: false, reason: 'amount_mismatch' };
  }
  if (payData.currency !== 'KES' || tx.currency !== 'KES') {
    return { credited: false, already: false, reason: 'currency_mismatch' };
  }
  const metaUserId = payData.metadata && payData.metadata.user_id != null ? String(payData.metadata.user_id) : null;
  if (metaUserId && metaUserId !== String(tx.user_id)) {
    return { credited: false, already: false, reason: 'user_mismatch' };
  }

  const paystackTxId = payData.id != null ? Number(payData.id) : null;

  // 4) Atomic claim + credit. The conditional UPDATE claims the transaction
  //    (only one concurrent caller can flip pending/processing → success);
  //    the INSERT ... ON CONFLICT then credits exactly that amount once.
  const claimed = await sql`
    WITH claimed AS (
      UPDATE wallet_transactions
      SET status = 'success',
          paid_at = NOW(),
          updated_at = NOW(),
          paystack_transaction_id = COALESCE(${paystackTxId}, paystack_transaction_id)
      WHERE reference = ${reference}
        AND type = 'deposit'
        AND status IN ('pending', 'processing')
      RETURNING id, user_id, amount
    )
    INSERT INTO wallet (user_id, balance)
    SELECT user_id, amount FROM claimed
    ON CONFLICT (user_id) DO UPDATE SET
      balance = wallet.balance + EXCLUDED.balance,
      updated_at = NOW()
    RETURNING id
  `;

  if (claimed.length === 0) {
    // Someone else (or an earlier duplicate event) already processed it.
    const recheck = await getWalletTransaction(reference);
    if (recheck && recheck.status === 'success') {
      return { credited: false, already: true, reason: 'already_credited' };
    }
    return { credited: false, already: false, reason: 'claim_failed' };
  }

  return { credited: true, already: false, reason: 'credited', tx };
}
