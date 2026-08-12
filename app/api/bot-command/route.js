// MZAZI API — /api/bot-command
// Command registry served to the WhatsApp bot.
//   GET  no auth        → public metadata only
//   GET  Bearer key     → full payload incl. executable `code` + X-Mzazi-Signature HMAC
//
// The registry now lives in the Neon `bot_commands` table (admin-editable from
// /admin/commands). It is seeded from data/bot-commands.json on first run.
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';
import { ensureDatabase } from '@/lib/database';
import { getBotApiKey } from '@/lib/botKey';
import { corsHeaders, handleOptions, mergeHeaders } from '@/lib/api/cors';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL);
const ENV_BOT_API_KEY = process.env.BOT_API_KEY || '';

const toMetadata = (r) => ({
  name: r.name,
  aliases: Array.isArray(r.aliases) ? r.aliases : [],
  description: r.description || '',
  category: r.category || 'General',
  usage: r.usage || '',
  ownerOnly: !!r.owner_only,
  adminOnly: !!r.admin_only,
  groupOnly: !!r.group_only,
  enabled: r.enabled !== false,
});

const toFull = (r) => ({ ...toMetadata(r), code: r.code || '' });

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function sign(body, secret) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function clientKey(request) {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  const url = new URL(request.url);
  return url.searchParams.get('key') || '';
}

export async function GET(request) {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  await ensureDatabase();
  try {
    const rows = await sql`SELECT * FROM bot_commands ORDER BY name ASC`;
    const meta = await sql`SELECT MAX(updated_at) AS max FROM bot_commands`;
    const updatedAt = meta[0]?.max || new Date().toISOString();

    const key = clientKey(request);
    const authorized = BOT_API_KEY && safeEqual(key, BOT_API_KEY);

    // Diagnostic for the admin: tells us whether the env var exists at runtime.
    // Check Vercel → project → Logs → Function logs for this line.
    console.log(
      `[bot-command] BOT_API_KEY configured on server: ${!!BOT_API_KEY} | request authorized: ${!!authorized}`
    );

    if (authorized) {
      const body = JSON.stringify({
        ok: true,
        source: 'mzazi.shop',
        schemaVersion: 1,
        updatedAt,
        commands: rows.filter((r) => r.enabled !== false).map(toFull),
      });
      return new NextResponse(body, {
        status: 200,
        headers: mergeHeaders(corsHeaders(request), {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-Mzazi-Signature': `sha256=${sign(body, BOT_API_KEY)}`,
        }),
      });
    }

    return NextResponse.json(
      {
        ok: true,
        source: 'mzazi.shop',
        schemaVersion: 1,
        updatedAt,
        commands: rows.map(toMetadata),
      },
      { headers: mergeHeaders(corsHeaders(request), { 'Cache-Control': 'no-store' }) }
    );
  } catch (e) {
    console.error('[bot-command] error:', e.message);
    return NextResponse.json(
      { ok: false, error: 'Failed to load command registry' },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
