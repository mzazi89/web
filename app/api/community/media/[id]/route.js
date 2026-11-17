import { NextResponse } from 'next/server';
import { ensureCommunity, currentUser, membership, mediaRow, asInt } from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/media/:messageId
//
// The bytes behind a photo or a voice note. Two things matter:
//
//   * it is a guarded read, not a public file. The caller must hold a membership
//     row for the chat the attachment belongs to, so an id cannot be walked to
//     reach somebody else's picture or voice.
//   * `Cache-Control: private` — the browser may keep it, a shared proxy may not.
//     Neutering that is how a chat attachment ends up in a CDN cache served to
//     the next person who guesses the URL.
export async function GET(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const messageId = asInt(id);
    const media = await mediaRow(messageId);
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const mine = await membership(media.chat_id, me.id);
    if (!mine) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const bytes = Buffer.from(String(media.bytes || ''), 'base64');
    if (!bytes.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const etag = `"cm-${messageId}-${bytes.length}"`;
    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': media.mime || 'application/octet-stream',
        'Content-Length': String(bytes.length),
        'Cache-Control': 'private, max-age=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
        // A photo opens in place; a recording may be downloaded if the user asks.
        'Content-Disposition': media.kind === 'audio' ? 'inline; filename="voice-note"' : 'inline',
        ETag: etag,
      },
    });
  } catch (e) {
    console.error('[community/media:GET]', e?.message || e);
    return NextResponse.json({ error: 'Could not load that attachment' }, { status: 500 });
  }
}
