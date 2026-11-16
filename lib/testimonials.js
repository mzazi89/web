// MZAZI — reactions and comments on reviews.
//
// Two tables, because the two interactions are genuinely different: a reaction
// is a state (one per person per review, changeable), a comment is a record (a
// sequence of things said, kept). Storing them together is how a "like" ends up
// with a timestamp nobody needs.
import { sql } from '@/lib/wallet';

let ready = null;

export function ensureInteractions() {
  if (ready) return ready;
  ready = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS testimonial_reactions (
        id SERIAL PRIMARY KEY,
        testimonial_id INTEGER NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind VARCHAR(8) NOT NULL CHECK (kind IN ('like', 'dislike')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (testimonial_id, user_id)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS testimonial_comments (
        id SERIAL PRIMARY KEY,
        testimonial_id INTEGER NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        body TEXT NOT NULL,
        hidden BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_tc_review ON testimonial_comments(testimonial_id, created_at)`;
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

/** Counts keyed by review id, plus the caller's own reaction. */
export async function reactionSummary(ids, userId) {
  if (!ids.length) return {};
  const rows = await sql`
    SELECT testimonial_id,
           COUNT(*) FILTER (WHERE kind = 'like')::int    AS likes,
           COUNT(*) FILTER (WHERE kind = 'dislike')::int AS dislikes,
           MAX(CASE WHEN user_id = ${userId ?? -1} THEN kind END) AS mine
    FROM testimonial_reactions
    WHERE testimonial_id = ANY(${ids})
    GROUP BY testimonial_id
  `;
  const out = {};
  for (const r of rows) out[r.testimonial_id] = { likes: r.likes, dislikes: r.dislikes, mine: r.mine || null };
  return out;
}

export async function commentCounts(ids) {
  if (!ids.length) return {};
  const rows = await sql`
    SELECT testimonial_id, COUNT(*)::int AS n
    FROM testimonial_comments
    WHERE hidden = false AND testimonial_id = ANY(${ids})
    GROUP BY testimonial_id
  `;
  const out = {};
  for (const r of rows) out[r.testimonial_id] = r.n;
  return out;
}

/** Toggle: same kind again removes the reaction, the other kind switches it. */
export async function setReaction(reviewId, userId, kind) {
  const [existing] = await sql`
    SELECT kind FROM testimonial_reactions
    WHERE testimonial_id = ${reviewId} AND user_id = ${userId} LIMIT 1
  `;
  if (existing?.kind === kind) {
    await sql`DELETE FROM testimonial_reactions WHERE testimonial_id = ${reviewId} AND user_id = ${userId}`;
  } else {
    await sql`
      INSERT INTO testimonial_reactions (testimonial_id, user_id, kind)
      VALUES (${reviewId}, ${userId}, ${kind})
      ON CONFLICT (testimonial_id, user_id) DO UPDATE SET kind = EXCLUDED.kind
    `;
  }
  const [row] = await sql`
    SELECT COUNT(*) FILTER (WHERE kind = 'like')::int AS likes,
           COUNT(*) FILTER (WHERE kind = 'dislike')::int AS dislikes
    FROM testimonial_reactions WHERE testimonial_id = ${reviewId}
  `;
  const [mine] = await sql`
    SELECT kind FROM testimonial_reactions WHERE testimonial_id = ${reviewId} AND user_id = ${userId} LIMIT 1
  `;
  return { likes: row.likes, dislikes: row.dislikes, mine: mine?.kind || null };
}
