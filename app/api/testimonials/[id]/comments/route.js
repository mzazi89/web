// MZAZI API — comments on a review.
//
//   GET  ?offset=0&limit=20 → the public thread, oldest first
//   POST { body }           → add to it (signed in, 500 chars, rate-limited)
//
// Anyone may read; only signed-in customers may write, because a comment thread
// with no identity behind it is a spam surface with a reply box drawn on it.
import { NextResponse } from 'next/server';
import { optionalUser, displayNameOf } from '@/lib/api/session';
import { sql } from '@/lib/wallet';
import { ensureInteractions, commentReactionSummary } from '@/lib/testimonials';
import { ipRateLimit, clientIp } from '@/lib/ip-limiter';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const id = Number(params?.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  try {
    await ensureInteractions();
    const rows = await sql`
      SELECT c.id, c.name, c.body, c.created_at, c.user_id, c.parent_id,
             p.name AS reply_to,
             (u.avatar IS NOT NULL AND u.avatar <> '') AS has_photo,
             u.avatar_at
      FROM testimonial_comments c
      LEFT JOIN testimonial_comments p ON p.id = c.parent_id
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.testimonial_id = ${id} AND c.hidden = false
      ORDER BY c.created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Replies carry the name they answer, so the thread reads like a
    // conversation even though it is stored flat.
    const viewer = await optionalUser();
    let reactions = {};
    try {
      reactions = await commentReactionSummary(rows.map((r) => r.id), viewer?.id);
    } catch {}

    return NextResponse.json({
      comments: rows.map((r) => ({
        id: r.id,
        name: r.name,
        body: r.body,
        created_at: r.created_at,
        parent_id: r.parent_id || null,
        reply_to: r.reply_to || null,
        avatar_url: r.has_photo && r.user_id
          ? `/api/users/${r.user_id}/avatar${r.avatar_at ? `?v=${new Date(r.avatar_at).getTime()}` : ''}`
          : null,
        likes: reactions[r.id]?.likes || 0,
        dislikes: reactions[r.id]?.dislikes || 0,
        my_reaction: reactions[r.id]?.mine || null,
      })),
    });
  } catch (e) {
    console.error('[mzazi] comments read failed:', e.message);
    return NextResponse.json({ error: 'Could not load comments' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const user = await optionalUser();
  if (!user) return NextResponse.json({ error: 'Sign in to comment' }, { status: 401 });

  const id = Number(params?.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // ipRateLimit() answers { allowed }, not { ok } — reading the wrong key made
  // this branch always true, so every comment was refused as "too many".
  const limit = ipRateLimit(clientIp(request), { max: 12, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many comments — try again later.' }, { status: 429 });
  }

  let body = '';
  let parentId = null;
  try {
    const parsed = await request.json();
    body = String(parsed?.body || '').trim();
    parentId = parsed?.parent_id == null ? null : Number(parsed.parent_id);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (body.length < 2 || body.length > 500) {
    return NextResponse.json({ error: 'Comment must be 2–500 characters.' }, { status: 400 });
  }
  if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
    return NextResponse.json({ error: 'Invalid reply target' }, { status: 400 });
  }

  try {
    await ensureInteractions();
    const [review] = await sql`SELECT id FROM testimonials WHERE id = ${id} AND approved = true LIMIT 1`;
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    // A reply must point at a comment on this same review — otherwise a crafted
    // id could graft a reply onto someone else's thread.
    let replyTo = null;
    if (parentId !== null) {
      const [parent] = await sql`
        SELECT id, name FROM testimonial_comments
        WHERE id = ${parentId} AND testimonial_id = ${id} AND hidden = false LIMIT 1
      `;
      if (!parent) return NextResponse.json({ error: 'That comment no longer exists' }, { status: 404 });
      replyTo = parent.name;
    }

    const [row] = await sql`
      INSERT INTO testimonial_comments (testimonial_id, user_id, name, body, parent_id)
      VALUES (${id}, ${user.id}, ${displayNameOf(user)}, ${body}, ${parentId})
      RETURNING id, name, body, created_at, parent_id
    `;
    return NextResponse.json(
      { comment: { ...row, reply_to: replyTo, avatar_url: user.avatar || null, likes: 0, dislikes: 0, my_reaction: null } },
      { status: 201 }
    );
  } catch (e) {
    console.error('[mzazi] comment failed:', e.message);
    return NextResponse.json({ error: 'Could not post that comment' }, { status: 500 });
  }
}
