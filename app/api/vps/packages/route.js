// MZAZI API — GET /api/vps/packages
// Public listing of active VPS packages with live stock counts.
import { NextResponse } from 'next/server';
import { ensureVpsSchema, listPublicVpsPackages } from '@/lib/vps';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureVpsSchema();
    const packages = await listPublicVpsPackages();
    return NextResponse.json({ packages });
  } catch (e) {
    console.error('VPS packages error:', e.message);
    return NextResponse.json({ error: 'Failed to load VPS packages' }, { status: 500 });
  }
}
