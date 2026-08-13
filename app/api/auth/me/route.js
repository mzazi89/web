import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { findOrCreateAppUser, mintSessionCookie } from '@/lib/clerkAuth';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

export async function GET() {
  try {
    const cookieStore = await cookies();

    // 1) Existing site JWT cookie — fast path
    const token = cookieStore.get('token');
    if (token) {
      const decoded = jwt.verify(token.value, JWT_SECRET);
      const rows = await sql`
        SELECT id, firstname, lastname, fullname, email, created_at
        FROM users WHERE id = ${decoded.userId}
      `;
      if (rows.length) {
        return NextResponse.json({ user: rows[0] });
      }
    }

    // 2) Clerk session fallback — map the Clerk user to the site's users row
    //    and mint the site cookie, so existing consumers work unchanged.
    const { userId } = await auth();
    if (userId) {
      const clerkUser = await clerkClient.users.getUser(userId);
      const user = await findOrCreateAppUser(clerkUser);
      if (user) {
        mintSessionCookie(user);
        return NextResponse.json({
          user: {
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            fullname: user.fullname,
            email: user.email,
            created_at: user.created_at,
          },
        });
      }
    }

    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }
}
