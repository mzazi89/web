// MZAZI API — POST /api/account/profile
// Update the display name on the signed-in account.
//
// Email is deliberately not editable here: changing it without a verification
// round-trip would let a borrowed session move the account to an address the
// attacker owns. That flow belongs to the recovery endpoints, not this one.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '@/lib/api/web-auth';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

const clean = (v, max = 60) => String(v || '').trim().replace(/\s+/g, ' ').slice(0, max);

export async function POST(request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));

    const firstname = clean(body.firstname, 40);
    const lastname = clean(body.lastname, 40);

    if (!firstname) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }

    const fullname = [firstname, lastname].filter(Boolean).join(' ');

    await sql`
      UPDATE users
      SET firstname = ${firstname}, lastname = ${lastname || null}, fullname = ${fullname}
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ message: 'Profile updated', user: { firstname, lastname, fullname } });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[account] profile update failed:', e.message);
    return NextResponse.json({ error: 'Could not update the profile' }, { status: 500 });
  }
}
