import { NextResponse } from 'next/server';
import {
  ensureCommunity, currentUser, membership, toggleReaction, reactionsFor, asInt, sql,
} from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/messages/:id/reactions
//
// POST { emoji } toggles one reaction. Returns the whole tally for that message
// so the bubble can redraw from the answer instead of guessing — two people
// reacting at the same second would otherwise leave the client showing a count
// nobody else has.
//
// The emoji is deliberately constrained: a "reaction" that accepts arbitrary text
// is a second, unmoderated message channel with a shorter character limit.
const MAX_EMOJI = 12;

function validEmoji(value) {
  const text = String(value || '').trim();
  if (!text || text.length > MAX_EMOJI) return null;
  if (/[a-z0-9]/i.test(text)) return null;              // letters/digits are not reactions
  if (!/\p{Extended_Pictographic}/u.test(text)) return null;
  return text;
}

export async function POST(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const messageId = asInt(id);

    const rows = await sql`SELECT id, chat_id, deleted_at FROM com_messages WHERE id = ${messageId} LIMIT 1`;
    const message = rows[0];
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    const mine = await membership(message.chat_id, me.id);
    if (!mine) return NextResponse.json({ error: 'You are not in this conversation' }, { status: 403 });
    if (message.deleted_at) return NextResponse.json({ error: 'That message was deleted' }, { status: 400 });

    let body;
    try { body = await request.json(); } catch { body = {}; }
    const emoji = validEmoji(body.emoji);
    if (!emoji) return NextResponse.json({ error: 'Pick a reaction' }, { status: 400 });

    const result = await toggleReaction(messageId, me.id, emoji);
    const all = await reactionsFor(messageId);

    const grouped = [];
    for (const r of all) {
      const hit = grouped.find((g) => g.emoji === r.emoji);
      if (hit) {
        hit.count += 1;
        if (r.user_id === me.id) hit.mine = true;
      } else {
        grouped.push({ emoji: r.emoji, count: 1, mine: r.user_id === me.id });
      }
    }
    grouped.sort((a, b) => b.count - a.count);

    return NextResponse.json({ reactions: grouped, removed: result.removed });
  } catch (e) {
    console.error('[community/reactions]', e?.message || e);
    return NextResponse.json({ error: 'Could not save that reaction' }, { status: 500 });
  }
}
