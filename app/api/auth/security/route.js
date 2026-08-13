// MZAZI API — /api/auth/security
// GET  → the logged-in user's security question (if set)
// POST → set / update the security question + answer
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  if (!token) return null;
  try {
    return jwt.verify(token.value, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await auth();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const rows = await sql`SELECT security_question FROM users WHERE id = ${user.userId} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ question: rows[0].security_question || null });
  } catch (e) {
    console.error('Security GET error:', e.message);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await auth();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { question, answer } = await request.json();
    if (!question || !answer || String(answer).length < 2) {
      return NextResponse.json({ error: 'Choose a question and provide an answer (min 2 characters).' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(String(answer).trim().toLowerCase(), 12);
    await sql`
      UPDATE users SET security_question = ${question}, security_answer = ${hashed}
      WHERE id = ${user.userId}
    `;
    return NextResponse.json({ message: 'Security question saved.' });
  } catch (e) {
    console.error('Security POST error:', e.message);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
