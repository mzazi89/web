import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = jwt.verify(token.value, JWT_SECRET);

    // Ensure expires_at column exists
    await sql`ALTER TABLE panels ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL`;

    const panels = await sql`
      SELECT *, expires_at FROM panels WHERE user_id = ${decoded.userId} ORDER BY created_at DESC
    `;

    // Mark expired panels
    const now = new Date();
    const enriched = panels.map(p => ({
      ...p,
      is_expired: p.expires_at ? new Date(p.expires_at) < now : false,
      expires_at: p.expires_at || null,
    }));

    return NextResponse.json({ panels: enriched });
  } catch (error) {
    console.error('Panel list error:', error);
    return NextResponse.json({ error: 'Failed to fetch panels' }, { status: 500 });
  }
}