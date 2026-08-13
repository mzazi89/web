// MZAZI API — POST /api/pair/unlink
// Asks the running bot to disconnect + delete a linked WhatsApp device.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { ensureDatabase } from '@/lib/database';
import { auth, normalizeNumber, getAccount } from '@/lib/pairApi';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

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

    const pending = await sql`
      SELECT id FROM bot_control
      WHERE action = 'unpair' AND status IN ('pending', 'claimed')
        AND payload->>'number' = ${number}
      ORDER BY id DESC LIMIT 1
    `;
    if (pending.length) {
      return NextResponse.json({ error: 'An unlink request for this number is already in progress.' }, { status: 409 });
    }

    const rows = await sql`
      INSERT INTO bot_control (action, payload, status)
      VALUES ('unpair', ${JSON.stringify({ number, accountId: user.userId })}::jsonb, 'pending')
      RETURNING id
    `;
    return NextResponse.json({ requestId: rows[0].id, number });
  } catch (e) {
    console.error('Pair unlink error:', e.message);
    return NextResponse.json({ error: 'Failed to start unlink. Try again.' }, { status: 500 });
  }
}
