// MZAZI API — /api/xmd-command
//
// Command registry served to the MZAZI XMD bot.
//
//   GET  no auth        → public metadata only
//   GET  Bearer key     → full payload incl. executable `code` + X-Mzazi-Signature HMAC
//
// This is the MZAZI XMD twin of /api/bot-command. It exists as a SEPARATE PATH
// on purpose: the two bots must be independently deployable, independently
// keyed and independently breakable. A single shared endpoint with a `?bot=`
// parameter would mean a change for one bot is a change for both.
//
// The registry lives in the same Neon `bot_commands` table that the admin panel
// already edits (admin → Commands). The table carries a `profile` column, and
// this route returns ONLY rows where profile = 'xmd'. Commands with no profile
// belong to QUARTZ XD and are deliberately excluded — so MZAZI XMD and QUARTZ XD
// are genuinely different bots rather than one bot with two names.
//
// The key is resolved in this order (first hit wins):
//   1. settings.xmd_bot_api_key     — the MZAZI XMD bot's own key, written by
//      the admin Settings page (this is what the bot and admin now use)
//   2. getBotApiKey()               — the shared bot_config.bot_api_key
//   3. XMD_BOT_API_KEY              — this bot's own environment variable
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';
import { ensureDatabase } from '@/lib/database';
import { getBotApiKey } from '@/lib/botKey';
import { corsHeaders, handleOptions, mergeHeaders } from '@/lib/api/cors';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL);
const PROFILE = 'xmd';

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

const toFull = (r) => ({ ...toMetadata(r), code: r.code || '', profile: PROFILE });

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

/**
 * This bot's key specifically, falling back to the shared one.
 *
 * The XMD key now lives in the shared `settings` table as `xmd_bot_api_key`
 * (written by the admin Settings page) — that is authoritative, because it is
 * also the value the bot reads into its own config. The old
 * `bot_config.bot_api_key` shared key and the `XMD_BOT_API_KEY` env var remain
 * as fallbacks so an existing deployment keeps working unchanged.
 */
async function getXmdBotApiKey() {
  try {
    const rows = await sql`SELECT value FROM settings WHERE key = 'xmd_bot_api_key'`;
    const own = rows[0]?.value;
    if (own) return own;
  } catch (e) {
    // Table or row missing is expected on a fresh install — fall through.
    console.error('[xmd-command] xmd key lookup failed:', e?.message);
  }
  return (await getBotApiKey()) || process.env.XMD_BOT_API_KEY || '';
}

export async function GET(request) {
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  try {
    await ensureDatabase();
  } catch (e) {
    console.error('[xmd-command] init error:', e?.message);
    return NextResponse.json(
      { ok: false, error: `init: ${e?.message || e}` },
      { status: 500, headers: corsHeaders(request) }
    );
  }

  try {
    const rows = await sql`
      SELECT * FROM bot_commands
      WHERE profile = ${PROFILE}
      ORDER BY name ASC
    `;
    const meta = await sql`
      SELECT MAX(updated_at) AS max FROM bot_commands WHERE profile = ${PROFILE}
    `;
    const updatedAt = meta[0]?.max || new Date().toISOString();

    const apiKey = await getXmdBotApiKey();
    const authorized = apiKey && safeEqual(clientKey(request), apiKey);

    if (authorized) {
      const body = JSON.stringify({
        ok: true,
        source: 'mzazi.shop',
        bot: 'mzazi-xmd',
        profile: PROFILE,
        schemaVersion: 1,
        updatedAt,
        commands: rows.filter((r) => r.enabled !== false).map(toFull),
      });
      return new NextResponse(body, {
        status: 200,
        headers: mergeHeaders(corsHeaders(request), {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-Mzazi-Signature': `sha256=${sign(body, apiKey)}`,
        }),
      });
    }

    // Unauthenticated callers get metadata only — never executable code.
    return NextResponse.json(
      {
        ok: true,
        source: 'mzazi.shop',
        bot: 'mzazi-xmd',
        profile: PROFILE,
        schemaVersion: 1,
        updatedAt,
        commands: rows.map(toMetadata),
      },
      { headers: mergeHeaders(corsHeaders(request), { 'Cache-Control': 'no-store' }) }
    );
  } catch (e) {
    console.error('[xmd-command] error:', e.message);
    // The `profile` column is added by ensureDatabase(); if that DDL did not
    // apply (permissions, or an old database) say so specifically instead of
    // returning a generic failure that looks like a code bug.
    const missingColumn = /column .*profile.* does not exist|undefined column/i.test(e.message || '');
    return NextResponse.json(
      {
        ok: false,
        error: missingColumn
          ? 'bot_commands.profile is missing — run the website once (or the seed script) to apply the schema'
          : 'Failed to load command registry',
      },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
