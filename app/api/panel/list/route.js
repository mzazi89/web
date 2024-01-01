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

    const panels = await sql`
      SELECT * FROM panels WHERE user_id = ${decoded.userId} ORDER BY created_at DESC
    `;

    return NextResponse.json({ panels });
  } catch (error) {
    console.error('Panel list error:', error);
    return NextResponse.json({ error: 'Failed to fetch panels' }, { status: 500 });
  }
}
