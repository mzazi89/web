// MZAZI API — POST /api/auth/signup
// Manual signup: bcrypt-hashes the password and stores it in the Neon `users`
// table along with the profile, referral code and security question.
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
      security_question VARCHAR(255),
      security_answer VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  // add columns if upgrading from old schema
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname VARCHAR(255) NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname  VARCHAR(255) NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer VARCHAR(255)`;

  // referral system
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)`;
  await sql`
    CREATE TABLE IF NOT EXISTS referral_commissions (
      id SERIAL PRIMARY KEY,
      referrer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      referred_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_id INTEGER NOT NULL UNIQUE,
      amount NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
      status VARCHAR(20) DEFAULT 'paid',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // wallet table
  await sql`
    CREATE TABLE IF NOT EXISTS wallet (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) UNIQUE NOT NULL,
      balance    DECIMAL(10,2) DEFAULT 0.00,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export async function POST(request) {
  try {
    const { firstname, lastname, email, password, referral_code, securityQuestion, securityAnswer } = await request.json();

    if (!firstname || !lastname || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (!securityQuestion || !securityAnswer) {
      return NextResponse.json(
        { error: 'Please choose a security question and answer — you need it to recover a forgotten password.' },
        { status: 400 }
      );
    }
    if (String(securityAnswer).length < 2) {
      return NextResponse.json({ error: 'Security answer must be at least 2 characters' }, { status: 400 });
    }

    // Auto-migrate schema so signup works even on a fresh / old database
    await ensureSchema();

    const cleanEmail = String(email).trim().toLowerCase();

    // Check if user already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${cleanEmail}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const hashedSecurityAnswer = await bcrypt.hash(String(securityAnswer).trim().toLowerCase(), 12);
    const fullname = `${firstname} ${lastname}`;

    // Resolve the referrer from their referral code (if provided)
    const { resolveReferralCode, generateReferralCode } = await import('@/lib/api/referral');
    const referredBy = referral_code ? await resolveReferralCode(referral_code) : null;

    // New user's own referral code (unique)
    let newCode = generateReferralCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await sql`SELECT id FROM users WHERE referral_code = ${newCode} LIMIT 1`;
      if (clash.length === 0) break;
      newCode = generateReferralCode();
    }

    const result = await sql`
      INSERT INTO users (firstname, lastname, fullname, email, password, referral_code, referred_by, security_question, security_answer)
      VALUES (${firstname}, ${lastname}, ${fullname}, ${cleanEmail}, ${hashedPassword}, ${newCode}, ${referredBy}, ${securityQuestion}, ${hashedSecurityAnswer})
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
    return NextResponse.json(
      { error: 'Signup failed', detail: error.message },
      { status: 500 }
    );
  }
}
