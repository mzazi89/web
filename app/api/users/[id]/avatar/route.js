// MZAZI API — GET /api/users/[id]/avatar
//
// A customer's profile photo, for places that show them to other people: a
// testimonial, a review, a contributor strip. Distinct from /api/account/avatar,
// which is the signed-in owner's own copy and refuses everybody else.
//
// This one is deliberately public but narrow: it returns an image or a 404, and
// nothing about the account — no name, no email, no id echo. Photos are already
// published beside the review that carries them.
import { NextResponse } from 'next/server';
import { sql } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

const CACHE = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

export async function GET(_request, { params }) {
  const id = Number(params?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let row;
  try {
    [row] = await sql`SELECT avatar FROM users WHERE id = ${id} LIMIT 1`;
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const stored = String(row?.avatar || '');
  const comma = stored.indexOf(',');
  if (!stored.startsWith('data:') || comma < 0) {
    return NextResponse.json({ error: 'No photo' }, { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } });
  }

  const meta = stored.slice(5, comma);
  const [mime] = meta.split(';');
  if (!/^image\/(jpeg|png|webp)$/.test(mime)) {
    return NextResponse.json({ error: 'No photo' }, { status: 404 });
  }

  const bytes = Buffer.from(stored.slice(comma + 1), 'base64');
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Length': String(bytes.length),
      'Cache-Control': CACHE,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
