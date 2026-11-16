// MZAZI API — POST /api/testimonials/[id]/comments/[commentId]/react
//
// Same one-opinion-per-person rule as a review reaction, aimed at a comment. The
// review id is checked alongside the comment id so a comment cannot be reacted
// to through somebody else's thread.
import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api/session';
import { sql } from '@/lib/wallet';
import { ensureInteractions, setCommentReaction } from '@/lib/testimonials';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const user = await optionalUser();
  if (!user) return NextResponse.json({ error: 'Sign in to react' }, { status: 401 });

  const reviewId = Number(params?.id);
  const commentId = Number(params?.commentId);
  if (!Number.isInteger(reviewId) || !Number.isInteger(commentId) || reviewId <= 0 || commentId <= 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let kind = '';
  try {
    ({ kind } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (kind !== 'like' && kind !== 'dislike') {
    return NextResponse.json({ error: 'kind must be like or dislike' }, { status: 400 });
  }

  try {
    await ensureInteractions();
    const [owned] = await sql`
      SELECT id FROM testimonial_comments
      WHERE id = ${commentId} AND testimonial_id = ${reviewId} AND hidden = false LIMIT 1
    `;
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(await setCommentReaction(commentId, user.id, kind));
  } catch (e) {
    console.error('[mzazi] comment reaction failed:', e.message);
    return NextResponse.json({ error: 'Could not save that reaction' }, { status: 500 });
  }
}
