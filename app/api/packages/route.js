import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    // Ensure new columns exist (safe on re-run)
    await sql`ALTER TABLE packages ADD COLUMN IF NOT EXISTS expires_after_hours INTEGER DEFAULT NULL`;

    const packages = await sql`
      SELECT id, name, price, cpu, ram, disk, description, popular, accent, expires_after_hours
      FROM packages
      WHERE active = true
      ORDER BY sort_order ASC, id ASC
    `;
    return NextResponse.json({ packages }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (error) {
    console.error('Packages fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}