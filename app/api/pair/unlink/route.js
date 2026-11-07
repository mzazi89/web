// MZAZI API — POST /api/pair/unlink
// Manage a linked WhatsApp device: unlink (logout) | delete (logout + wipe).
// Asks the running bot to perform the action (ownership enforced).
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { ensureDatabase } from '@/lib/database';
import { auth, normalizeNumber, getAccount } from '@/lib/pairApi';
import { resolveBotForNumber } from '@/lib/bots';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

const ACTIONS = ['unlink', 'delete'];

export async function POST(request) {
  try {
    const user = await auth();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    await ensureDatabase();

    let body;
    try { body = await request.json(); } catch { body = {}; }
    const number = normalizeNumber(body.number);
    if (!number) {
      return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });
    }
    const action = ACTIONS.includes(body.action) ? body.action : 'unlink';

    // ownership: the device must belong to this account (or not exist yet)
    const account = await getAccount(sql, user.userId);
    if (account) {
      const rows = await sql`
        SELECT "userId" FROM "WhatsAppSession" WHERE "phoneNumber" = ${number} LIMIT 1
      `;
      if (rows.length && Number(rows[0].userId) !== Number(account.id)) {
        return NextResponse.json({ error: 'This number is not linked to your account.' }, { status: 403 });
      }
    }

    // Which bot holds this number. Not taken on trust from the client alone:
    // when none is named, telemetry says who owns it. Issuing a logout to the
    // other bot would find no such session and leave the device linked.
    const resolved = await resolveBotForNumber(number, body.bot);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    const bot = resolved.bot;

    // Map the user-facing action to the bot control + payload
    let controlAction, payload;
    if (action === 'delete') {
      controlAction = 'unpair';
      payload = { number, accountId: user.userId, mode: 'delete' };
    } else {
      controlAction = 'unpair';
      payload = { number, accountId: user.userId };
    }

    // A request only blocks a second one while it is still plausible that the
    // bot will pick it up. The bot polls every 15s, so anything older than two
    // minutes was never claimed — a bot that was down, or a row left behind by
    // a restart. That stale row used to answer 409 forever: the number could not
    // be removed from anywhere, permanently, with no way to clear it from the
    // UI. Old rows are retired here and the new attempt goes through.
    const pending = await sql`
      SELECT id FROM bot_control
      WHERE action = ${controlAction} AND status IN ('pending', 'claimed')
        AND payload->>'number' = ${number}
        AND created_at > NOW() - INTERVAL '2 minutes'
      ORDER BY id DESC LIMIT 1
    `;
    if (pending.length) {
      return NextResponse.json({ error: 'A request for this number is already in progress.' }, { status: 409 });
    }
    await sql`
      UPDATE bot_control
      SET status = 'expired', result = 'Timed out — the bot never picked this up'
      WHERE action = ${controlAction} AND status IN ('pending', 'claimed')
        AND payload->>'number' = ${number}
    `;

    const rows = await sql`
      INSERT INTO bot_control (action, payload, status, bot_id)
      VALUES (${controlAction}, ${JSON.stringify(payload)}::jsonb, 'pending', ${resolved.named ? bot.id : ''})
      RETURNING id
    `;

    // ── Clear the number here and now ───────────────────────────────────────
    // Queuing alone meant the device stayed in the list until the bot polled
    // (≤15s) and then again until its heartbeat dropped the number: a removal
    // the user could watch fail. None of it needs the bot. The row this writes
    // is exactly the row the bot writes when it applies the request, so it is
    // written now, in the request that asked for it — the list is correct the
    // moment the response is. The bot still does the part only it can do
    // (logout, wipe the session folder); if it is offline the database is
    // already right and the request waits for it in bot_control.
    //
    // Failure here is not fatal: the queued request still runs.
    let cleared = false;
    if (account) {
      try {
        if (action === 'delete') {
          await sql`
            DELETE FROM "WhatsAppSession"
            WHERE "phoneNumber" = ${number}
              AND ("userId" = ${account.id} OR "userId" IS NULL)
          `;
        } else {
          await sql`
            UPDATE "WhatsAppSession"
            SET status = 'INACTIVE', "updatedAt" = CURRENT_TIMESTAMP
            WHERE "phoneNumber" = ${number}
              AND ("userId" = ${account.id} OR "userId" IS NULL)
          `;
        }
        cleared = true;
      } catch (e) {
        console.warn('[pair][unlink] could not clear the session row:', e.message);
      }
    }

    return NextResponse.json({ requestId: rows[0].id, number, action, bot: bot.id, cleared });
  } catch (e) {
    console.error('Pair manage error:', e.message);
    return NextResponse.json({ error: 'Failed to start the action. Try again.' }, { status: 500 });
  }
}
