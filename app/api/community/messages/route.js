import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mzazi-admin-secret-2024';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS community_messages (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER,
      user_name   VARCHAR(255) NOT NULL,
      message     TEXT NOT NULL,
      role        VARCHAR(50) DEFAULT 'user',
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

async function getAuth() {
  const cookieStore = await cookies();
  
  // Check Admin first
  const adminToken = cookieStore.get('admin_token');
  if (adminToken) {
    try {
      const decoded = jwt.verify(adminToken.value, ADMIN_JWT_SECRET);
      if (decoded.role === 'admin') return { id: 0, name: 'Dominic (Founder)', role: 'admin' };
    } catch {}
  }

  // Check User
  const token = cookieStore.get('token');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token.value, JWT_SECRET);
    const users = await sql`SELECT * FROM users WHERE id = ${decoded.userId}`;
    const user = users[0];
    if (!user) return null;
    const name = user.fullname || ((user.firstname || '') + ' ' + (user.lastname || '')).trim() || user.email;
    return { id: user.id, name, role: 'user' };
  } catch { return null; }
}

// GET /api/community/messages — fetch latest messages
export async function GET(request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const lastId = parseInt(searchParams.get('lastId') || '0');

    const messages = await sql`
      SELECT * FROM community_messages 
      WHERE id > ${lastId}
      ORDER BY created_at ASC 
      LIMIT 100
    `;
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/community/messages — send a message
export async function POST(request) {
  try {
    const auth = await getAuth();
    if (!auth) return NextResponse.json({ error: 'Please log in' }, { status: 401 });

    const { message } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    await ensureTable();
    
    const result = await sql`
      INSERT INTO community_messages (user_id, user_name, message, role)
      VALUES (${auth.id}, ${auth.name}, ${message.trim()}, ${auth.role})
      RETURNING *
    `;
    
    return NextResponse.json({ message: result[0] });
  } catch (error) {
    console.error('Community message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
