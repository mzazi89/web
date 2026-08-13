// MZAZI API — GET /api/auth/forgot?email=...
// Returns the security question for password recovery (never the answer).
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = String(searchParams.get('email') || '').trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const rows = await sql`SELECT email, google_id, supabase_id, security_question FROM users WHERE email = ${email} LIMIT 1`;
    if (!rows.length) {
      return NextResponse.json({ error: 'No account found with this email.' }, { status: 404 });
    }

    const user = rows[0];
    if ((user.google_id || user.supabase_id) && !user.security_question) {
      return NextResponse.json(
        { error: 'This account uses Google Sign-In — please sign in with Google.' },
        { status: 400 }
      );
    }
    if (!user.security_question) {
      return NextResponse.json(
        { error: 'No security question set on this account. Please contact support.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ question: user.security_question });
  } catch (e) {
    console.error('Forgot error:', e.message);
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
