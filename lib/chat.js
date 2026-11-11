// MZAZI TECH — support chat.
//
// One thread per account, two participants: the customer and whoever is on the
// admin side. Rows are never edited or deleted, so the conversation is also the
// audit trail when a payment dispute starts.
//
// Table is created on first use; nothing else in the platform reads it.

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

let ready = false;

export async function ensureChat() {
  if (ready) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        sender VARCHAR(8) NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_by_admin BOOLEAN DEFAULT false,
        read_by_user BOOLEAN DEFAULT false
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON chat_messages (user_id, id)`;
    ready = true;
  } catch (e) {
    console.error('[chat] could not ensure table:', e.message);
  }
}

export const clean = (v) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 1200);

export async function threadFor(userId, after = 0) {
  await ensureChat();
  return sql`
    SELECT id, sender, body, created_at, read_by_user
    FROM chat_messages
    WHERE user_id = ${userId} AND id > ${after}
    ORDER BY id ASC
    LIMIT 200
  `;
}

export async function postMessage(userId, sender, body) {
  await ensureChat();
  const rows = await sql`
    INSERT INTO chat_messages (user_id, sender, body, read_by_user, read_by_admin)
    VALUES (${userId}, ${sender}, ${body}, ${sender === 'admin'}, ${sender === 'user'})
    RETURNING id, sender, body, created_at
  `;
  return rows[0];
}
