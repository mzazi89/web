import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseAuth';

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
      supabase_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  // add columns if upgrading from old schema that only had fullname
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname VARCHAR(255) NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname  VARCHAR(255) NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_id VARCHAR(255)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id) WHERE supabase_id IS NOT NULL`;

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

    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: 'Authentication is not configured yet. Please try again later.' }, { status: 503 });
    }

    // Auto-migrate schema so signup works even on a fresh / old database
    await ensureSchema();

    const cleanEmail = String(email).trim().toLowerCase();

    // Create the Supabase Auth account (owns the password)
    const { data: sbData, error: sbError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: `${firstname} ${lastname}` } },
    });
    if (sbError) {
      if (/already registered/i.test(sbError.message)) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: sbError.message }, { status: 400 });
    }
    if (!sbData.user) {
      return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
    }

    // Save the site-side profile + security question (password lives in Supabase)
    const hashedSecurityAnswer = await bcrypt.hash(String(securityAnswer).trim().toLowerCase(), 12);
    const fullname = `${firstname} ${lastname}`;

    // Resolve the referrer from their referral code (if provided)
    const { resolveReferralCode, generateReferralCode } = await import('@/lib/api/referral');
    const referredBy = referral_code ? await resolveReferralCode(referral_code) : null;

    let newCode = generateReferralCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await sql`SELECT id FROM users WHERE referral_code = ${newCode} LIMIT 1`;
      if (clash.length === 0) break;
      newCode = generateReferralCode();
    }

    const result = await sql`
      INSERT INTO users (firstname, lastname, fullname, email, referral_code, referred_by, security_question, security_answer, supabase_id)
      VALUES (${firstname}, ${lastname}, ${fullname}, ${cleanEmail}, ${newCode}, ${referredBy}, ${securityQuestion}, ${hashedSecurityAnswer}, ${sbData.user.id})
      ON CONFLICT (email) DO UPDATE SET
        supabase_id = EXCLUDED.supabase_id
      RETURNING id
    `;

    const userId = result[0].id;

    // Create wallet for the new user
    await sql`
      INSERT INTO wallet (user_id, balance)
      VALUES (${userId}, 0.00)
      ON CONFLICT (user_id) DO NOTHING
    `;

    const needsConfirmation = !sbData.session;
    return NextResponse.json({
      message: needsConfirmation
        ? 'Account created! Check your email to confirm your account, then sign in.'
        : 'Account created successfully',
      userId,
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Signup failed', detail: error.message }, { status: 500 });
  }
}
