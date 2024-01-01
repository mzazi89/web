import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://official.mzazi.shop';
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;

// Step 1: Redirect to Google OAuth
export async function GET(request) {
  if (!GOOGLE_CLIENT_ID) {
    // Google OAuth not configured - redirect to login with error
    return NextResponse.redirect(`${BASE_URL}/login?error=google_not_configured`);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (code) {
    // This is the callback
    return handleCallback(code);
  }

  // Redirect to Google
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');

  return NextResponse.redirect(googleAuthUrl.toString());
}

async function handleCallback(code) {
  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${BASE_URL}/login?error=google_failed`);
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    // Upsert user
    let user;
    const existing = await sql`SELECT * FROM users WHERE email = ${googleUser.email}`;
    if (existing.length > 0) {
      user = existing[0];
      await sql`UPDATE users SET google_id = ${googleUser.id} WHERE id = ${user.id}`;
    } else {
      const nameParts = (googleUser.name || '').split(' ');
      const firstname = nameParts[0] || 'User';
      const lastname = nameParts.slice(1).join(' ') || '';
      const result = await sql`
        INSERT INTO users (firstname, lastname, fullname, email, google_id)
        VALUES (${firstname}, ${lastname}, ${googleUser.name}, ${googleUser.email}, ${googleUser.id})
        RETURNING *
      `;
      user = result[0];
      await sql`INSERT INTO wallet (user_id, balance) VALUES (${user.id}, 0.00) ON CONFLICT (user_id) DO NOTHING`;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.redirect(`${BASE_URL}/dashboard`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${BASE_URL}/login?error=google_failed`);
  }
}
