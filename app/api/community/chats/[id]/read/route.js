import { NextResponse } from 'next/server';
import { ensureCommunity, currentUser, membership, asInt, sql } from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/chats/:id/read
//
// Moves this member's read mark forward. `GREATEST` makes it monotonic, so two
// tabs polling at once can never move the mark backwards and un-read a message
// the other tab already saw — which is what produces a blue tick flickering back
// to grey.
export async function POST(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const chatId = asInt(id);
    const mine = await membership(chatId, me.id);
    if (!mine) return NextResponse.json({ error: 'You are not in this conversation' }, { status: 403 });

    let body;
    try { body = await request.json(); } catch { body = {}; }

    let upTo = asInt(body.upTo);
    if (!upTo) {
      const rows = await sql`SELECT COALESCE(MAX(id), 0)::int AS m FROM com_messages WHERE chat_id = ${chatId}`;
      upTo = Number(rows[0]?.m || 0);
    }

    await sql`
      UPDATE com_members
      SET last_read_id = GREATEST(COALESCE(last_read_id, 0), ${upTo})
      WHERE chat_id = ${chatId} AND user_id = ${me.id}
    `;
    await sql`DELETE FROM com_typing WHERE chat_id = ${chatId} AND user_id = ${me.id}`;

    return NextResponse.json({ ok: true, upTo });
  } catch (e) {
    console.error('[community/read]', e?.message || e);
    return NextResponse.json({ error: 'Could not update the read mark' }, { status: 500 });
  }
}
