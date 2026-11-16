import { NextResponse } from 'next/server';
import sql from '../../../lib/database';
import { ipRateLimit, clientIp } from '../../../lib/ip-limiter';
import { optionalUser, displayNameOf } from '@/lib/api/session';
import { ensureInteractions, reactionSummary, commentCounts } from '@/lib/testimonials';

export const dynamic = 'force-dynamic';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      message TEXT NOT NULL,
      approved BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  // Who wrote it, when they were signed in. Reviews are public by name, but the
  // photo that sits beside a name should be the one its owner chose — which
  // means remembering the account, not just the typed name.
  await sql`ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS user_id INTEGER`;
}

// GET testimonials with pagination — ?offset=0&limit=6
//
// Only `approved = true` rows are public. Nothing sets that flag to false on
// writing any more (reviews publish themselves), so the filter now means "not
// withdrawn" — it is how an admin takes a review down without deleting it.
export async function GET(request) {
  try {
    await ensureTable();

    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '6', 10)));

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM testimonials WHERE approved = true
    `;

    const testimonials = await sql`
      SELECT t.id, t.name, t.rating, t.message, t.created_at,
             t.user_id,
             (u.avatar IS NOT NULL AND u.avatar <> '') AS has_photo,
             u.avatar_at
      FROM testimonials t
      LEFT JOIN users u ON u.id = t.user_id
      WHERE t.approved = true
      ORDER BY t.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [avg] = await sql`
      SELECT ROUND(AVG(rating)::numeric, 2) AS avg, COUNT(*)::int AS total FROM testimonials WHERE approved = true
    `;

    // The client only needs to know whether a photo exists and its version; the
    // bytes come from /api/users/[id]/avatar.
    const viewer = await optionalUser();
    const ids = testimonials.map((t) => t.id);
    let reactions = {};
    let comments = {};
    try {
      await ensureInteractions();
      [reactions, comments] = await Promise.all([reactionSummary(ids, viewer?.id), commentCounts(ids)]);
    } catch {
      // a review without its counters is still a review
    }

    const shaped = testimonials.map((t) => ({
      ...t,
      avatar_url: t.has_photo && t.user_id
        ? `/api/users/${t.user_id}/avatar${t.avatar_at ? `?v=${new Date(t.avatar_at).getTime()}` : ''}`
        : null,
      likes: reactions[t.id]?.likes || 0,
      dislikes: reactions[t.id]?.dislikes || 0,
      my_reaction: reactions[t.id]?.mine || null,
      comment_count: comments[t.id] || 0,
    }));

    return NextResponse.json({
      testimonials: shaped,
      total: count,
      avg_rating: avg.avg !== null ? Number(avg.avg) : null,
      rating_count: avg.total || 0,
    });
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

// POST a new testimonial
//
// Published immediately: the site owner asked for reviews to go live on submit
// rather than wait for approval. The guardrail that replaces moderation is a
// per-IP burst limit, because an open write endpoint on a page that advertises
// hosting is a target for link spam. Five an hour from one address is far above
// what a real customer needs and far below what a flood needs.
export async function POST(request) {
  try {
    // A review is public and signed. The name on it comes from the account, so
    // there is nothing to type and nothing to impersonate.
    const user = await optionalUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in to post a review.' }, { status: 401 });
    }
    await ensureTable();

    const limit = ipRateLimit(clientIp(request), { max: 5, windowMs: 60 * 60 * 1000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'That is a lot of reviews in one go. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json();
    const { rating, message } = body;
    // Whatever the browser sends for a name is ignored: the account is the
    // identity, so a review cannot be signed with somebody else's name.
    const name = displayNameOf(user);

    if (!rating || !message) {
      return NextResponse.json({ error: 'A rating and a message are required.' }, { status: 400 });
    }

    const ratingNum = parseInt(rating, 10);
    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }
    if (message.trim().length < 10 || message.trim().length > 1000) {
      return NextResponse.json({ error: 'Message must be between 10 and 1000 characters.' }, { status: 400 });
    }

    // approved = true: it is live the moment this returns.
    const [testimonial] = await sql`
      INSERT INTO testimonials (name, rating, message, approved, user_id)
      VALUES (${name.trim()}, ${ratingNum}, ${message.trim()}, true, ${user?.id ?? null})
      RETURNING id, name, rating, message, created_at
    `;

    return NextResponse.json(
      { testimonial, message: 'Thank you — your review is live.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to save testimonial:', error);
    return NextResponse.json({ error: 'Failed to save testimonial.' }, { status: 500 });
  }
}
