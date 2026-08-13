// MZAZI API — Google OAuth start
// Redirects the user to Google's consent screen (callback handled in
// /api/auth/google/callback). Requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET.
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://mzazi.shop';
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;

export async function GET() {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.redirect(`${BASE_URL}/login?error=google_not_configured`);
  }

  // CSRF nonce — verified when Google sends us back
  const state = crypto.randomBytes(16).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'online');
  googleAuthUrl.searchParams.set('state', state);

  return NextResponse.redirect(googleAuthUrl.toString());
}
