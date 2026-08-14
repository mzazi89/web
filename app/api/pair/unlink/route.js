// MZAZI API — POST /api/pair/unlink
// Manage a linked WhatsApp device: unlink | delete | pause | resume.
// Asks the running bot to perform the action (ownership enforced).
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { ensureDatabase } from '@/lib/database';
import { auth, normalizeNumber, getAccount } from '@/lib/pairApi';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

const ACTIONS = ['unlink', 'delete', 'pause', 'resume'];

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

    // Map the user-facing action to the bot control + payload
    let controlAction, payload;
    if (action === 'delete') {
      controlAction = 'unpair';
      payload = { number, accountId: user.userId, mode: 'delete' };
    } else if (action === 'pause' || action === 'resume') {
      controlAction = 'pause';
      payload = { number, accountId: user.userId, paused: action === 'pause' };
    } else {
      controlAction = 'unpair';
      payload = { number, accountId: user.userId };
    }

    const pending = await sql`
      SELECT id FROM bot_control
      WHERE action = ${controlAction} AND status IN ('pending', 'claimed')
        AND payload->>'number' = ${number}
      ORDER BY id DESC LIMIT 1
    `;
    if (pending.length) {
      return NextResponse.json({ error: 'A request for this number is already in progress.' }, { status: 409 });
    }

    const rows = await sql`
      INSERT INTO bot_control (action, payload, status)
      VALUES (${controlAction}, ${JSON.stringify(payload)}::jsonb, 'pending')
      RETURNING id
    `;
    return NextResponse.json({ requestId: rows[0].id, number, action });
  } catch (e) {
    console.error('Pair manage error:', e.message);
    return NextResponse.json({ error: 'Failed to start the action. Try again.' }, { status: 500 });
  }
}
