import { NextResponse } from 'next/server';
import {
  ensureCommunity, currentUser, membership, ensureInvite, resetInvite, asInt, sql, systemNote,
} from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/chats/:id/invite
//
//   GET   the group's invite code (created on first ask, any member may share it)
//   POST  { reset: true } issues a new code and kills the old one (owner/admin)
//
// The code is only minted here rather than in /sync because a group that is never
// shared should not carry a live token, and a poll every 2.6 s is the wrong place
// to be writing one.
async function guard(params) {
  const me = await currentUser();
  if (!me) return { error: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) };

  const { id } = await params;
  const chatId = asInt(id);
  const rows = await sql`SELECT id, kind, title, is_main FROM com_chats WHERE id = ${chatId} LIMIT 1`;
  const chat = rows[0];
  if (!chat) return { error: NextResponse.json({ error: 'Conversation not found' }, { status: 404 }) };
  if (chat.kind !== 'group') return { error: NextResponse.json({ error: 'Only groups have invite links' }, { status: 400 }) };
  if (chat.is_main) return { error: NextResponse.json({ error: 'Everyone is already in the community room' }, { status: 400 }) };

  const mine = await membership(chatId, me.id);
  if (!mine) return { error: NextResponse.json({ error: 'You are not in this group' }, { status: 403 }) };

  return { me, chat, mine };
}

export async function GET(request, { params }) {
  try {
    await ensureCommunity();
    const { error, chat } = await guard(params);
    if (error) return error;

    const code = await ensureInvite(chat.id);
    return NextResponse.json({ code });
  } catch (e) {
    console.error('[community/invite:GET]', e?.message || e);
    return NextResponse.json({ error: 'Could not create an invite link' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await ensureCommunity();
    const { error, chat, mine, me } = await guard(params);
    if (error) return error;

    if (mine.role !== 'owner' && mine.role !== 'admin') {
      return NextResponse.json({ error: 'Only group admins can reset the link' }, { status: 403 });
    }

    const code = await resetInvite(chat.id);
    await systemNote(chat.id, `${me.name} reset the invite link`);
    return NextResponse.json({ code });
  } catch (e) {
    console.error('[community/invite:POST]', e?.message || e);
    return NextResponse.json({ error: 'Could not reset the link' }, { status: 500 });
  }
}
