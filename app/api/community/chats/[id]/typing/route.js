import { NextResponse } from 'next/server';
import { ensureCommunity, currentUser, membership, asInt, sql } from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/chats/:id/typing
//
// A single upserted row per (chat, person), read by /sync. It is a hint, not
// state: nothing depends on it, the query ignores rows older than six seconds,
// and { typing: false } removes it the moment the box is emptied or a message is
// sent — so a "typing…" bubble can never outlive the person's attention.
export async function POST(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ ok: false }, { status: 401 });

    const { id } = await params;
    const chatId = asInt(id);
    const mine = await membership(chatId, me.id);
    if (!mine) return NextResponse.json({ ok: false }, { status: 403 });

    let body;
    try { body = await request.json(); } catch { body = {}; }

    if (body.typing === false) {
      await sql`DELETE FROM com_typing WHERE chat_id = ${chatId} AND user_id = ${me.id}`;
      return NextResponse.json({ ok: true });
    }

    await sql`
      INSERT INTO com_typing (chat_id, user_id, at) VALUES (${chatId}, ${me.id}, NOW())
      ON CONFLICT (chat_id, user_id) DO UPDATE SET at = NOW()
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[community/typing]', e?.message || e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
