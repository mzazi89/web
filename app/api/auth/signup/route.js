import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

// Run schema migrations inline so signup always works even if init-db was never called
async function ensureSchema() {
  // users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      firstname VARCHAR(255) NOT NULL DEFAULT '',
      lastname  VARCHAR(255) NOT NULL DEFAULT '',
      fullname  VARCHAR(255),
      email     VARCHAR(255) UNIQUE NOT NULL,
      password  VARCHAR(255),
      google_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  // add columns if upgrading from old schema that only had fullname
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname VARCHAR(255) NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname  VARCHAR(255) NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`;

  // wallet table
  await sql`
    CREATE TABLE IF NOT EXISTS wallet (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) UNIQUE NOT NULL,
      balance    DECIMAL(10,2) DEFAULT 0.00,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // wallet_transactions table
  await sql`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id),
      type        VARCHAR(50) NOT NULL,
      amount      DECIMAL(10,2) NOT NULL,
      reference   VARCHAR(255),
      description TEXT,
      status      VARCHAR(50) DEFAULT 'pending',
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // panels table
  await sql`
    CREATE TABLE IF NOT EXISTS panels (
      id               SERIAL PRIMARY KEY,
      user_id          INTEGER REFERENCES users(id),
      ptero_server_id  INTEGER,
      ptero_user_id    INTEGER,
      ptero_username   VARCHAR(255),
      package_name     VARCHAR(255),
      package_price    DECIMAL(10,2),
      nest_id          INTEGER,
      egg_id           INTEGER,
      status           VARCHAR(50) DEFAULT 'active',
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export async function POST(request) {
  try {
    const { firstname, lastname, email, password } = await request.json();

    if (!firstname || !lastname || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Auto-migrate schema so signup works even on a fresh / old database
    await ensureSchema();

    // Check if user already exists
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

    // Create wallet for the new user
    await sql`
      INSERT INTO wallet (user_id, balance)
      VALUES (${userId}, 0.00)
      ON CONFLICT (user_id) DO NOTHING
    `;

    return NextResponse.json({ message: 'Account created successfully', userId }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    // Return the real DB error message so it's visible during debugging
    return NextResponse.json(
      { error: 'Signup failed', detail: error.message },
      { status: 500 }
    );
  }
}
