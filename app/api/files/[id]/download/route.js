// MZAZI API — GET /api/files/[id]/download
//
// Delivers a bot file (BugBot / standard bot) uploaded from the admin panel.
//
// Access rules, in order:
//   1. signed in                        (401 otherwise)
//   2. file exists and is active        (404 otherwise)
//   3. free, or a purchase row exists   (402 otherwise)
//
// Paid files are gated in SQL on `bot_file_purchases`, so guessing an id cannot
// pull a paid artefact. Downloads are counted on the row for the admin's shelf.

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

async function viewerId() {
  const store = await cookies();
  const token = store.get('token');
  if (!token?.value) return null;
  try {
    const d = jwt.verify(token.value, process.env.JWT_SECRET);
    return d?.userId || null;
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  const uid = await viewerId();
  if (!uid) return NextResponse.json({ error: 'Sign in to download this file.' }, { status: 401 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await sql`
    SELECT id, name, file_name, mime, content, price, active
    FROM bot_files
    WHERE id = ${id} AND active = true
    LIMIT 1
  `.catch(() => []);
  const file = rows[0];
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (Number(file.price) > 0) {
    const owned = await sql`
      SELECT 1 FROM bot_file_purchases WHERE user_id = ${uid} AND file_id = ${id} LIMIT 1
    `.catch(() => []);
    if (!owned[0]) {
      return NextResponse.json({ error: 'Purchase this file to download it.' }, { status: 402 });
    }
  }

  await sql`UPDATE bot_files SET downloads = downloads + 1 WHERE id = ${id}`.catch(() => {});

  const bytes = Buffer.from(String(file.content), 'base64');
  const safeName = String(file.file_name || `${file.name.replace(/[^\w.-]+/g, '-')}.zip`).replace(/["\\\r\n]/g, '');

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': file.mime || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Content-Length': String(bytes.length),
      'Cache-Control': 'no-store',
    },
  });
}
