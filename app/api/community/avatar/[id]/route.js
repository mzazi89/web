import { NextResponse } from 'next/server';
import { ensureCommunity, currentUser, asInt, sql } from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/avatar/:userId
//
// The photo another member uploaded from their account page, so a chat shows the
// face instead of initials. /api/account/avatar only ever answers for the caller,
// which is correct for the profile page and useless for a member list.
//
// Signed-in only, and the bytes are sniffed from the file itself — a stored
// `data:text/html` would otherwise be served back as a page on this origin.
const SIGNATURES = [
  { mime: 'image/jpeg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', test: (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    mime: 'image/webp',
    test: (b) => b.length > 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

function decode(input) {
  if (typeof input !== 'string' || !input) return null;
  const comma = input.indexOf(',');
  const body = input.startsWith('data:') && comma !== -1 ? input.slice(comma + 1) : input;
  const clean = body.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) return null;
  const bytes = Buffer.from(clean, 'base64');
  return bytes.length && bytes.length <= 2_000_000 ? bytes : null;
}

export async function GET(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const userId = asInt(id);
    if (!userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const rows = await sql`
      SELECT avatar, avatar_at FROM users WHERE id = ${userId} LIMIT 1
    `;
    const row = rows[0];
    const bytes = row ? decode(row.avatar) : null;
    if (!bytes) return NextResponse.json({ error: 'No photo set' }, { status: 404 });

    const type = SIGNATURES.find((s) => s.test(bytes));
    if (!type) return NextResponse.json({ error: 'No photo set' }, { status: 404 });

    const stamp = row.avatar_at ? new Date(row.avatar_at).getTime() : bytes.length;
    const etag = `"cm-av-${userId}-${bytes.length}-${stamp}"`;
    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': type.mime,
        'Content-Length': String(bytes.length),
        'Cache-Control': 'private, max-age=3600, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        ETag: etag,
      },
    });
  } catch (e) {
    console.error('[community/avatar]', e?.message || e);
    return NextResponse.json({ error: 'Could not load that photo' }, { status: 500 });
  }
}
