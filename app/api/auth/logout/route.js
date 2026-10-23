import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth, clerkClient } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // When Clerk is in charge there are two sessions to end: ours (the `token`
    // cookie) and Clerk's. Revoking server-side matters — leaving Clerk's
    // session alive would let the next visit to /login silently sign the user
    // back in through clerk-sync.
    if (process.env.CLERK_SECRET_KEY) {
      try {
        const { sessionId } = await auth();
        if (sessionId) await clerkClient.sessions.revokeSession(sessionId);
      } catch (err) {
        console.warn('[logout] Clerk session not revoked:', err?.message || err);
      }
    }

    const cookieStore = await cookies();
    cookieStore.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
