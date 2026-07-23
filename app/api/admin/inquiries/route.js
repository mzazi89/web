import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mzazi-admin-secret-2024';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');
  if (!token) return false;
  try { const d = jwt.verify(token.value, ADMIN_JWT_SECRET); return d.role === 'admin'; }
  catch { return false; }
}

export async function GET() {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const inquiries = await sql`
      SELECT i.*, u.email AS user_email, u.fullname AS user_name
      FROM inquiries i
      LEFT JOIN users u ON u.id = i.user_id
      ORDER BY i.created_at DESC
    `;
    return NextResponse.json({ inquiries });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id, admin_reply, status } = await request.json();
    await sql`
      UPDATE inquiries
      SET admin_reply = ${admin_reply}, status = ${status || 'replied'}, replied_at = NOW()
      WHERE id = ${id}
    `;
    return NextResponse.json({ message: 'Reply sent' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }
}
