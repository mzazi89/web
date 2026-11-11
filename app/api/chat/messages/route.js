// MZAZI API — /api/chat/messages
// GET  ?after=<id>  → this account's thread (marks the admin's replies as read)
// POST { body }     → a message from the customer
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '@/lib/api/web-auth';
import { ipRateLimit, clientIp } from '@/lib/ip-limiter';
import { clean, postMessage, threadFor, ensureChat } from '@/lib/chat';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

export async function GET(request) {
  try {
    const user = await requireUser();
    const after = Number(new URL(request.url).searchParams.get('after')) || 0;
    const messages = await threadFor(user.id, after);

    if (messages.length) {
      await sql`UPDATE chat_messages SET read_by_user = true WHERE user_id = ${user.id} AND sender = 'admin' AND read_by_user = false`;
    }
    return NextResponse.json({ messages }, { headers: { 'cache-control': 'no-store' } });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[chat] GET:', e.message);
    return NextResponse.json({ error: 'Could not load the conversation' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireUser();
    await ensureChat();

    // Chat is the easiest place to flood; keep one account to 20 messages a minute.
    const limit = ipRateLimit(`chat:${clientIp(request)}:${user.id}`, { max: 20, windowMs: 60_000 });
    if (!limit.allowed) return NextResponse.json({ error: 'Slow down a moment.' }, { status: 429 });

    const { body } = await request.json().catch(() => ({}));
    const text = clean(body);
    if (!text) return NextResponse.json({ error: 'Type a message first.' }, { status: 400 });

    const message = await postMessage(user.id, 'user', text);
    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sign in to chat with us.' }, { status: 401 });
    }
    console.error('[chat] POST:', e.message);
    return NextResponse.json({ error: 'Message did not send' }, { status: 500 });
  }
}
