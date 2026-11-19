import { NextResponse } from 'next/server';
import {
  ensureCommunity, currentUser, membership, reportMessage, asInt, sql,
} from '@/lib/community';

export const dynamic = 'force-dynamic';

// MZAZI API — /api/community/messages/:id/report
//
// A report goes to the operator, never into the chat: the person being reported
// must not learn about it from the thread, which is why this writes to
// com_reports and posts nothing.
//
// One report per person per message (unique index), so a double tap is the same
// report rather than two rows for the admin to read.
const REASONS = ['Spam', 'Harassment', 'Scam or fraud', 'Inappropriate content', 'Other'];

export async function POST(request, { params }) {
  try {
    await ensureCommunity();
    const me = await currentUser();
    if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    const { id } = await params;
    const messageId = asInt(id);

    const rows = await sql`
      SELECT id, chat_id, sender_id, deleted_at FROM com_messages WHERE id = ${messageId} LIMIT 1
    `;
    const message = rows[0];
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    if (message.sender_id === me.id) {
      return NextResponse.json({ error: 'That is your own message' }, { status: 400 });
    }

    const mine = await membership(message.chat_id, me.id);
    if (!mine) return NextResponse.json({ error: 'You are not in this conversation' }, { status: 403 });

    let payload;
    try { payload = await request.json(); } catch { payload = {}; }

    const reason = REASONS.includes(payload.reason) ? payload.reason : 'Other';
    const note = String(payload.note || '').replace(/\u0000/g, '').trim().slice(0, 500);

    const reportId = await reportMessage({
      messageId,
      chatId: message.chat_id,
      reporterId: me.id,
      reason,
      note: note || null,
    });

    return NextResponse.json({
      ok: true,
      reported: Boolean(reportId),
      message: reportId
        ? 'Reported. MZAZI support will review this message.'
        : 'You already reported this message. Support has it.',
    });
  } catch (e) {
    console.error('[community/report]', e?.message || e);
    return NextResponse.json({ error: 'Could not send that report' }, { status: 500 });
  }
}
