import { NextResponse } from 'next/server';
import sql from '../../../lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const packages = await sql`SELECT id, name, price, cpu, ram, disk, description, popular, accent, expires_after_hours FROM packages WHERE active = true ORDER BY sort_order ASC, id ASC`;
    return NextResponse.json({ packages }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('Packages fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}