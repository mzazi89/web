// MZAZI API — POST /api/account/password
// Change the password of the signed-in customer. Requires the current password
// (a stolen session alone must not be enough to lock the owner out), and the
// comparison happens against the bcrypt hash in `users.password`.
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '@/lib/api/web-auth';
import { ipRateLimit, clientIp } from '@/lib/ip-limiter';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

export async function POST(request) {
  try {
    const user = await requireUser();

    // Password changes are a credential-guessing target; keep them slow.
    const limit = ipRateLimit(`pw:${clientIp(request)}`, { max: 5, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const current = String(body.currentPassword || '');
    const next = String(body.newPassword || '');

    if (!current || !next) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
    }
    if (next.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }
    if (next === current) {
      return NextResponse.json({ error: 'New password must be different from the current one' }, { status: 400 });
    }

    const rows = await sql`SELECT id, password FROM users WHERE id = ${user.id} LIMIT 1`;
    const row = rows[0];
    if (!row?.password) {
      return NextResponse.json({ error: 'This account has no password set' }, { status: 400 });
    }

    const matches = await bcrypt.compare(current, row.password);
    if (!matches) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const hash = await bcrypt.hash(next, 10);
    await sql`UPDATE users SET password = ${hash} WHERE id = ${user.id}`;

    return NextResponse.json({ message: 'Password updated' });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[account] password change failed:', e.message);
    return NextResponse.json({ error: 'Could not update the password' }, { status: 500 });
  }
}
