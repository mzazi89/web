// MZAZI API — POST /api/testimonials/[id]/react  { kind: 'like' | 'dislike' }
//
// One opinion per person per review. Pressing the same one again withdraws it;
// pressing the other switches it. Nobody can inflate a count by tapping twice,
// which is the only reason a like number means anything.
import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api/session';
import { ensureInteractions, setReaction } from '@/lib/testimonials';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const user = await optionalUser();
  if (!user) return NextResponse.json({ error: 'Sign in to react' }, { status: 401 });

  const id = Number(params?.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
    const counts = await setReaction(id, user.id, kind);
    return NextResponse.json(counts);
  } catch (e) {
    console.error('[mzazi] reaction failed:', e.message);
    return NextResponse.json({ error: 'Could not save that reaction' }, { status: 500 });
  }
}
