import { NextResponse } from 'next/server';
import {
  ensureCommunity, currentUser, membership, messageById, membersOf, shapeMany,
  hideForUser, deleteForEveryone, editMessage, cleanBody, asInt, sql, MAX_BODY,
} from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/messages/:id
//
//   PATCH   { body }          edit your own text
//   DELETE  ?scope=everyone   soft delete (author or a group moderator)
//   DELETE  ?scope=me         hide it from your own history only
//
// Two deletes, two meanings, and they must not be confused: "for everyone" stamps
// deleted_at so the bubble stays as "This message was deleted" for the whole chat,
// while "for me" writes nothing to the message at all — a hide row removes it from
// this person's reads. Getting that backwards would either erase somebody's
// history or leave a message the sender believed they had removed.

export async function PATCH(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const messageId = asInt(id);
    const rows = await sql`
      SELECT id, chat_id, sender_id, kind, deleted_at FROM com_messages WHERE id = ${messageId} LIMIT 1
    `;
    const message = rows[0];
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    const mine = await membership(message.chat_id, me.id);
    if (!mine) return NextResponse.json({ error: 'You are not in this conversation' }, { status: 403 });
    if (message.sender_id !== me.id) {
      return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 });
    }
    if (message.deleted_at) return NextResponse.json({ error: 'That message was deleted' }, { status: 400 });
    if (message.kind !== 'text') {
      return NextResponse.json({ error: 'Only text can be edited' }, { status: 400 });
    }

    let payload;
    try { payload = await request.json(); } catch { payload = {}; }
    const body = cleanBody(payload.body);
    if (!body) return NextResponse.json({ error: 'Type something first' }, { status: 400 });
    if (body.length > MAX_BODY) {
      return NextResponse.json({ error: `That message is too long — the limit is ${MAX_BODY.toLocaleString()}.` }, { status: 400 });
    }

    await editMessage(messageId, body);

    const [fresh, members] = await Promise.all([messageById(messageId), membersOf(message.chat_id)]);
    const [shaped] = await shapeMany([{ ...fresh, edited_at: new Date() }], { meId: me.id, members });
    return NextResponse.json({ message: { ...shaped, edited: true } });
  } catch (e) {
    console.error('[community/message:PATCH]', e?.message || e);
    return NextResponse.json({ error: 'Could not edit that message' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const messageId = asInt(id);
    const scope = new URL(request.url).searchParams.get('scope') === 'me' ? 'me' : 'everyone';

    const rows = await sql`
      SELECT id, chat_id, sender_id, deleted_at FROM com_messages WHERE id = ${messageId} LIMIT 1
    `;
    const message = rows[0];
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    const mine = await membership(message.chat_id, me.id);
    if (!mine) return NextResponse.json({ error: 'You are not in this conversation' }, { status: 403 });

    if (scope === 'me') {
      await hideForUser(messageId, me.id);
      return NextResponse.json({ ok: true, scope: 'me' });
    }

    const canModerate = mine.role === 'owner' || mine.role === 'admin';
    if (message.sender_id !== me.id && !canModerate) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });
    }
    if (message.deleted_at) return NextResponse.json({ ok: true, already: true });

    await deleteForEveryone(messageId);
    return NextResponse.json({ ok: true, scope: 'everyone' });
  } catch (e) {
    console.error('[community/message:DELETE]', e?.message || e);
    return NextResponse.json({ error: 'Could not delete that message' }, { status: 500 });
  }
}
