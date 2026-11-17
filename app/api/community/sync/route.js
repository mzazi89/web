import { NextResponse } from 'next/server';
import {
  ensureCommunity, currentUser, touchPresence, chatsFor, messagesIn, typingIn,
  shapeMany, membersOf, membership, mainChatId, joinMain, avatarFor, sql,
} from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/sync
//
// One poll for the whole screen: the chat list, the open conversation, who is
// typing and who is online. The page used to make three calls every 3 seconds;
// this is one, which matters because the free Postgres tier bills by the query.
//
//   ?chat=<id>      conversation to open (default: the main community room)
//   ?after=<id>     only messages newer than this (0 → latest 60)
//   ?before=<id>    older page, for scroll-back
//
// Everything is scoped by membership: `?chat=` pointing at a chat you are not in
// answers 403 rather than an empty conversation, so a probe cannot tell an empty
// group from one it is not allowed to read.
export async function GET(request) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const after = Number(searchParams.get('after') || 0) || 0;
    const before = Number(searchParams.get('before') || 0) || 0;

    await touchPresence(me.id);

    let chatId = Number(searchParams.get('chat') || 0) || 0;
    if (!chatId) chatId = await mainChatId();

    // Join the public room only when the membership is actually missing — this
    // used to run on every poll, which meant a write every 2.6s per open tab.
    let mine = await membership(chatId, me.id);
    if (!mine) {
      const mainId = await mainChatId();
      if (chatId === mainId) {
        await joinMain(me.id);
        mine = await membership(chatId, me.id);
      }
    }
    if (!mine) {
      return NextResponse.json({ error: 'You are not in this conversation' }, { status: 403 });
    }

    const chats = await chatsFor(me.id);

    const [chatRow] = await sql`SELECT id, kind, title, about, dm_key, is_main FROM com_chats WHERE id = ${chatId} LIMIT 1`;
    const members = await membersOf(chatId);

    let rows;
    if (before) rows = await messagesIn(chatId, { before, limit: 60 });
    else if (after) rows = await messagesIn(chatId, { after, limit: 200 });
    else rows = await messagesIn(chatId, { before: 2147483647, limit: 80 });

    const messages = await shapeMany(rows, { meId: me.id, members });
    const typing = await typingIn(chatId, me.id);

    const peer = chatRow.kind === 'dm' ? members.find((m) => m.id !== me.id) : null;

    return NextResponse.json({
      me: { ...me, avatar: avatarFor(me.id, me.name) },
      chats,
      unreadTotal: chats.reduce((n, c) => n + (c.unread || 0), 0),
      chat: {
        id: chatRow.id,
        kind: chatRow.kind,
        isMain: !!chatRow.is_main,
        title: chatRow.kind === 'dm' ? peer?.name || 'Direct message' : chatRow.title || 'Group',
        about: chatRow.about || '',
        myRole: mine.role,
        members,
        peer: peer || null,
        photo: peer?.photo || null,
        avatar: avatarFor(chatRow.kind === 'dm' ? peer?.id || chatRow.id : chatRow.id,
          chatRow.kind === 'dm' ? peer?.name || 'DM' : chatRow.title || 'Group'),
      },
      messages,
      typing,
      more: rows.length >= (before ? 60 : 80),
    });
  } catch (e) {
    console.error('[community/sync]', e?.message || e);
    return NextResponse.json({ error: 'Could not load the conversation' }, { status: 500 });
  }
}
