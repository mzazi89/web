// ─────────────────────────────────────────────────────────────────────────────
// lib/withdrawals.js — moving a wallet balance out to M-PESA.
//
// A withdrawal is the only place in this product where money leaves. The rules
// that keep it safe are all in this file, not in the route:
//
//   1. The balance is debited by ONE conditional UPDATE — `WHERE balance >= amount`
//      — so two taps, two tabs or a retried request can never overdraw it.
//   2. The debit and the ledger row happen before Safaricom is called. If the
//      request fails on our side the money is refunded in the same request; if it
//      fails at Safaricom it is refunded from the callback. Either way the row
//      records why.
//   3. Settlement is a state transition guarded by `status = 'pending'`. Callbacks
//      are retried by Safaricom and can arrive twice; the second one finds nothing
//      to update and refunds nothing.
//   4. A refund is issued only when a pending row actually changed to failed, so
//      a duplicate callback cannot credit the wallet twice.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sql, ensureWalletSchema } from './wallet';
import { b2cReady, b2cConfig, b2cPayment, normalizeMpesaPhone } from './mpesa';

export const MIN_WITHDRAW = 50;
export const MAX_WITHDRAW = 150_000;

let _schema = null;
export async function ensureWithdrawalSchema() {
  if (!_schema) {
    _schema = (async () => {
      await ensureWalletSchema();
      // Daraja's handles for a payout, kept beside the deposit columns so one
      // ledger tells the whole story of a transaction.
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS provider_conversation_id VARCHAR(120)`;
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS result_code INTEGER`;
      await sql`ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS result_desc TEXT`;
      // The check-then-insert in startWithdrawal races with itself when a button
      // is double-tapped. The database is the only place that can decide, so a
      // second pending payout for the same account is refused here.
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS wtx_one_pending_withdrawal
                ON wallet_transactions (user_id)
                WHERE type = 'withdrawal' AND status = 'pending'`;

      // Password confirmation for payouts, with its own counter. A stolen session
      // cookie can read a balance; it should not be able to empty it, and five
      // wrong tries cost fifteen minutes.
      await sql`
        CREATE TABLE IF NOT EXISTS withdraw_auth (
          user_id      INTEGER PRIMARY KEY,
          fails        INTEGER DEFAULT 0,
          first_at     TIMESTAMP,
          locked_until TIMESTAMP
        )
      `;
    })().catch((e) => {
      _schema = null;
      throw e;
    });
  }
  await _schema;
}

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const WINDOW_MINUTES = 15;

/**
 * Confirm the account password before any money moves.
 *
 * Counted per account, not per session: signing out and back in must not reset a
 * brute-force attempt. Five wrong tries inside fifteen minutes lock payouts for
 * fifteen minutes; a correct password clears the counter.
 */
export async function verifyWithdrawPassword(userId, password) {
  await ensureWithdrawalSchema();

  const rows = await sql`
    SELECT u.password AS hash, a.fails, a.first_at, a.locked_until
    FROM users u LEFT JOIN withdraw_auth a ON a.user_id = u.id
    WHERE u.id = ${userId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row?.hash) return { ok: false, error: 'This account has no password set. Use a reset link first.' };

  const now = Date.now();
  if (row.locked_until && new Date(row.locked_until).getTime() > now) {
    const mins = Math.ceil((new Date(row.locked_until).getTime() - now) / 60_000);
    return { ok: false, locked: true, error: `Too many wrong passwords. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` };
  }

  const matches = await bcrypt.compare(String(password || ''), String(row.hash));
  if (matches) {
    await sql`DELETE FROM withdraw_auth WHERE user_id = ${userId}`;
    return { ok: true };
  }

  const stale = !row.first_at || (now - new Date(row.first_at).getTime() > WINDOW_MINUTES * 60_000);
  const fails = (stale ? 0 : Number(row.fails || 0)) + 1;
  const firstAt = stale ? new Date() : new Date(row.first_at);
  const lockedUntil = fails >= MAX_FAILS ? new Date(now + LOCK_MINUTES * 60_000) : null;

  await sql`
    INSERT INTO withdraw_auth (user_id, fails, first_at, locked_until)
    VALUES (${userId}, ${fails}, ${firstAt}, ${lockedUntil})
    ON CONFLICT (user_id) DO UPDATE
      SET fails = ${fails}, first_at = ${firstAt}, locked_until = ${lockedUntil}
  `;

  if (lockedUntil) {
    return { ok: false, locked: true, error: `Too many wrong passwords. Try again in ${LOCK_MINUTES} minutes.` };
  }
  const left = MAX_FAILS - fails;
  return { ok: false, error: `Wrong password. ${left} attempt${left === 1 ? '' : 's'} left.` };
}

export async function recentWithdrawals(userId, limit = 10) {
  return sql`
    SELECT id, amount, status, phone_number, reference, provider_receipt,
           failure_reason, result_code, created_at, paid_at
    FROM wallet_transactions
    WHERE user_id = ${userId} AND type = 'withdrawal'
    ORDER BY id DESC
    LIMIT ${limit}
  `;
}

/**
 * Debit, record, then ask Safaricom to pay.
 *
 * Returns { ok: true, transaction } when the request was accepted for processing,
 * or { ok: false, error } with the money back in the wallet.
 */
export async function startWithdrawal({ userId, amount, phone, note = '', password = '' }) {
  await ensureWithdrawalSchema();

  // M-PESA pays whole shillings; Daraja rejects 100.50. Debiting the exact amount
  // that will be paid is the only way the ledger and the payout can agree, so a
  // fractional ask is refused rather than silently rounded.
  const raw = Number(amount);
  if (!Number.isFinite(raw) || Math.abs(raw - Math.round(raw)) > 0.0001) {
    return { ok: false, error: 'M-PESA pays whole shillings — enter 250, not 250.50.', code: 'amount' };
  }
  const value = Math.round(raw);
  if (value < MIN_WITHDRAW) {
    return { ok: false, error: `Minimum withdrawal is KES ${MIN_WITHDRAW}.`, code: 'amount' };
  }
  if (value > MAX_WITHDRAW) {
    return { ok: false, error: `Maximum withdrawal is KES ${MAX_WITHDRAW.toLocaleString()}.`, code: 'amount' };
  }

  const msisdn = normalizeMpesaPhone(phone);
  if (!msisdn) {
    return { ok: false, error: 'Enter a valid Safaricom number, e.g. 0712 345 678.', code: 'phone' };
  }

  // Password before anything else: a wrong one must not reveal whether payouts
  // are configured, nor touch the balance, nor count as an attempt.
  const auth = await verifyWithdrawPassword(userId, password);
  if (!auth.ok) {
    return { ok: false, error: auth.error, code: auth.locked ? 'locked' : 'auth' };
  }

  if (!(await b2cReady())) {
    return {
      ok: false,
      error: 'Withdrawals are not enabled on this account yet. Please contact support.',
      code: 'unconfigured',
    };
  }

  // One in flight at a time. Two requests a second apart would both debit and
  // both pay; this makes the second one wait for the first to settle.
  const inflight = await sql`
    SELECT id FROM wallet_transactions
    WHERE user_id = ${userId} AND type = 'withdrawal' AND status = 'pending'
      AND created_at > NOW() - INTERVAL '15 minutes'
    LIMIT 1
  `;
  if (inflight[0]) {
    return {
      ok: false,
      error: 'A withdrawal is already being processed. Give it a minute, then check the history.',
      code: 'inflight',
    };
  }

  // Atomic debit. This is the gate: no row is written unless the money was there.
  const debited = await sql`
    UPDATE wallet SET balance = balance - ${value}, updated_at = NOW()
    WHERE user_id = ${userId} AND balance >= ${value}
    RETURNING balance
  `;
  if (!debited[0]) {
    return { ok: false, error: 'Your balance is too low for that amount.', code: 'funds' };
  }

  const reference = `WDR-${userId}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const originatorId = `WDR${Date.now()}${crypto.randomBytes(2).toString('hex')}`;

  let transaction;
  try {
    const rows = await sql`
      INSERT INTO wallet_transactions
        (user_id, type, amount, reference, description, status, currency,
         payment_method, phone_number, provider, provider_ref, updated_at)
      VALUES
        (${userId}, 'withdrawal', ${value}, ${reference},
         ${note ? `Withdrawal to M-PESA — ${note}` : 'Withdrawal to M-PESA'},
         'pending', 'KES', 'mpesa_b2c', ${msisdn}, 'mpesa_b2c', ${originatorId}, NOW())
      RETURNING *
    `;
    transaction = rows[0];
  } catch (e) {
    // 23505 = the partial unique index above: another payout is already pending.
    await creditBack(userId, value);
    if (String(e?.code || '') === '23505' || /unique|duplicate/i.test(String(e?.message))) {
      return { ok: false, error: 'A withdrawal is already being processed. Give it a minute.', code: 'inflight' };
    }
    throw e;
  }

  try {
    const answer = await b2cPayment({
      phone: msisdn,
      amount: value,
      remarks: `Wallet withdrawal ${reference}`,
      occasion: reference,
      originatorId,
    });

    if (!answer || String(answer.ResponseCode || '') !== '0') {
      const reason = answer?.errorMessage
        || answer?.ResponseDescription
        || `Daraja rejected the payout (${answer?.errorCode || 'no response'})`;
      await refund(transaction, reason, answer?.errorCode ? Number(String(answer.errorCode).split('.')[0]) || null : null);
      return { ok: false, error: reason, code: 'provider' };
    }

    await sql`
      UPDATE wallet_transactions
      SET provider_conversation_id = ${answer.ConversationID || null}, updated_at = NOW()
      WHERE id = ${transaction.id}
    `;

    return {
      ok: true,
      transaction: {
        ...transaction,
        provider_conversation_id: answer.ConversationID || null,
        status: 'pending',
      },
    };
  } catch (e) {
    // Transport failure (timeout, DNS, Daraja 5xx): the payout may or may not have
    // been queued, but nothing has been paid, so the money goes back and the row
    // says exactly that.
    const reason = `Could not reach M-PESA: ${e?.message || e}`.slice(0, 250);
    await refund(transaction, reason, null);
    return { ok: false, error: 'M-PESA could not be reached. Your balance has not been touched.', code: 'transport' };
  }
}

async function creditBack(userId, amount) {
  await sql`
    UPDATE wallet SET balance = balance + ${Number(amount)}, updated_at = NOW()
    WHERE user_id = ${userId}
  `;
}

/** Pending → failed, and the exact amount back, once. */
async function refund(transaction, reason, code = null) {
  const changed = await sql`
    UPDATE wallet_transactions
    SET status = 'failed', failure_reason = ${reason}, result_code = ${code}, updated_at = NOW()
    WHERE id = ${transaction.id} AND status = 'pending'
    RETURNING id
  `;
  if (!changed[0]) return false;

  await creditBack(transaction.user_id, transaction.amount);
  return true;
}

/**
 * Apply Safaricom's result to the ledger.
 *
 * Called from /api/mpesa/b2c/result and /timeout. `originatorId` is the value we
 * generated and sent; `conversationId` is Daraja's own handle, accepted as a
 * fallback because not every callback payload carries both.
 */
export async function settleWithdrawal({ originatorId, conversationId, resultCode, resultDesc, receipt }) {
  await ensureWithdrawalSchema();

  const rows = await sql`
    SELECT * FROM wallet_transactions
    WHERE type = 'withdrawal'
      AND (provider_ref = ${originatorId || ''} OR provider_conversation_id = ${conversationId || ''})
    ORDER BY id DESC
    LIMIT 1
  `;
  const transaction = rows[0];
  if (!transaction) return { matched: false, status: 'unknown' };

  if (transaction.status !== 'pending') {
    return { matched: true, status: transaction.status, duplicate: true };
  }

  const ok = Number(resultCode) === 0;

  if (ok) {
    await sql`
      UPDATE wallet_transactions
      SET status = 'success', provider_receipt = ${receipt || null},
          result_code = 0, result_desc = ${resultDesc || 'Success'},
          paid_at = NOW(), updated_at = NOW()
      WHERE id = ${transaction.id} AND status = 'pending'
    `;
    return { matched: true, status: 'success' };
  }

  const refunded = await refund(
    transaction,
    String(resultDesc || 'M-PESA could not complete the payout').slice(0, 250),
    Number.isFinite(Number(resultCode)) ? Number(resultCode) : null
  );
  return { matched: true, status: 'failed', refunded };
}

export async function withdrawalLimits() {
  const configured = await b2cReady();
  let channel = '';
  if (configured) {
    const c = await b2cConfig();
    // A stand-in endpoint during testing is neither sandbox nor production, and
    // saying so on screen prevents a false sense of "this is live".
    channel = c.base.includes('sandbox') ? 'sandbox'
      : c.base.includes('127.0.0.1') || c.base.includes('localhost') ? 'test'
        : 'production';
  }
  return {
    available: configured,
    min: MIN_WITHDRAW,
    max: MAX_WITHDRAW,
    fee: 0,
    channel,
  };
}
