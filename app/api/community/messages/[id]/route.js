import { NextResponse } from 'next/server';
import { ensureCommunity, currentUser, membership, asInt, sql } from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/messages/:id
//
// Delete is a soft delete: `deleted_at` is stamped and the body is blanked, so
// the bubble stays in the conversation as "This message was deleted" and the
// reply quotes pointing at it still resolve. A hard delete would silently shift
// what every receipt and quote refer to.
//
// Who may delete: the author, always. A group owner or admin, for moderation.
export async function DELETE(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const messageId = asInt(id);
    const rows = await sql`
      SELECT id, chat_id, sender_id, deleted_at FROM com_messages WHERE id = ${messageId} LIMIT 1
    `;
    const message = rows[0];
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    const mine = await membership(message.chat_id, me.id);
    if (!mine) return NextResponse.json({ error: 'You are not in this conversation' }, { status: 403 });

    const canModerate = mine.role === 'owner' || mine.role === 'admin';
    if (message.sender_id !== me.id && !canModerate) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });
    }
    if (message.deleted_at) return NextResponse.json({ ok: true, already: true });

    await sql`UPDATE com_messages SET deleted_at = NOW(), body = '' WHERE id = ${messageId}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[community/message:DELETE]', e?.message || e);
    return NextResponse.json({ error: 'Could not delete that message' }, { status: 500 });
  }
}
