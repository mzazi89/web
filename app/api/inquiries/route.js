import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

async function ensureTables() {
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
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
  await sql`
    CREATE TABLE IF NOT EXISTS inquiry_messages (
      id          SERIAL PRIMARY KEY,
      inquiry_id  INTEGER REFERENCES inquiries(id) ON DELETE CASCADE,
      sender      VARCHAR(20) NOT NULL DEFAULT 'user',
      message     TEXT NOT NULL,
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
  } catch { return null; }
}

// POST /api/inquiries — member opens a new inquiry thread
export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Please log in to send an inquiry' }, { status: 401 });

    const { subject, message } = await request.json();
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }
    if (subject.length > 255) {
      return NextResponse.json({ error: 'Subject is too long (max 255 characters)' }, { status: 400 });
    }

    await ensureTables();

    const fullname = user.fullname ||
      ((user.firstname || '') + ' ' + (user.lastname || '')).trim() ||
      user.email;

    const result = await sql`
      INSERT INTO inquiries (user_id, user_email, user_name, subject, message)
      VALUES (${user.id}, ${user.email}, ${fullname}, ${subject.trim()}, ${message.trim()})
      RETURNING id
    `;

    const inquiryId = result[0].id;

    // Also save the opening message in inquiry_messages
    await sql`
      INSERT INTO inquiry_messages (inquiry_id, sender, message)
      VALUES (${inquiryId}, 'user', ${message.trim()})
    `;

    return NextResponse.json({ message: 'Inquiry sent successfully. We will reply within 2 hours.', id: inquiryId });
  } catch (error) {
    console.error('Inquiry POST error:', error);
    return NextResponse.json({ error: 'Failed to send inquiry', detail: error.message }, { status: 500 });
  }
}

// GET /api/inquiries — member views their inquiry threads
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureTables();

    const inquiries = await sql`
      SELECT
        i.id, i.subject, i.message, i.status, i.admin_reply,
        i.replied_at, i.created_at, i.updated_at,
        (
          SELECT COUNT(*) FROM inquiry_messages im
          WHERE im.inquiry_id = i.id
        ) AS message_count,
        (
          SELECT message FROM inquiry_messages im
          WHERE im.inquiry_id = i.id
          ORDER BY im.created_at DESC LIMIT 1
        ) AS last_message,
        (
          SELECT sender FROM inquiry_messages im
          WHERE im.inquiry_id = i.id
          ORDER BY im.created_at DESC LIMIT 1
        ) AS last_sender
      FROM inquiries i
      WHERE i.user_id = ${user.id}
      ORDER BY COALESCE(i.updated_at, i.created_at) DESC
    `;

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('Inquiry GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiries', detail: error.message }, { status: 500 });
  }
}
