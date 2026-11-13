// MZAZI API — /api/account/avatar
//
// The customer's profile photo. Three verbs, one file:
//   GET    → the signed-in user's own photo, as image bytes
//   POST   → { image: "data:image/jpeg;base64,…" } replaces it
//   DELETE → removes it, back to initials
//
// Where the bytes live: in `users.avatar`, as base64 inside a data URL. That is
// the same place bot files already live (see admin's /api/admin/bot-files), so
// this feature needs no bucket, no runtime that can hold a mutable disk, and no
// new service. The browser crops and re-encodes to 512 px before uploading, so
// a "photo from the camera roll" (4–8 MB) arrives here as ~40–90 KB.
//
// Serving is deliberately not inline: the page embeds /api/account/avatar?v=…
// so the markup stays small and the browser caches it, and the version query
// changes only when the photo does.
//
// Safety: the type is sniffed from the file's own magic bytes, never trusted
// from the client; SVG and GIF are refused (SVG can carry script, and a moving
// avatar is not worth the bandwidth). The response carries nosniff and
// private caching, so a photo is never cached by a shared proxy for someone
// else's session.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '@/lib/api/web-auth';
import { ensureAvatarColumns } from '@/lib/avatar';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

const MAX_BYTES = 1_500_000; // decoded ceiling; the client sends far less
const MAX_BODY = 2_100_000; // base64 is ~4/3 of raw, plus the JSON envelope

// ── schema ───────────────────────────────────────────────────────────────────
// `avatar` and `avatar_at` are created on demand (see lib/avatar.js) so the first
// customer to press Upload does not depend on anybody having run the schema
// bootstrap with INIT_DB_KEY.
// ── what a photo may be ──────────────────────────────────────────────────────
const SIGNATURES = [
  {
    mime: 'image/jpeg',
    test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    test: (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/webp',
    test: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

function sniff(bytes) {
  return SIGNATURES.find((s) => s.test(bytes)) || null;
}

/** Splits "data:image/jpeg;base64,AAAA" (or a bare base64 string) into bytes. */
function decode(input) {
  if (typeof input !== 'string' || !input) return null;
  const comma = input.indexOf(',');
  const body = input.startsWith('data:') && comma !== -1 ? input.slice(comma + 1) : input;
  // Whitespace is legal in base64 but never in what we produce; strip it so a
  // copy-paste cannot fail for a cosmetic reason.
  const clean = body.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) return null;
  const bytes = Buffer.from(clean, 'base64');
  if (!bytes.length || bytes.length > MAX_BYTES) return null;
  return bytes;
}

function unauthorized(e) {
  if (e && (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  return null;
}

// ── GET: the photo itself ────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const user = await requireUser();
    await ensureAvatarColumns();

    const rows = await sql`
      SELECT avatar, avatar_at FROM users WHERE id = ${user.id} LIMIT 1
    `;
    const row = rows[0];
    if (!row || !row.avatar) {
      return NextResponse.json({ error: 'No photo set' }, { status: 404 });
    }

    const bytes = decode(row.avatar);
    if (!bytes) return NextResponse.json({ error: 'No photo set' }, { status: 404 });

    const type = sniff(bytes) || { mime: 'image/jpeg' };
    const stamp = row.avatar_at ? new Date(row.avatar_at).getTime() : bytes.length;
    const etag = `"av-${user.id}-${bytes.length}-${stamp}"`;

    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': type.mime,
        'Content-Length': String(bytes.length),
        'Cache-Control': 'private, max-age=300, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
        ETag: etag,
      },
    });
  } catch (e) {
    const denied = unauthorized(e);
    if (denied) return denied;
    console.error('[account] avatar read failed:', e.message);
    return NextResponse.json({ error: 'Could not load the photo' }, { status: 500 });
  }
}

// ── POST: set or replace it ──────────────────────────────────────────────────
export async function POST(request) {
  try {
    const user = await requireUser();

    const declared = Number(request.headers.get('content-length') || 0);
    if (declared && declared > MAX_BODY) {
      return NextResponse.json({ error: 'That photo is too large — 2 MB is the limit.' }, { status: 413 });
    }

    const body = await request.json().catch(() => ({}));
    const bytes = decode(body.image);
    if (!bytes) {
      return NextResponse.json(
        { error: 'That file is not a photo we can use. Choose a JPG, PNG or WebP under 2 MB.' },
        { status: 400 }
      );
    }

    const type = sniff(bytes);
    if (!type) {
      return NextResponse.json(
        { error: 'That file is not a photo we can use. Choose a JPG, PNG or WebP.' },
        { status: 415 }
      );
    }

    await ensureAvatarColumns();
    const stored = `data:${type.mime};base64,${bytes.toString('base64')}`;
    const rows = await sql`
      UPDATE users
      SET avatar = ${stored}, avatar_at = NOW()
      WHERE id = ${user.id}
      RETURNING avatar_at
    `;
    const at = rows[0]?.avatar_at ? new Date(rows[0].avatar_at).getTime() : Date.now();

    return NextResponse.json({
      message: 'Photo saved',
      avatarUrl: `/api/account/avatar?v=${at}`,
      bytes: bytes.length,
      type: type.mime,
    });
  } catch (e) {
    const denied = unauthorized(e);
    if (denied) return denied;
    console.error('[account] avatar save failed:', e.message);
    return NextResponse.json({ error: 'Could not save the photo' }, { status: 500 });
  }
}

// ── DELETE: back to initials ─────────────────────────────────────────────────
export async function DELETE() {
  try {
    const user = await requireUser();
    await ensureAvatarColumns();
    await sql`UPDATE users SET avatar = NULL, avatar_at = NULL WHERE id = ${user.id}`;
    return NextResponse.json({ message: 'Photo removed' });
  } catch (e) {
    const denied = unauthorized(e);
    if (denied) return denied;
    console.error('[account] avatar delete failed:', e.message);
    return NextResponse.json({ error: 'Could not remove the photo' }, { status: 500 });
  }
}
