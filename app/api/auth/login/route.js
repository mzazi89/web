// MZAZI API — POST /api/auth/login
// Email + password are verified by Supabase Auth; on success we map the
// Supabase user to the site's users row and mint the session cookie.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { supabase, isSupabaseConfigured, findOrCreateAppUser, mintSessionCookie } from '@/lib/supabaseAuth';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: 'Authentication is not configured yet. Please try again later.' }, { status: 503 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = await findOrCreateAppUser(data.user);
    if (!user) {
      return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }

    mintSessionCookie(user);

    return NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, firstname: user.firstname, lastname: user.lastname, fullname: user.fullname, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }
}
