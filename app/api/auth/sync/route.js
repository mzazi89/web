// MZAZI API — POST /api/auth/sync
// Called by the client right after a successful Clerk sign-in/sign-up.
// Verifies the Clerk session server-side, maps the Clerk user to the site's
// users row (creating it if needed) and mints the site session cookie.
//
// Optional body (signup extras, applied when a NEW users row is created):
//   { securityQuestion, securityAnswer, referral_code }
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { ensureSchema, findOrCreateAppUser, mintSessionCookie } from '@/lib/clerkAuth';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await ensureSchema();

    const clerkUser = await clerkClient.users.getUser(userId);
    const user = await findOrCreateAppUser(clerkUser);
    if (!user) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    // Signup extras — security question/answer + referral are only useful on
    // first creation; failures here must not break the sign-in itself.
    try {
      const body = await request.json();
      const extras = [];

      if (body && body.securityQuestion && body.securityAnswer && String(body.securityAnswer).length >= 2) {
        const hashedAnswer = await bcrypt.hash(String(body.securityAnswer).trim().toLowerCase(), 12);
        extras.push(
          sql`UPDATE users SET security_question = ${body.securityQuestion}, security_answer = ${hashedAnswer} WHERE id = ${user.id}`
        );
      }

      if (body && body.referral_code) {
        const { resolveReferralCode, generateReferralCode } = await import('@/lib/api/referral');
        const referredBy = await resolveReferralCode(body.referral_code);
        if (referredBy) {
          extras.push(sql`UPDATE users SET referred_by = ${referredBy} WHERE id = ${user.id}`);
        }
        if (!user.referral_code) {
          let code = generateReferralCode();
          for (let attempt = 0; attempt < 5; attempt++) {
            const clash = await sql`SELECT id FROM users WHERE referral_code = ${code} LIMIT 1`;
            if (clash.length === 0) break;
            code = generateReferralCode();
          }
          extras.push(sql`UPDATE users SET referral_code = ${code} WHERE id = ${user.id}`);
        }
      }

      if (extras.length) await Promise.all(extras);
    } catch (e) {
      console.warn('Sync extras skipped:', e.message);
    }

    mintSessionCookie(user);

    return NextResponse.json({
      message: 'OK',
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
