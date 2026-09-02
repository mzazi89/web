// MZAZI API — GET /api/vps/my
// The buyer's purchased VPS servers (with credentials) — shown on the dashboard.
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ensureVpsSchema, listMyVps } from '@/lib/vps';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = jwt.verify(token.value, JWT_SECRET);
    if (!decoded?.userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await ensureVpsSchema();
    const vps = await listMyVps(decoded.userId);
    return NextResponse.json({ vps });
  } catch (e) {
    console.error('My VPS error:', e.message);
    return NextResponse.json({ error: 'Failed to load your VPS servers' }, { status: 500 });
  }
}
