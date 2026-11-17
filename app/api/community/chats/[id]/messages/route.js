import { NextResponse } from 'next/server';
import {
  ensureCommunity, currentUser, membership, membersOf, messagesIn, postMessage,
  shapeMany, messageById, cleanBody, asInt, sql, MAX_BODY,
} from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/chats/:id/messages
//
//   GET  ?before=<id>   one page of history going back (60 at a time)
//   POST { body, replyTo }   send; the row comes back shaped and ready to render
//
// Sending is the only write path that creates customer content, so it is the one
// that is checked hardest: membership, length, a reply target that belongs to
// this chat, and a light flood guard.

const FLOOD_WINDOW_SECONDS = 8;
const FLOOD_MAX = 12;

export async function GET(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const chatId = asInt(id);
    const mine = await membership(chatId, me.id);
    if (!mine) return NextResponse.json({ error: 'You are not in this conversation' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const before = asInt(searchParams.get('before')) || 2147483647;

    const [rows, members] = await Promise.all([
      messagesIn(chatId, { before, limit: 60 }),
      membersOf(chatId),
    ]);

    return NextResponse.json({
      messages: await shapeMany(rows, { meId: me.id, members }),
      more: rows.length >= 60,
    });
  } catch (e) {
    console.error('[community/messages:GET]', e?.message || e);
    return NextResponse.json({ error: 'Could not load messages' }, { status: 500 });
  }
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

    let payload;
    try { payload = await request.json(); } catch { payload = {}; }

    const raw = String(payload.body == null ? '' : payload.body).replace(/\u0000/g, '').trim();
    if (!raw) return NextResponse.json({ error: 'Type a message first' }, { status: 400 });
    if (raw.length > MAX_BODY) {
      return NextResponse.json(
        { error: `That message is ${raw.length.toLocaleString()} characters — the limit is ${MAX_BODY.toLocaleString()}.` },
        { status: 400 }
      );
    }
    const body = cleanBody(raw);

    // Flood guard: a stuck key or a repost loop should not fill a group.
    const recent = await sql`
      SELECT COUNT(*)::int AS c FROM com_messages
      WHERE chat_id = ${chatId} AND sender_id = ${me.id}
        AND created_at > NOW() - (${FLOOD_WINDOW_SECONDS} * INTERVAL '1 second')
    `;
    if (Number(recent[0]?.c || 0) >= FLOOD_MAX) {
      return NextResponse.json({ error: 'Slow down a moment, then send again' }, { status: 429 });
    }

    let replyTo = asInt(payload.replyTo) || null;
    if (replyTo) {
      const target = await sql`SELECT id FROM com_messages WHERE id = ${replyTo} AND chat_id = ${chatId} LIMIT 1`;
      if (!target[0]) replyTo = null; // the quoted message is gone; send unquoted
    }

    const created = await postMessage(chatId, { senderId: me.id, body, replyTo });

    // Re-read that one row so the response carries the joined sender and quote,
    // exactly as /sync will render it — the optimistic bubble is then replaced by
    // a message that already looks final.
    const [row, members] = await Promise.all([messageById(created.id), membersOf(chatId)]);
    const [message] = await shapeMany([row], { meId: me.id, members });

    return NextResponse.json({ message });
  } catch (e) {
    console.error('[community/messages:POST]', e?.message || e);
    return NextResponse.json({ error: 'Could not send that message' }, { status: 500 });
  }
}
