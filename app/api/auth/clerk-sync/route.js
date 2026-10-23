// POST /api/auth/clerk-sync
//
// The bridge between Clerk and the rest of the site.
//
// Clerk owns identity; the app still authorises with the `token` cookie that
// every wallet/panel/VPS route reads. After a Clerk sign-in this endpoint
// resolves the Clerk user to a row in `users` — by clerk_id first, then by
// email, and creates one if neither matches — then mints the same JWT the
// password login mints. That way all 26 existing routes keep working untouched
// and existing customers keep their wallet, orders and servers.

import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });
const JWT_SECRET = process.env.JWT_SECRET;

const COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
};

export async function POST() {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      return NextResponse.json({ error: 'Clerk is not configured' }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No Clerk session' }, { status: 401 });
    }

    const clerkUser = await clerkClient.users.getUser(userId);

    const primary =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId) ||
      clerkUser.emailAddresses[0];
    const email = primary?.emailAddress?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'Your Clerk account has no email address on it.' },
        { status: 400 }
      );
    }

    // 1. Already linked.
    let rows = await sql`
      SELECT id, firstname, lastname, email, role, status
      FROM users WHERE clerk_id = ${userId} LIMIT 1
    `;

    // 2. Existing customer with the same email — link instead of duplicating,
    //    so their wallet, orders and servers stay attached.
    if (rows.length === 0) {
      const byEmail = await sql`
        SELECT id FROM users WHERE lower(email) = ${email} LIMIT 1
      `;
      if (byEmail.length > 0) {
        await sql`
          UPDATE users SET clerk_id = ${userId}, google_id = COALESCE(google_id, NULL)
          WHERE id = ${byEmail[0].id}
        `;
        rows = await sql`
          SELECT id, firstname, lastname, email, role, status
          FROM users WHERE id = ${byEmail[0].id} LIMIT 1
        `;
      }
    }

    // 3. Brand-new account.
    if (rows.length === 0) {
      const firstname = (clerkUser.firstName || '').trim();
      const lastname = (clerkUser.lastName || '').trim();
      const fullname =
        [firstname, lastname].filter(Boolean).join(' ') || email.split('@')[0];

      rows = await sql`
        INSERT INTO users (firstname, lastname, fullname, email, password, clerk_id)
        VALUES (${firstname}, ${lastname}, ${fullname}, ${email}, NULL, ${userId})
        RETURNING id, firstname, lastname, email, role, status
      `;

      // Wallet row, so the balance endpoint has something to read.
      try {
        await sql`INSERT INTO wallet (user_id) VALUES (${rows[0].id}) ON CONFLICT (user_id) DO NOTHING`;
      } catch (err) {
        console.warn('[clerk-sync] wallet row skipped:', err?.message || err);
      }
    }

    const user = rows[0];
    if (user.status && user.status !== 'active') {
      return NextResponse.json(
        { error: 'This account is suspended. Contact support.' },
        { status: 403 }
      );
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('token', token, COOKIE);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[clerk-sync] failed:', error);
    return NextResponse.json({ error: 'Could not complete sign-in' }, { status: 500 });
  }
}
