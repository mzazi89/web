import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import { loadAvatar } from '@/lib/avatar';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const rows = await sql`
      SELECT id, firstname, lastname, fullname, email, created_at 
      FROM users WHERE id = ${decoded.userId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // The photo is fetched separately so /me keeps working on a database whose
    // avatar columns have not been created yet.
    const avatar = await loadAvatar(rows[0].id);

    return NextResponse.json({ user: { ...rows[0], avatar } });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }
}
