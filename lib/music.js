// MZAZI — download centre.
//
// Playing is free and never touches a server: the page embeds the video. A
// download is the paid part, and it is gated by a pass that lives in Postgres,
// checked on every request — a pass is a row with an expiry, not a link anyone
// can forward.
//
// The extractor is isolated in `openAudio()`: when YouTube changes something,
// exactly one function breaks, and the page can say so instead of failing
// silently.
import { sql } from '@/lib/wallet';
// ESM-only package: it has to be a static import even though it stays external.
import { Ytdl } from '@distube/ytdl-core';
import { salePrice } from '@/lib/currency';

let searcher = null;
let extractor = null;

async function loadSearch() {
  if (!searcher) searcher = require('yt-search');
  return searcher;
}

async function loadExtractor() {
  if (!extractor) extractor = new Ytdl();
  return extractor;
}

/** Search returns plain data; nothing is cached, because songs are not stock. */
export async function search(query) {
  const q = String(query || '').trim().slice(0, 80);
  if (q.length < 2) return [];
  const yt = await loadSearch();
  const res = await yt(q);
  return (res?.videos || []).slice(0, 12).map((v) => ({
    id: v.videoId,
    title: v.title,
    author: v.author?.name || '',
    seconds: v.seconds || 0,
    thumb: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
  }));
}

export async function ensurePasses() {
  await sql`
    CREATE TABLE IF NOT EXISTS music_passes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      tier VARCHAR(16) NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      reference VARCHAR(80) UNIQUE NOT NULL,
      starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_mp_user ON music_passes(user_id, expires_at)`;
}

export const TIERS = {
  day: { label: 'A day', hours: 24, price: 30 },
  week: { label: 'A week', hours: 24 * 7, price: 100 },
  month: { label: 'A month', hours: 24 * 30, price: 300 },
};

export async function activePass(userId) {
  if (!userId) return null;
  await ensurePasses();
  const [row] = await sql`
    SELECT tier, expires_at FROM music_passes
    WHERE user_id = ${userId} AND expires_at > CURRENT_TIMESTAMP
    ORDER BY expires_at DESC LIMIT 1
  `;
  return row || null;
}

/** Buy extends from now, or from the current expiry if a pass is still running. */
export async function buyPass(userId, tier) {
  const spec = TIERS[tier];
  if (!spec) throw Object.assign(new Error('Unknown plan'), { code: 'INPUT' });
  await ensurePasses();

  const amount = salePrice(spec.price);
  const [wallet] = await sql`SELECT balance::float AS balance FROM wallet WHERE user_id = ${userId} FOR UPDATE`;
  const balance = Number(wallet?.balance || 0);
  if (balance < amount) {
    throw Object.assign(new Error(`You need ${amount - balance} more in your wallet.`), { code: 'FUNDS' });
  }

  const reference = `MUS-${Date.now().toString(36).toUpperCase()}`;
  await sql`UPDATE wallet SET balance = balance - ${amount}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}`;
  await sql`
    INSERT INTO wallet_transactions (user_id, type, amount, description, status, reference, payment_method)
    VALUES (${userId}, 'debit', ${amount}, ${`Download pass — ${spec.label}`}, 'success', ${reference}, 'wallet')
  `;
  const [pass] = await sql`
    INSERT INTO music_passes (user_id, tier, amount, reference, expires_at)
    VALUES (${userId}, ${tier}, ${amount}, ${reference},
            GREATEST(CURRENT_TIMESTAMP, COALESCE(
              (SELECT MAX(expires_at) FROM music_passes WHERE user_id = ${userId} AND expires_at > CURRENT_TIMESTAMP),
              CURRENT_TIMESTAMP)) + (${spec.hours} * INTERVAL '1 hour'))
    RETURNING tier, expires_at, amount
  `;
  return pass;
}

/** An audio stream plus the filename the phone will show. */
export async function openAudio(videoId) {
  const id = String(videoId || '').replace(/[^A-Za-z0-9_-]/g, '');
  if (!id) throw new Error('bad id');
  const y = await loadExtractor();
  const url = `https://www.youtube.com/watch?v=${id}`;
  const info = await y.getInfo(url);
  const title = String(info?.videoDetails?.title || 'MZAZI audio').replace(/[\\/:*?"<>|]/g, '').slice(0, 80);
  const stream = await y.download(url, { quality: 'highestaudio' });
  return { stream, title };
}
