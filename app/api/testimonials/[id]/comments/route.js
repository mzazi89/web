// MZAZI API — comments on a review.
//
//   GET  ?offset=0&limit=20 → the public thread, oldest first
//   POST { body }           → add to it (signed in, 500 chars, rate-limited)
//
// Anyone may read; only signed-in customers may write, because a comment thread
// with no identity behind it is a spam surface with a reply box drawn on it.
import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api/session';
import { sql } from '@/lib/wallet';
import { ensureInteractions } from '@/lib/testimonials';
import { ipRateLimit, clientIp } from '@/lib/ip-limiter';

export const dynamic = 'force-dynamic';

const displayName = (u) =>
  [u.firstname, u.lastname].filter(Boolean).join(' ').trim() || u.username || 'MZAZI customer';

export async function GET(request, { params }) {
  const id = Number(params?.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

  try {
    await ensureInteractions();
    const rows = await sql`
      SELECT c.id, c.name, c.body, c.created_at, c.user_id,
             (u.avatar IS NOT NULL AND u.avatar <> '') AS has_photo,
             u.avatar_at
      FROM testimonial_comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.testimonial_id = ${id} AND c.hidden = false
      ORDER BY c.created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return NextResponse.json({
      comments: rows.map((r) => ({
        id: r.id,
        name: r.name,
        body: r.body,
        created_at: r.created_at,
        avatar_url: r.has_photo && r.user_id
          ? `/api/users/${r.user_id}/avatar${r.avatar_at ? `?v=${new Date(r.avatar_at).getTime()}` : ''}`
          : null,
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

  const limit = ipRateLimit(clientIp(request), { max: 12, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many comments — try again later.' }, { status: 429 });
  }

  let body = '';
  try {
    ({ body } = await request.json());
    body = String(body || '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (body.length < 2 || body.length > 500) {
    return NextResponse.json({ error: 'Comment must be 2–500 characters.' }, { status: 400 });
  }

  try {
    await ensureInteractions();
    const [review] = await sql`SELECT id FROM testimonials WHERE id = ${id} AND approved = true LIMIT 1`;
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    const [row] = await sql`
      INSERT INTO testimonial_comments (testimonial_id, user_id, name, body)
      VALUES (${id}, ${user.id}, ${displayName(user)}, ${body})
      RETURNING id, name, body, created_at
    `;
    return NextResponse.json({ comment: { ...row, avatar_url: user.avatar || null } }, { status: 201 });
  } catch (e) {
    console.error('[mzazi] comment failed:', e.message);
    return NextResponse.json({ error: 'Could not post that comment' }, { status: 500 });
  }
}
