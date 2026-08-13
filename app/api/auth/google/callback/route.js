// MZAZI API — Google OAuth callback (via Supabase Auth)
// Supabase/Google redirects here with ?code=; we exchange it for a session,
// map the Supabase user to the site's users row and mint the session cookie.
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, findOrCreateAppUser, mintSessionCookie } from '@/lib/supabaseAuth';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://mzazi.shop';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!isSupabaseConfigured || !code) {
    return NextResponse.redirect(`${BASE_URL}/login?error=google_failed`);
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      return NextResponse.redirect(`${BASE_URL}/login?error=google_failed`);
    }

    const user = await findOrCreateAppUser(data.user);
    if (!user) {
      return NextResponse.redirect(`${BASE_URL}/login?error=google_failed`);
    }

    mintSessionCookie(user);
    return NextResponse.redirect(`${BASE_URL}/dashboard`);
  } catch (e) {
    console.error('Google OAuth callback error:', e.message);
    return NextResponse.redirect(`${BASE_URL}/login?error=google_failed`);
  }
}
