// Clerk Auth bridge — credentials and sessions are managed by Clerk
// (email/password, Google OAuth, password reset); the site keeps its existing
// JWT session cookie (`token`) so every existing route keeps working unchanged.
//
// Env (Vercel):
//   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   pk_... (public, browser)
//   CLERK_SECRET_KEY                    sk_... (server-only)
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';

export const isClerkConfigured = Boolean(CLERK_PUBLISHABLE_KEY && CLERK_SECRET_KEY);

const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';
const sql = neon(process.env.DATABASE_URL);

// Make sure the site-side tables/columns exist (safe to run on every request).
export async function ensureSchema() {
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
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname VARCHAR(255) NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname  VARCHAR(255) NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_id VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id) WHERE clerk_id IS NOT NULL`;

  await sql`
    CREATE TABLE IF NOT EXISTS wallet (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) UNIQUE NOT NULL,
      balance    DECIMAL(10,2) DEFAULT 0.00,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// Map a Clerk user to the site's users row (clerk_id → email → create).
export async function findOrCreateAppUser(clerkUser) {
  if (!clerkUser || !clerkUser.id) return null;

  const byId = await sql`SELECT * FROM users WHERE clerk_id = ${clerkUser.id} LIMIT 1`;
  if (byId.length) return byId[0];

  const email = ((clerkUser.emailAddresses?.[0]?.emailAddress) || '').toLowerCase();
  if (email) {
    const byEmail = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    if (byEmail.length) {
      await sql`UPDATE users SET clerk_id = ${clerkUser.id} WHERE id = ${byEmail[0].id}`;
      return byEmail[0];
    }
  }

  const fullName = clerkUser.fullName || clerkUser.firstName || 'User';
  const firstname = clerkUser.firstName || fullName.split(' ')[0] || 'User';
  const lastname = clerkUser.lastName || fullName.split(' ').slice(1).join(' ') || '';

  const created = await sql`
    INSERT INTO users (firstname, lastname, fullname, email, clerk_id)
    VALUES (${firstname}, ${lastname}, ${fullName}, ${email}, ${clerkUser.id})
    RETURNING *
  `;
  await sql`INSERT INTO wallet (user_id, balance) VALUES (${created[0].id}, 0.00) ON CONFLICT (user_id) DO NOTHING`;
  return created[0];
}

// Mint the site session cookie (same shape as the previous JWT session).
export function mintSessionCookie(user) {
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const cookieStore = cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
  return token;
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete('token');
}
