// MZAZI API — /api/bot/status
// Bot heartbeat: the running bot POSTs its status here (Bearer BOT_API_KEY).
// Admin reads it via /api/admin/bot-status.
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

export async function POST(request) {
  const auth = request.headers.get('authorization') || '';
  const key = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!BOT_API_KEY || !safeEqual(key, BOT_API_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const botId = body.botId || 'main';

    await sql`
      INSERT INTO bot_status (bot_id, online, version, uptime_seconds, telegram_online, whatsapp_sessions, command_count, last_sync_at, last_sync_error, last_seen_at)
      VALUES (${botId}, true, ${body.version || null}, ${Math.floor(Number(body.uptimeSeconds) || 0)},
              ${!!body.telegramOnline}, ${Math.floor(Number(body.whatsappSessions) || 0)},
              ${Math.floor(Number(body.commandCount) || 0)}, ${body.lastSyncAt || null}, ${body.lastSyncError || null}, CURRENT_TIMESTAMP)
      ON CONFLICT (bot_id) DO UPDATE SET
        online = EXCLUDED.online,
        version = EXCLUDED.version,
        uptime_seconds = EXCLUDED.uptime_seconds,
        telegram_online = EXCLUDED.telegram_online,
        whatsapp_sessions = EXCLUDED.whatsapp_sessions,
        command_count = EXCLUDED.command_count,
        last_sync_at = EXCLUDED.last_sync_at,
        last_sync_error = EXCLUDED.last_sync_error,
        last_seen_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('bot status error:', error);
    return NextResponse.json({ error: 'Failed to record status' }, { status: 500 });
  }
}
