import { NextResponse } from 'next/server';
import {
  ensureCommunity, currentUser, chatByInvite, membership, joinChat,
  displayName, avatarFor, sql,
} from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/invite/:code
//
//   GET   what the link points at, for the "Join this group?" card. Never joins.
//   POST  join, which is the only thing that adds a member.
//
// Splitting preview from join matters: a link pasted into a chat app can be
// fetched by a crawler or a preview bot, and a GET that joined would add an
// account to the group every time the message was looked at.
export async function GET(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { code } = await params;
    const chat = await chatByInvite(String(code || '').slice(0, 32));
    if (!chat) return NextResponse.json({ error: 'That invite link is not valid any more' }, { status: 404 });

    const [members, mine] = await Promise.all([
      sql`
        SELECT u.id, u.fullname, u.firstname, u.lastname, u.email
        FROM com_members m LEFT JOIN users u ON u.id = m.user_id
        WHERE m.chat_id = ${chat.id}
        ORDER BY m.joined_at ASC LIMIT 6
      `,
      membership(chat.id, me.id),
    ]);
    const total = await sql`SELECT COUNT(*)::int AS c FROM com_members WHERE chat_id = ${chat.id}`;

    return NextResponse.json({
      chatId: chat.id,
      title: chat.title || 'Group',
      members: Number(total[0]?.c || 0),
      isMember: Boolean(mine),
      names: members.map((m) => displayName(m)).slice(0, 4),
      avatar: avatarFor(chat.id, chat.title || 'Group'),
    });
  } catch (e) {
    console.error('[community/invite:preview]', e?.message || e);
    return NextResponse.json({ error: 'Could not read that invite' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { code } = await params;
    const chat = await chatByInvite(String(code || '').slice(0, 32));
    if (!chat) return NextResponse.json({ error: 'That invite link is not valid any more' }, { status: 404 });

    const mine = await membership(chat.id, me.id);
    if (mine) return NextResponse.json({ chatId: chat.id, already: true });

    const count = await sql`SELECT COUNT(*)::int AS c FROM com_members WHERE chat_id = ${chat.id}`;
    if (Number(count[0]?.c || 0) >= 100) {
      return NextResponse.json({ error: 'That group is full' }, { status: 400 });
    }

    await joinChat(chat.id, me.id, `${me.name} joined via invite link`);
    return NextResponse.json({ chatId: chat.id, joined: true });
  } catch (e) {
    console.error('[community/invite:join]', e?.message || e);
    return NextResponse.json({ error: 'Could not join that group' }, { status: 500 });
  }
}
