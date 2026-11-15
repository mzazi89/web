// MZAZI — persistence for Dynamic Offers.
//
// Four tables, each answering a question somebody actually asks:
//   offer_lookups   what Safaricom offered this number, and when
//   offer_purchases the money trail and the provider's own id for it
//   purchase_events every status transition, so "pending" has a history
//   api_logs        what we sent and what came back, credentials stripped
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

let ready = null;

export function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS offer_lookups (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          msisdn VARCHAR(15) NOT NULL,
          offer_count INTEGER NOT NULL DEFAULT 0,
          ok BOOLEAN NOT NULL DEFAULT false,
          error TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS offer_purchases (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          msisdn VARCHAR(15) NOT NULL,
          offer_ref VARCHAR(80) NOT NULL,
          offer_name VARCHAR(120),
          amount NUMERIC(10,2),
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          reference VARCHAR(40) NOT NULL,
          provider_ref VARCHAR(120),
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_offer_purchases_ref ON offer_purchases(reference)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_offer_purchases_user ON offer_purchases(user_id, created_at DESC)`;
      await sql`
        CREATE TABLE IF NOT EXISTS purchase_events (
          id SERIAL PRIMARY KEY,
          purchase_id INTEGER NOT NULL,
          status VARCHAR(20) NOT NULL,
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS api_logs (
          id SERIAL PRIMARY KEY,
          kind VARCHAR(16) NOT NULL,
          url TEXT NOT NULL,
          status INTEGER,
          ok BOOLEAN NOT NULL DEFAULT false,
          ms INTEGER,
          request_body TEXT,
          response_body TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export async function logApiCall({ kind, url, status, ok, ms, request, response }) {
  await ensureSchema();
  // Bodies can contain a customer's number; keep them short and never log headers.
  await sql`
    INSERT INTO api_logs (kind, url, status, ok, ms, request_body, response_body)
    VALUES (${kind}, ${url}, ${status ?? null}, ${Boolean(ok)}, ${ms ?? null},
            ${request ? String(request).slice(0, 2000) : null}, ${response ? String(response).slice(0, 4000) : null})
  `;
}

export async function recordLookup({ userId, msisdn, count, ok, error }) {
  await ensureSchema();
  await sql`
    INSERT INTO offer_lookups (user_id, msisdn, offer_count, ok, error)
    VALUES (${userId ?? null}, ${msisdn}, ${count}, ${ok}, ${error ? String(error).slice(0, 300) : null})
  `;
}

// Duplicate prevention lives in the database, not in a UI flag: two taps racing
// each other both arrive here, and only the first one gets an id back.
export async function createPurchase({ userId, msisdn, offerRef, offerName, amount, reference }) {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO offer_purchases (user_id, msisdn, offer_ref, offer_name, amount, status, reference)
    VALUES (${userId}, ${msisdn}, ${offerRef}, ${offerName ?? null}, ${amount ?? null}, 'pending', ${reference})
    ON CONFLICT (reference) DO NOTHING
    RETURNING id
  `;
  if (!rows[0]) return null;
  await addEvent(rows[0].id, 'pending', 'Purchase submitted');
  return rows[0].id;
}

export async function setPurchase(id, { status, providerRef, message }) {
  await ensureSchema();
  await sql`
    UPDATE offer_purchases
    SET status = ${status},
        provider_ref = COALESCE(${providerRef ?? null}, provider_ref),
        message = ${message ? String(message).slice(0, 400) : null},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
  await addEvent(id, status, message);
}

export async function addEvent(purchaseId, status, message) {
  await sql`
    INSERT INTO purchase_events (purchase_id, status, message)
    VALUES (${purchaseId}, ${status}, ${message ? String(message).slice(0, 400) : null})
  `;
}

export async function getPurchase(id, userId) {
  await ensureSchema();
  const rows = await sql`
    SELECT id, msisdn, offer_ref, offer_name, amount::float AS amount, status, reference, provider_ref, message, created_at, updated_at
    FROM offer_purchases WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `;
  if (!rows[0]) return null;
  const events = await sql`
    SELECT status, message, created_at FROM purchase_events WHERE purchase_id = ${id} ORDER BY id
  `;
  return { ...rows[0], events };
}

export async function listPurchases(userId, limit = 25) {
  await ensureSchema();
  return sql`
    SELECT id, msisdn, offer_name, amount::float AS amount, status, reference, created_at
    FROM offer_purchases WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}
  `;
}
