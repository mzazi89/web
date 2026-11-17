import { NextResponse } from 'next/server';
import {
  ensureCommunity, currentUser, membership, membersOf, systemNote, setMemberRole, setPinned,
  sql, cleanBody, MAX_GROUP, asInt,
} from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/chats/:id
//
//   PATCH   { title }            rename (owner/admin)
//           { addMembers: [] }   add people (owner/admin)
//           { removeMember: id } remove someone (owner/admin)
//           { leave: true }      leave; the last member out deletes the group
//           { clear: true }      hide a DM from my list until it gets a message
//   DELETE  a group the caller owns; a DM is only ever cleared, for one side
//
// Permission rules are WhatsApp's, reduced to what this product needs: the owner
// can do everything, admins can rename and add/remove people, members can leave.

async function load(chatId) {
  const rows = await sql`SELECT id, kind, title, created_by, dm_key, is_main FROM com_chats WHERE id = ${chatId} LIMIT 1`;
  return rows[0] || null;
}

export async function PATCH(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const chatId = asInt(id);
    const chat = await load(chatId);
    if (!chat) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const mine = await membership(chatId, me.id);
    if (!mine) return NextResponse.json({ error: 'You are not in this conversation' }, { status: 403 });

    let body;
    try { body = await request.json(); } catch { body = {}; }

    const canManage = mine.role === 'owner' || mine.role === 'admin';

    if (body.title !== undefined) {
      if (chat.kind !== 'group') return NextResponse.json({ error: 'Only groups have a name' }, { status: 400 });
      if (!canManage) return NextResponse.json({ error: 'Only group admins can rename it' }, { status: 403 });
      const title = cleanBody(body.title, 80);
      if (title.length < 2) return NextResponse.json({ error: 'Give the group a name' }, { status: 400 });
      await sql`UPDATE com_chats SET title = ${title} WHERE id = ${chatId}`;
      await systemNote(chatId, `${me.name} renamed the group to “${title}”`);
      return NextResponse.json({ ok: true, title });
    }

    if (Array.isArray(body.addMembers)) {
      if (chat.kind !== 'group') return NextResponse.json({ error: 'Not a group' }, { status: 400 });
      if (!canManage) return NextResponse.json({ error: 'Only group admins can add people' }, { status: 403 });
      if (chat.is_main) return NextResponse.json({ error: 'Everyone is already in this room' }, { status: 400 });

      const ids = [...new Set(body.addMembers.map(asInt).filter(Boolean))];
      const count = await sql`SELECT COUNT(*)::int AS c FROM com_members WHERE chat_id = ${chatId}`;
      if (Number(count[0]?.c || 0) + ids.length > MAX_GROUP) {
        return NextResponse.json({ error: `A group holds at most ${MAX_GROUP} people` }, { status: 400 });
      }

      const added = [];
      for (const userId of ids) {
        const exists = await sql`SELECT id FROM users WHERE id = ${userId} LIMIT 1`;
        if (!exists[0]) continue;
        const r = await sql`
          INSERT INTO com_members (chat_id, user_id, role) VALUES (${chatId}, ${userId}, 'member')
          ON CONFLICT (chat_id, user_id) DO NOTHING RETURNING user_id
        `;
        if (r[0]) added.push(userId);
      }
      if (added.length) {
        const names = await sql`SELECT id, fullname, firstname, lastname, email FROM users WHERE id = ANY(${added}::int[])`;
        const label = names.map((u) => u.fullname || u.email || 'a member').join(', ');
        await systemNote(chatId, `${me.name} added ${label}`);
      }
      return NextResponse.json({ ok: true, added });
    }

    // Pin/unpin is per member, not per chat: what sits at the top of your list is
    // your business, not the group's.
    if (body.pin !== undefined) {
      await setPinned(chatId, me.id, !!body.pin);
      return NextResponse.json({ ok: true, pinned: !!body.pin });
    }

    if (body.about !== undefined) {
      if (chat.kind !== 'group') return NextResponse.json({ error: 'Only groups have a description' }, { status: 400 });
      if (!canManage) return NextResponse.json({ error: 'Only group admins can edit the description' }, { status: 403 });
      const about = cleanBody(body.about, 255);
      await sql`UPDATE com_chats SET about = ${about} WHERE id = ${chatId}`;
      return NextResponse.json({ ok: true, about });
    }

    if (body.setRole && typeof body.setRole === 'object') {
      if (chat.kind !== 'group') return NextResponse.json({ error: 'Not a group' }, { status: 400 });
      if (!canManage) return NextResponse.json({ error: 'Only group admins can change roles' }, { status: 403 });

      const targetId = asInt(body.setRole.userId);
      const role = body.setRole.role === 'admin' ? 'admin' : 'member';

      const rows = await sql`SELECT role FROM com_members WHERE chat_id = ${chatId} AND user_id = ${targetId} LIMIT 1`;
      if (!rows[0]) return NextResponse.json({ error: 'That person is not in this group' }, { status: 404 });
      if (rows[0].role === 'owner') {
        return NextResponse.json({ error: 'The group owner cannot be demoted' }, { status: 400 });
      }
      if (rows[0].role === role) return NextResponse.json({ ok: true, unchanged: true });

      // Admins can promote members and demote each other, which is WhatsApp's
      // rule; only the owner is out of reach.
      await setMemberRole(chatId, targetId, role);
      const person = await sql`SELECT fullname, email FROM users WHERE id = ${targetId} LIMIT 1`;
      const name = person[0]?.fullname || person[0]?.email || 'a member';
      await systemNote(chatId, role === 'admin' ? `${me.name} made ${name} an admin` : `${me.name} dismissed ${name} as admin`);
      return NextResponse.json({ ok: true });
    }

    if (body.removeMember) {
      if (chat.kind !== 'group') return NextResponse.json({ error: 'Not a group' }, { status: 400 });
      if (!canManage) return NextResponse.json({ error: 'Only group admins can remove people' }, { status: 403 });
      const target = asInt(body.removeMember);
      const rows = await sql`SELECT role FROM com_members WHERE chat_id = ${chatId} AND user_id = ${target} LIMIT 1`;
      if (!rows[0]) return NextResponse.json({ error: 'That person is not in this group' }, { status: 404 });
      if (rows[0].role === 'owner') return NextResponse.json({ error: 'The group owner cannot be removed' }, { status: 400 });

      await sql`DELETE FROM com_members WHERE chat_id = ${chatId} AND user_id = ${target}`;
      const person = await sql`SELECT fullname, email FROM users WHERE id = ${target} LIMIT 1`;
      await systemNote(chatId, `${me.name} removed ${person[0]?.fullname || person[0]?.email || 'a member'}`);
      return NextResponse.json({ ok: true });
    }

    if (body.leave) {
      if (chat.kind === 'dm') {
        // Leaving a DM is "delete chat": hide it until the other side speaks again.
        const max = await sql`SELECT COALESCE(MAX(id), 0)::int AS m FROM com_messages WHERE chat_id = ${chatId}`;
        await sql`UPDATE com_members SET cleared_id = ${Number(max[0]?.m || 0)} WHERE chat_id = ${chatId} AND user_id = ${me.id}`;
        return NextResponse.json({ ok: true, cleared: true });
      }
      if (chat.is_main) {
        return NextResponse.json({ error: 'The community room cannot be left' }, { status: 400 });
      }

      await sql`DELETE FROM com_members WHERE chat_id = ${chatId} AND user_id = ${me.id}`;
      const left = await sql`SELECT user_id, role FROM com_members WHERE chat_id = ${chatId} ORDER BY joined_at ASC`;

      if (!left.length) {
        await sql`DELETE FROM com_messages WHERE chat_id = ${chatId}`;
        await sql`DELETE FROM com_chats WHERE id = ${chatId}`;
        return NextResponse.json({ ok: true, deleted: true });
      }
      // An owner who walks out hands the group to the longest-serving member,
      // so the room is never left with nobody able to manage it.
      if (mine.role === 'owner') {
        await sql`UPDATE com_members SET role = 'owner' WHERE chat_id = ${chatId} AND user_id = ${left[0].user_id}`;
      }
      await systemNote(chatId, `${me.name} left`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Nothing to change' }, { status: 400 });
  } catch (e) {
    console.error('[community/chat:PATCH]', e?.message || e);
    return NextResponse.json({ error: 'Could not update the conversation' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const chatId = asInt(id);
    const chat = await load(chatId);
    if (!chat) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const mine = await membership(chatId, me.id);
    if (!mine) return NextResponse.json({ error: 'You are not in this conversation' }, { status: 403 });

    if (chat.kind === 'dm') {
      const max = await sql`SELECT COALESCE(MAX(id), 0)::int AS m FROM com_messages WHERE chat_id = ${chatId}`;
      await sql`UPDATE com_members SET cleared_id = ${Number(max[0]?.m || 0)} WHERE chat_id = ${chatId} AND user_id = ${me.id}`;
      return NextResponse.json({ ok: true, cleared: true });
    }

    if (chat.is_main) {
      return NextResponse.json({ error: 'The community room cannot be deleted' }, { status: 400 });
    }
    if (mine.role !== 'owner') {
      return NextResponse.json({ error: 'Only the group owner can delete it' }, { status: 403 });
    }

    await sql`DELETE FROM com_messages WHERE chat_id = ${chatId}`;
    await sql`DELETE FROM com_typing WHERE chat_id = ${chatId}`;
    await sql`DELETE FROM com_members WHERE chat_id = ${chatId}`;
    await sql`DELETE FROM com_chats WHERE id = ${chatId}`;
    return NextResponse.json({ ok: true, deleted: true });
  } catch (e) {
    console.error('[community/chat:DELETE]', e?.message || e);
    return NextResponse.json({ error: 'Could not delete the conversation' }, { status: 500 });
  }
}
