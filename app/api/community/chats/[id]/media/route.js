import { NextResponse } from 'next/server';
import {
  ensureCommunity, currentUser, membership, membersOf, postMessage, attachMedia,
  messageById, shapeMany, asInt,
} from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/chats/:id/media
//
// One endpoint for both kinds of attachment, because they differ only in how the
// bytes are sniffed and how big they may be:
//
//   { kind: 'image', data: 'data:image/jpeg;base64,…', width, height, caption }
//   { kind: 'audio', data: 'data:audio/webm;base64,…', durationMs, caption }
//
// The type is decided from the file's own magic bytes, never from the string the
// client put in front of the comma: a `data:image/png` label on an HTML file is a
// stored-XSS primitive the moment anything renders it inline.
const LIMITS = {
  image: 2_500_000, // decoded bytes; the browser re-encodes to ~200–400 KB
  audio: 3_000_000, // ~60 s of 32 kbps mono opus
};

const IMAGE_SIGNATURES = [
  { mime: 'image/jpeg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', test: (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    mime: 'image/webp',
    test: (b) => b.length > 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

const AUDIO_SIGNATURES = [
  { mime: 'audio/webm', test: (b) => b.length > 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
  { mime: 'audio/ogg', test: (b) => b.length > 4 && b.subarray(0, 4).toString('ascii') === 'OggS' },
  { mime: 'audio/mp4', test: (b) => b.length > 12 && b.subarray(4, 8).toString('ascii') === 'ftyp' },
  { mime: 'audio/mpeg', test: (b) => b.length > 2 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33 },
];

/** "data:image/jpeg;base64,AAAA" → Buffer, or null when it is not base64 at all. */
function decode(input, max) {
  if (typeof input !== 'string' || !input) return null;
  const comma = input.indexOf(',');
  const body = input.startsWith('data:') && comma !== -1 ? input.slice(comma + 1) : input;
  const clean = body.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) return null;
  const bytes = Buffer.from(clean, 'base64');
  if (!bytes.length || bytes.length > max) return null;
  return bytes;
}

export async function POST(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const chatId = asInt(id);
    const mine = await membership(chatId, me.id);
    if (!mine) return NextResponse.json({ error: 'You are not in this conversation' }, { status: 403 });

    const declared = Number(request.headers.get('content-length') || 0);
    if (declared && declared > 4_400_000) {
      return NextResponse.json({ error: 'That file is too large to send.' }, { status: 413 });
    }

    let body;
    try { body = await request.json(); } catch { body = {}; }

    const kind = body.kind === 'audio' ? 'audio' : body.kind === 'image' ? 'image' : null;
    if (!kind) return NextResponse.json({ error: 'Unsupported attachment' }, { status: 400 });

    const bytes = decode(body.data, LIMITS[kind]);
    if (!bytes) {
      return NextResponse.json(
        { error: kind === 'image' ? 'That image is too large or not a JPG, PNG or WebP.' : 'That voice note is too large.' },
        { status: 400 }
      );
    }

    const found = (kind === 'image' ? IMAGE_SIGNATURES : AUDIO_SIGNATURES).find((s) => s.test(bytes));
    if (!found) {
      return NextResponse.json({ error: 'That file type is not allowed here.' }, { status: 415 });
    }

    const caption = String(body.caption || '').replace(/\u0000/g, '').trim().slice(0, 600);
    const durationMs = kind === 'audio' ? Math.min(Math.max(asInt(body.durationMs), 0), 120_000) : null;
    const width = kind === 'image' ? Math.min(asInt(body.width), 8000) || null : null;
    const height = kind === 'image' ? Math.min(asInt(body.height), 8000) || null : null;

    let replyTo = asInt(body.replyTo) || null;
    if (replyTo) {
      const target = await messageById(replyTo);
      if (!target || target.chat_id !== chatId) replyTo = null;
    }

    const created = await postMessage(chatId, {
      senderId: me.id,
      kind,
      body: caption,
      replyTo,
    });

    await attachMedia({
      messageId: created.id,
      chatId,
      kind,
      mime: found.mime,
      bytes: bytes.toString('base64'),
      size: bytes.length,
      width,
      height,
      durationMs,
    });

    const [row, members] = await Promise.all([messageById(created.id), membersOf(chatId)]);
    const [message] = await shapeMany([row], { meId: me.id, members });

    return NextResponse.json({ message });
  } catch (e) {
    console.error('[community/media:POST]', e?.message || e);
    return NextResponse.json({ error: 'Could not send that attachment' }, { status: 500 });
  }
}
