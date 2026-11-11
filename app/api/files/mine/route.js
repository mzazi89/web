// MZAZI API — GET /api/files/mine
// The ids of paid bot files this account already owns. Returns an empty list
// for anonymous visitors instead of 401: the catalogue calls it on every load.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ownedFileIds } from '@/lib/bot-files';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = await cookies();
  const token = store.get('token');
  if (!token?.value) return NextResponse.json({ ids: [] });
  try {
    const d = jwt.verify(token.value, process.env.JWT_SECRET);
    if (!d?.userId) return NextResponse.json({ ids: [] });
    return NextResponse.json({ ids: await ownedFileIds(d.userId) });
  } catch {
    return NextResponse.json({ ids: [] });
  }
}
