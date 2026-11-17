import { NextResponse } from 'next/server';
import { ensureCommunity, currentUser, onlineIds, displayName, avatarFor, sql } from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/people
//
// The directory behind "new chat": every registered account except the caller,
// searchable by name. Matching on the email is deliberately server-side only —
// it lets someone find a colleague they know by address without publishing the
// address in the result.
//
// `dmId` is filled in when a conversation already exists, so the list can show
// the existing thread instead of creating a second one.
export async function GET(request) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get('q') || '').replace(/[%_]/g, '').trim().slice(0, 60);
    const like = `%${q}%`;

    const rows = q
      ? await sql`
          SELECT u.id, u.fullname, u.firstname, u.lastname, u.email,
                 (SELECT c.id FROM com_chats c
                   WHERE c.dm_key = 'dm:' || LEAST(u.id, ${me.id})::text || ':' || GREATEST(u.id, ${me.id})::text
                   LIMIT 1) AS dm_id
          FROM users u
          WHERE u.id <> ${me.id}
            AND (COALESCE(u.fullname, '') ILIKE ${like} OR COALESCE(u.email, '') ILIKE ${like})
          ORDER BY u.fullname NULLS LAST, u.id DESC
          LIMIT 40
        `
      : await sql`
          SELECT u.id, u.fullname, u.firstname, u.lastname, u.email,
                 (SELECT c.id FROM com_chats c
                   WHERE c.dm_key = 'dm:' || LEAST(u.id, ${me.id})::text || ':' || GREATEST(u.id, ${me.id})::text
                   LIMIT 1) AS dm_id
          FROM users u
          WHERE u.id <> ${me.id}
          ORDER BY u.fullname NULLS LAST, u.id DESC
          LIMIT 40
        `;

    const online = await onlineIds();

    return NextResponse.json({
      people: rows.map((u) => {
        const name = displayName(u);
        return {
          id: u.id,
          name,
          dmId: u.dm_id || null,
          online: online.has(u.id),
          avatar: avatarFor(u.id, name),
        };
      }),
      onlineCount: online.size,
    });
  } catch (e) {
    console.error('[community/people]', e?.message || e);
    return NextResponse.json({ error: 'Could not load the member list' }, { status: 500 });
  }
}
