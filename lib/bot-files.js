// MZAZI TECH — bot file entitlements.
//
// `bot_files` is owned by the admin panel (it creates the table on first upload),
// but the storefront needs the purchase ledger that proves who may download a
// paid file. Created here on first use so a fresh database cannot 500 on a sale.

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

let ready = false;

export async function ensureEntitlements() {
  if (ready) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS bot_file_purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        file_id INTEGER NOT NULL,
        amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, file_id)
      )
    `;
    ready = true;
  } catch (e) {
    console.error('[bot-files] could not ensure entitlements:', e.message);
  }
}

export async function ownedFileIds(userId) {
  await ensureEntitlements();
  try {
    const rows = await sql`SELECT file_id FROM bot_file_purchases WHERE user_id = ${userId}`;
    return rows.map((r) => Number(r.file_id));
  } catch {
    return [];
  }
}
