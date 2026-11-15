// MZAZI API — GET /api/data/history
import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api/session';
import { listPurchases } from '@/lib/daraja/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await optionalUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const rows = await listPurchases(user.id).catch(() => []);
  return NextResponse.json({ purchases: rows });
}
