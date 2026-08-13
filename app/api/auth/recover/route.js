// MZAZI API — POST /api/auth/recover
// Answer the security question correctly to set a new password.
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { email, answer, newPassword } = await request.json();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanAnswer = String(answer || '').trim().toLowerCase();

    if (!cleanEmail || !cleanAnswer || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (String(newPassword).length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, google_id, security_question, security_answer
      FROM users WHERE email = ${cleanEmail} LIMIT 1
    `;
    if (!rows.length) {
      return NextResponse.json({ error: 'No account found with this email.' }, { status: 404 });
    }
    const user = rows[0];
    if (!user.security_answer) {
      return NextResponse.json(
        { error: 'No security question set on this account. Please contact support.' },
        { status: 400 }
      );
    }

    const answerOk = await bcrypt.compare(cleanAnswer, user.security_answer);
    if (!answerOk) {
      return NextResponse.json({ error: 'Incorrect answer. Please try again.' }, { status: 401 });
    }

    const hashed = await bcrypt.hash(String(newPassword), 12);
    await sql`UPDATE users SET password = ${hashed} WHERE id = ${user.id}`;

    return NextResponse.json({ message: 'Password updated. You can now sign in with your new password.' });
  } catch (e) {
    console.error('Recover error:', e.message);
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
