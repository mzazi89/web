// MZAZI API — Google OAuth start (via Supabase Auth)
// Redirects the user to Supabase's Google consent flow. The Google provider
// must be enabled in the Supabase dashboard (Authentication → Providers).
import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseAuth';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://mzazi.shop';

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.redirect(`${BASE_URL}/login?error=google_not_configured`);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${BASE_URL}/api/auth/google/callback`,
    },
  });

  if (error || !data.url) {
    console.error('Google OAuth start error:', error?.message || 'no url');
    return NextResponse.redirect(`${BASE_URL}/login?error=google_failed`);
  }

  return NextResponse.redirect(data.url);
}
