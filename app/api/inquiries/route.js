import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

// Ensure the inquiries table always exists before any operation
async function ensureInquiriesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS inquiries (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_email  VARCHAR(255),
      user_name   VARCHAR(255),
      subject     VARCHAR(255) NOT NULL,
      message     TEXT NOT NULL,
      status      VARCHAR(50) DEFAULT 'open',
      admin_reply TEXT,
      replied_at  TIMESTAMP,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token.value, JWT_SECRET);
    const users = await sql`SELECT * FROM users WHERE id = ${decoded.userId}`;
    return users[0] || null;
  } catch {
    return null;
  }
}

// POST /api/inquiries — member submits an inquiry
export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Please log in to send an inquiry' }, { status: 401 });
    }

    const { subject, message } = await request.json();
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }
    if (subject.length > 255) {
      return NextResponse.json({ error: 'Subject is too long (max 255 characters)' }, { status: 400 });
    }

    await ensureInquiriesTable();

    const fullname = user.fullname ||
      ((user.firstname || '') + ' ' + (user.lastname || '')).trim() ||
      user.email;

    await sql`
      INSERT INTO inquiries (user_id, user_email, user_name, subject, message)
      VALUES (${user.id}, ${user.email}, ${fullname}, ${subject.trim()}, ${message.trim()})
    `;

    return NextResponse.json({ message: 'Inquiry sent successfully. We will reply within 2 hours.' });
  } catch (error) {
    console.error('Inquiry POST error:', error);
    return NextResponse.json({ error: 'Failed to send inquiry', detail: error.message }, { status: 500 });
  }
}

// GET /api/inquiries — member views their own inquiries (with admin replies)
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureInquiriesTable();

    const inquiries = await sql`
      SELECT id, subject, message, status, admin_reply, replied_at, created_at
      FROM inquiries
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('Inquiry GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiries', detail: error.message }, { status: 500 });
  }
}
