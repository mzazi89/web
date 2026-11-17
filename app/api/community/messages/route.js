import { NextResponse } from 'next/server';
import {
  ensureCommunity, currentUser, mainChatId, joinMain, membership, postMessage,
  cleanBody, displayName, asInt, sql,
} from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/messages  (legacy shape, kept working)
//
// The community page now speaks /api/community/sync. This endpoint survives
// because it is the shape any older client and the admin panel already understand:
// a flat list of { id, user_id, user_name, message, role, created_at } for the
// main room. It writes into the SAME room the new page reads (com_messages on the
// `main` chat) rather than a second table, so there is one history and no drift.
export async function GET(request) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const chatId = await mainChatId();
    if (!chatId) return NextResponse.json({ messages: [] });

    const { searchParams } = new URL(request.url);
    const lastId = asInt(searchParams.get('lastId'));

    const rows = await sql`
      SELECT x.id, x.sender_id, x.sender_label, x.kind, x.body, x.created_at, x.deleted_at,
             u.fullname, u.firstname, u.lastname, u.email
      FROM com_messages x LEFT JOIN users u ON u.id = x.sender_id
      WHERE x.chat_id = ${chatId} AND x.id > ${lastId}
      ORDER BY x.id ASC LIMIT 100
    `;

    return NextResponse.json({
      messages: rows.map((r) => ({
        id: r.id,
        user_id: r.sender_id || 0,
        user_name: r.sender_label || displayName(r),
        message: r.deleted_at ? 'This message was deleted' : r.body,
        role: r.sender_id ? 'user' : 'admin',
        created_at: r.created_at,
      })),
    });
  } catch (e) {
    console.error('[community/messages:legacy GET]', e?.message || e);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Please log in' }, { status: 401 });

    let payload;
    try { payload = await request.json(); } catch { payload = {}; }
    const body = cleanBody(payload.message || payload.body);
    if (!body) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    let chatId = await mainChatId();
    if (!chatId) return NextResponse.json({ error: 'Community room is not ready' }, { status: 503 });
    if (!(await membership(chatId, me.id))) {
      await joinMain(me.id);
      chatId = (await mainChatId()) || chatId;
    }

    const row = await postMessage(chatId, { senderId: me.id, body });

    return NextResponse.json({
      message: {
        id: row.id,
        user_id: me.id,
        user_name: me.name,
        message: row.body,
        role: 'user',
        created_at: row.created_at,
      },
    });
  } catch (e) {
    console.error('[community/messages:legacy POST]', e?.message || e);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
