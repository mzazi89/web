// MZAZI API — /api/bot/control
// Bot-facing control channel (Bearer BOT_API_KEY).
//   GET  → atomically claim pending control actions (limit 10)
//   POST → report completion/failure for a claimed action { id, status, result }
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL);
const BOT_API_KEY = process.env.BOT_API_KEY || '';

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function authorized(request) {
  const auth = request.headers.get('authorization') || '';
  const key = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return BOT_API_KEY && safeEqual(key, BOT_API_KEY);
}

export async function GET(request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const claimed = await sql`
      UPDATE bot_control SET status = 'claimed', claimed_at = CURRENT_TIMESTAMP
      WHERE id IN (
        SELECT id FROM bot_control WHERE status = 'pending' ORDER BY id ASC LIMIT 10
      )
      RETURNING id, action, payload
    `;
    return NextResponse.json({
      controls: claimed.map((c) => ({ id: c.id, action: c.action, payload: c.payload || {} })),
    });
  } catch (error) {
    console.error('bot control poll error:', error);
    return NextResponse.json({ error: 'Failed to fetch controls' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (!body || !body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const status = ['done', 'failed'].includes(body.status) ? body.status : 'done';
    const upd = await sql`
      UPDATE bot_control SET status = ${status}, result = ${body.result || null}, done_at = CURRENT_TIMESTAMP
      WHERE id = ${body.id}
      RETURNING id, status
    `;
    if (!upd.length) return NextResponse.json({ error: 'Control not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('bot control result error:', error);
    return NextResponse.json({ error: 'Failed to update control' }, { status: 500 });
  }
}
