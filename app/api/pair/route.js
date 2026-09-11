// MZAZI API — /api/pair
// User-facing WhatsApp pairing, same as the Telegram bot's /pair command.
//
// POST { number }  → creates a `pair` control row in the shared Neon DB;
//                    the running bot picks it up (≤15s), requests the pairing
//                    code from WhatsApp and writes it back into the row.
// GET  ?requestId=  → returns the request status + pairing code once ready
//                    (the page polls this every few seconds).
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import { ensureDatabase } from '@/lib/database';
import { resolveBot, statusFor } from '@/lib/bots';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET;

async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  if (!token) return null;
  try {
    return jwt.verify(token.value, JWT_SECRET);
  } catch {
    return null;
  }
}

function normalizeNumber(n) {
  const digits = String(n || '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export async function POST(request) {
  try {
    const user = await auth();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    await ensureDatabase();

    let body;
    try { body = await request.json(); } catch { body = {}; }
    const number = normalizeNumber(body.number);
    if (!number) {
      return NextResponse.json(
        { error: 'Invalid phone number. Use format like 254785016388 (numbers only, no +, spaces or dashes).' },
        { status: 400 }
      );
    }

    // Which bot this pairing is for. Refused before anything is queued, so a bad
    // target cannot leave a row behind for a bot that will never take it.
    const resolved = await resolveBot(body.bot);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    const bot = resolved.bot;

    // THAT bot must be online to pair. This used to hardcode bot_id = 'main',
    // which is only correct while no bot_profiles is configured — with profiles
    // set the bot heartbeats under its own id and this check would reject every
    // request even though the bot was up.
    const status = await statusFor(bot.id);
    if (!status || !status.online) {
      return NextResponse.json(
        { error: `${bot.name} is currently offline. Try again in a few minutes.` },
        { status: 503 }
      );
    }

    // one pairing request at a time per account
    const pending = await sql`
      SELECT id FROM bot_control
      WHERE action = 'pair' AND status IN ('pending', 'claimed')
        AND payload->>'accountId' = ${String(user.userId)}
      ORDER BY id DESC LIMIT 1
    `;
    if (pending.length) {
      return NextResponse.json({ error: 'You already have a pairing request in progress.' }, { status: 409 });
    }

    // bot_id only when the caller named one. An untargeted row stays claimable
    // by any bot, which is exactly the row this endpoint wrote before bots were
    // selectable — so requests already queued are not stranded by the change.
    const rows = await sql`
      INSERT INTO bot_control (action, payload, status, bot_id)
      VALUES ('pair', ${JSON.stringify({ number, accountId: user.userId })}::jsonb, 'pending', ${resolved.named ? bot.id : ''})
      RETURNING id
    `;
    return NextResponse.json({ requestId: rows[0].id, number, bot: bot.id, botName: bot.name });
  } catch (e) {
    console.error('Pair POST error:', e.message);
    return NextResponse.json({ error: 'Failed to start pairing. Try again.' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const user = await auth();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const requestId = Number(searchParams.get('requestId'));
    if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });

    const rows = await sql`
      SELECT id, action, status, result, created_at, done_at
      FROM bot_control
      WHERE id = ${requestId} AND payload->>'accountId' = ${String(user.userId)}
    `;
    if (!rows.length) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const r = rows[0];
    let result = null;
    if (r.status === 'done' && r.result) {
      try { result = JSON.parse(r.result); } catch { result = { raw: r.result }; }
    }
    return NextResponse.json({
      status: r.status,
      result,
      error: r.status === 'failed' ? r.result : null,
    });
  } catch (e) {
    console.error('Pair GET error:', e.message);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
