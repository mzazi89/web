import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Please log in to contact admin' }, { status: 401 });
    const decoded = jwt.verify(token.value, JWT_SECRET);
    const users = await sql`SELECT * FROM users WHERE id = ${decoded.userId}`;
    const user = users[0];
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });
    const { subject, message } = await request.json();
    if (!subject || !message) return NextResponse.json({ error: 'Subject and message required' }, { status: 400 });
    const fullname = user.fullname || ((user.firstname || '') + ' ' + (user.lastname || '')).trim();
    await sql`
      INSERT INTO inquiries (user_id, user_email, user_name, subject, message)
      VALUES (${user.id}, ${user.email}, ${fullname}, ${subject}, ${message})
    `;
    return NextResponse.json({ message: 'Inquiry sent successfully' });
  } catch (error) {
    console.error('Inquiry error:', error);
    return NextResponse.json({ error: 'Failed to send inquiry' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token.value, JWT_SECRET);
    const inquiries = await sql`SELECT * FROM inquiries WHERE user_id = ${decoded.userId} ORDER BY created_at DESC`;
    return NextResponse.json({ inquiries });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}
