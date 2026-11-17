import { NextResponse } from 'next/server';
import {
  ensureCommunity, currentUser, chatsFor, dmWith, sql,
  cleanBody, systemNote, MAX_GROUP, asInt,
} from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/chats
//
//   GET   the caller's conversations (the same list /sync returns, for clients
//         that only want that)
//   POST  open a DM or create a group
//
//     { kind: 'dm',    peerId: 12 }                    → the DM, created if needed
//     { kind: 'group', title: '…', memberIds: [1,2] }  → a new group
//
// A DM is idempotent: both directions resolve to the same row through a
// `dm:<min>:<max>` key, so tapping the same person twice never forks a thread.

export async function GET() {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    return NextResponse.json({ chats: await chatsFor(me.id) });
  } catch (e) {
    console.error('[community/chats:GET]', e?.message || e);
    return NextResponse.json({ error: 'Could not load chats' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { body = {}; }
    const kind = body.kind === 'dm' ? 'dm' : 'group';

    if (kind === 'dm') {
      const peerId = asInt(body.peerId);
      if (!peerId || peerId === me.id) {
        return NextResponse.json({ error: 'Pick someone to message' }, { status: 400 });
      }
      const peer = await sql`SELECT id FROM users WHERE id = ${peerId} LIMIT 1`;
      if (!peer[0]) return NextResponse.json({ error: 'That account no longer exists' }, { status: 404 });

      const id = await dmWith(me.id, peerId);
      return NextResponse.json({ chatId: id, created: true });
    }

    // ── group ────────────────────────────────────────────────────────────────
    const title = cleanBody(body.title, 80);
    if (title.length < 2) {
      return NextResponse.json({ error: 'Give the group a name' }, { status: 400 });
    }

    const raw = Array.isArray(body.memberIds) ? body.memberIds : [];
    const ids = [...new Set(raw.map(asInt).filter((n) => n && n !== me.id))].slice(0, MAX_GROUP - 1);

    if (ids.length) {
      // Only real accounts, so a bogus id cannot create a ghost member.
      const found = await sql`SELECT id FROM users WHERE id = ANY(${ids}::int[])`;
      const valid = new Set(found.map((r) => r.id));
      if (!ids.every((id) => valid.has(id))) {
        return NextResponse.json({ error: 'One of those accounts no longer exists' }, { status: 400 });
      }
    }

    const inserted = await sql`
      INSERT INTO com_chats (kind, title, created_by) VALUES ('group', ${title}, ${me.id}) RETURNING id
    `;
    const chatId = inserted[0].id;

    await sql`INSERT INTO com_members (chat_id, user_id, role) VALUES (${chatId}, ${me.id}, 'owner')`;
    for (const id of ids) {
      await sql`INSERT INTO com_members (chat_id, user_id, role) VALUES (${chatId}, ${id}, 'member') ON CONFLICT DO NOTHING`;
    }
    await systemNote(chatId, `${me.name} created “${title}”`);

    return NextResponse.json({ chatId, created: true });
  } catch (e) {
    console.error('[community/chats:POST]', e?.message || e);
    return NextResponse.json({ error: 'Could not create the chat' }, { status: 500 });
  }
}
