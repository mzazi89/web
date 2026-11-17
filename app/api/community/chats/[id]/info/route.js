import { NextResponse } from 'next/server';
import {
  ensureCommunity, currentUser, membership, membersOf, sharedGroups, avatarFor, sql, asInt,
} from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/chats/:id/info
//
// The data behind the info sheet, loaded when it opens rather than on every poll:
// members, the "groups in common" count for a DM, and the chat's own description.
// A 2.6 s poll has no business computing this.
export async function GET(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const chatId = asInt(id);
    const mine = await membership(chatId, me.id);
    if (!mine) return NextResponse.json({ error: 'You are not in this conversation' }, { status: 403 });

    const rows = await sql`
      SELECT id, kind, title, about, is_main, created_at FROM com_chats WHERE id = ${chatId} LIMIT 1
    `;
    const chat = rows[0];
    if (!chat) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const members = await membersOf(chatId);
    const peer = chat.kind === 'dm' ? members.find((m) => m.id !== me.id) : null;
    const inCommon = peer ? await sharedGroups(me.id, peer.id) : 0;
    const mediaCount = await sql`
      SELECT COUNT(*)::int AS c FROM com_media md
      JOIN com_messages x ON x.id = md.message_id
      WHERE md.chat_id = ${chatId} AND x.deleted_at IS NULL
    `;

    return NextResponse.json({
      chat: {
        id: chat.id,
        kind: chat.kind,
        isMain: !!chat.is_main,
        title: chat.kind === 'dm' ? peer?.name || 'Direct message' : chat.title || 'Group',
        about: chat.about || '',
        createdAt: chat.created_at,
        myRole: mine.role,
        pinned: !!mine.pinned,
        avatar: avatarFor(chat.kind === 'dm' ? peer?.id || chat.id : chat.id,
          chat.kind === 'dm' ? peer?.name || 'DM' : chat.title || 'Group'),
      },
      peer: peer || null,
      members,
      sharedGroups: inCommon,
      mediaCount: Number(mediaCount[0]?.c || 0),
    });
  } catch (e) {
    console.error('[community/chat-info]', e?.message || e);
    return NextResponse.json({ error: 'Could not load conversation info' }, { status: 500 });
  }
}
