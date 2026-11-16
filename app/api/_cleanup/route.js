// One-shot cleanup. TEMPORARY — deleted in the next commit.
//
// A verification request of mine landed on the previous build before it flipped,
// and created a review signed "Hacker". This removes exactly that row: it is
// scoped by id AND message text, so it cannot touch anything else, and the token
// below is the only way in.
import { NextResponse } from 'next/server';
import { sql } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

const TOKEN = 'mz-clean-7f3a91c4e2b8';
const ID = 5;
const MESSAGE = 'anonymous review attempt here';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('t') !== TOKEN) {
    return NextResponse.json({ error: 'nope' }, { status: 404 });
  }
  const rows = await sql`
    DELETE FROM testimonials
    WHERE id = ${ID} AND message = ${MESSAGE}
    RETURNING id, name, message
  `;
  return NextResponse.json({ removed: rows });
}
