import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

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

async function ensureMessagesTable() {
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

// GET /api/inquiries/[id] — get all messages for a thread
export async function GET(request, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await ensureMessagesTable();

  // Verify inquiry belongs to user
  const inqRows = await sql`SELECT * FROM inquiries WHERE id = ${parseInt(id)} AND user_id = ${user.id}`;
  if (inqRows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const messages = await sql`
    SELECT id, sender, message, created_at
    FROM inquiry_messages
    WHERE inquiry_id = ${parseInt(id)}
    ORDER BY created_at ASC
  `;

  return NextResponse.json({ inquiry: inqRows[0], messages });
}

// POST /api/inquiries/[id] — user sends follow-up message
export async function POST(request, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { message } = await request.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

  await ensureMessagesTable();

  // Verify inquiry belongs to user
  const inqRows = await sql`SELECT * FROM inquiries WHERE id = ${parseInt(id)} AND user_id = ${user.id}`;
  if (inqRows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sql`
    INSERT INTO inquiry_messages (inquiry_id, sender, message)
    VALUES (${parseInt(id)}, 'user', ${message.trim()})
  `;

  // Re-open inquiry if it was replied/closed
  await sql`UPDATE inquiries SET status = 'open', updated_at = NOW() WHERE id = ${parseInt(id)}`;

  return NextResponse.json({ message: 'Message sent' });
}
