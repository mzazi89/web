// MZAZI TECH — login history.
//
// Recorded at the one place a session can be created (/api/auth/login), stored
// per user, read back only by that user. The table is created on first use
// rather than in the 900-line bootstrap, because nothing else depends on it —
// a failed CREATE must never be able to block a login.

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

let ready = false;

async function ensureTable() {
  if (ready) return;
  await sql`
    CREATE TABLE IF NOT EXISTS login_events (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      ip VARCHAR(64),
      user_agent VARCHAR(255),
      status VARCHAR(16) NOT NULL DEFAULT 'success',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS login_events_user_idx ON login_events (user_id, created_at DESC)`;
  ready = true;
}

// Never throws: history is useful, but it is not worth failing a login over.
export async function recordLogin({ userId, ip, userAgent, status = 'success' }) {
  if (!userId) return;
  try {
    await ensureTable();
    await sql`
      INSERT INTO login_events (user_id, ip, user_agent, status)
      VALUES (${userId}, ${String(ip || '').slice(0, 64) || null}, ${String(userAgent || '').slice(0, 255) || null}, ${status})
    `;
    // Keep the table small; ten rows per account is plenty for "was this me?".
    await sql`
      DELETE FROM login_events
      WHERE user_id = ${userId}
        AND id NOT IN (
          SELECT id FROM login_events WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 10
        )
    `;
  } catch (e) {
    console.error('[login-history] could not record:', e.message);
  }
}
