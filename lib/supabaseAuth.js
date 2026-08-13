// Supabase Auth bridge — credentials are managed by Supabase (email/password,
// Google OAuth, password reset); the site keeps its existing JWT session cookie
// so every existing route keeps working unchanged.
//
// Env (Vercel):
//   NEXT_PUBLIC_SUPABASE_URL        https://<project>.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY   anon/public key
//   SUPABASE_SERVICE_ROLE_KEY       service role key (server-only, for admin ops)
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// browser-facing client (anon) — used for signIn/signUp/OAuth/exchange
export const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder', {
  auth: { persistSession: false, autoRefreshToken: false },
});

// admin client (service role) — used for password resets / legacy imports
export const supabaseAdmin = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_SERVICE_ROLE_KEY || 'placeholder', {
  auth: { persistSession: false, autoRefreshToken: false },
});

const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';
const sql = neon(process.env.DATABASE_URL);

// Map a Supabase user to the site's users row (supabase_id → email → create).
export async function findOrCreateAppUser(sbUser) {
  if (!sbUser || !sbUser.id) return null;

  const byId = await sql`SELECT * FROM users WHERE supabase_id = ${sbUser.id} LIMIT 1`;
  if (byId.length) return byId[0];

  const email = (sbUser.email || '').toLowerCase();
  if (email) {
    const byEmail = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    if (byEmail.length) {
      await sql`UPDATE users SET supabase_id = ${sbUser.id} WHERE id = ${byEmail[0].id}`;
      return byEmail[0];
    }
  }

  const nameParts = ((sbUser.user_metadata && (sbUser.user_metadata.full_name || sbUser.user_metadata.name)) || 'User').split(' ');
  const firstname = nameParts[0] || 'User';
  const lastname = nameParts.slice(1).join(' ') || '';
  const created = await sql`
    INSERT INTO users (firstname, lastname, fullname, email, supabase_id)
    VALUES (${firstname}, ${lastname}, ${(sbUser.user_metadata && (sbUser.user_metadata.full_name || sbUser.user_metadata.name)) || firstname}, ${email}, ${sbUser.id})
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
