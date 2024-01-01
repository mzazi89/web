import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { firstname, lastname, email, password } = await request.json();

    if (!firstname || !lastname || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const fullname = `${firstname} ${lastname}`;

    const result = await sql`
      INSERT INTO users (firstname, lastname, fullname, email, password)
      VALUES (${firstname}, ${lastname}, ${fullname}, ${email}, ${hashedPassword})
      RETURNING id
    `;

    const userId = result[0].id;

    // Create wallet for new user
    await sql`
      INSERT INTO wallet (user_id, balance)
      VALUES (${userId}, 0.00)
      ON CONFLICT (user_id) DO NOTHING
    `;

    return NextResponse.json({ message: 'Account created successfully', userId }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
