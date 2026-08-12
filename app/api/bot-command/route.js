// MZAZI API — /api/bot-command
// Command registry served to the WhatsApp bot (and public metadata for the site).
//
//   GET /api/bot-command/
//     No auth        → public metadata only (name, aliases, description, category, usage, flags)
//     Bearer key     → full payload including executable `code` for each enabled command
//                      plus X-Mzazi-Signature: sha256=<hmac(body, BOT_API_KEY)> for the bot to verify.
//
// Commands live in data/bot-commands.json (committed to this repo). Edit that file,
// push, and Vercel redeploys — the bot picks the changes up on its next sync.
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { corsHeaders, handleOptions, mergeHeaders } from '@/lib/api/cors';

export const dynamic = 'force-dynamic';

const REGISTRY_PATH = path.join(process.cwd(), 'data', 'bot-commands.json');
const BOT_API_KEY = process.env.BOT_API_KEY || '';

function loadRegistry() {
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(raw);
}

// Public metadata — strip anything sensitive/executable
function toMetadata(cmd) {
  return {
    name: cmd.name,
    aliases: Array.isArray(cmd.aliases) ? cmd.aliases : [],
    description: cmd.description || '',
    category: cmd.category || 'General',
    usage: cmd.usage || '',
    ownerOnly: !!cmd.ownerOnly,
    adminOnly: !!cmd.adminOnly,
    groupOnly: !!cmd.groupOnly,
    enabled: cmd.enabled !== false,
  };
}

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

  try {
    const registry = loadRegistry();
    const commands = Array.isArray(registry.commands) ? registry.commands : [];

    const key = clientKey(request);
    const authorized = BOT_API_KEY && safeEqual(key, BOT_API_KEY);

    if (authorized) {
      const body = JSON.stringify({
        ok: true,
        source: 'mzazi.shop',
        schemaVersion: registry.meta?.schemaVersion || 1,
        updatedAt: registry.meta?.updatedAt || new Date().toISOString(),
        commands: commands.filter((c) => c.enabled !== false),
      });

      const signature = sign(body, BOT_API_KEY);

      return new NextResponse(body, {
        status: 200,
        headers: mergeHeaders(corsHeaders(request), {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-Mzazi-Signature': `sha256=${signature}`,
        }),
      });
    }

    // Public: metadata only (used by menus / command showcase)
    return NextResponse.json(
      {
        ok: true,
        source: 'mzazi.shop',
        schemaVersion: registry.meta?.schemaVersion || 1,
        updatedAt: registry.meta?.updatedAt || new Date().toISOString(),
        commands: commands.map(toMetadata),
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
