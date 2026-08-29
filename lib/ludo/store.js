// ─────────────────────────────────────────────────────────────────────────────
// MZAZI LUDO — game persistence (Neon) + in-memory TTL cache.
// Games are stored as JSONB state; the cache avoids a DB round-trip for
// frequent status polls. A WebSocket layer can replace the polling later —
// the store API stays the same.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const TTL_MS = 90_000; // cache lifetime
const STALE_MS = 24 * 60 * 60 * 1000; // games untouched for 24h are removed
const cache = new Map(); // gameId -> { state, ts }

let schemaPromise = null;
export function ensureLudoSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS ludo_games (
          id VARCHAR(64) PRIMARY KEY,
          room_code VARCHAR(10) UNIQUE NOT NULL,
          state JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_ludo_games_room ON ludo_games(room_code)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_ludo_games_updated ON ludo_games(updated_at)`;
    })().catch((e) => { schemaPromise = null; throw e; });
  }
  return schemaPromise;
}

export function newRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[crypto.randomInt(chars.length)];
  return out;
}

export function newId() {
  return crypto.randomBytes(16).toString('hex');
}

export function newToken() {
  return crypto.randomBytes(24).toString('hex');
}

export async function saveGame(state) {
  await ensureLudoSchema();
  cache.set(state.id, { state, ts: Date.now() });
  await sql`
    INSERT INTO ludo_games (id, room_code, state, updated_at)
    VALUES (${state.id}, ${state.roomCode}, ${JSON.stringify(state)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
  `;
}

export async function loadGame(id) {
  await ensureLudoSchema();
  const hit = cache.get(id);
  if (hit && Date.now() - hit.ts < TTL_MS) return JSON.parse(JSON.stringify(hit.state));

  const rows = await sql`SELECT state FROM ludo_games WHERE id = ${id} LIMIT 1`;
  if (!rows.length) return null;

  const state = rows[0].state; // neon returns JSONB as parsed object
  if (Date.now() - new Date(state.updatedAt || 0).getTime() > STALE_MS) {
    await sql`DELETE FROM ludo_games WHERE id = ${id}`;
    cache.delete(id);
    return null;
  }
  cache.set(id, { state, ts: Date.now() });
  return JSON.parse(JSON.stringify(state));
}

export async function findByRoom(roomCode) {
  await ensureLudoSchema();
  const rows = await sql`SELECT id FROM ludo_games WHERE room_code = ${roomCode} LIMIT 1`;
  return rows.length ? loadGame(rows[0].id) : null;
}

// Lazy cleanup of very old games (called occasionally)
let cleanupCounter = 0;
export async function maybeCleanup() {
  cleanupCounter += 1;
  if (cleanupCounter % 25 !== 0) return;
  try {
    await sql`DELETE FROM ludo_games WHERE updated_at < NOW() - INTERVAL '24 hours'`;
    for (const [k, v] of cache) {
      if (Date.now() - v.ts > STALE_MS) cache.delete(k);
    }
  } catch { /* non-fatal */ }
}
