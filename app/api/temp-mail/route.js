// MZAZI API — /api/temp-mail
//
//   POST   create an inbox (or return the one this browser already holds)
//   GET    address, expiry and the inbox listing
//   DELETE throw it away now
//
// The session id lives in an httpOnly, same-site cookie: a disposable inbox is
// still a mailbox, and it should not be readable by script on the page.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clientIp, ipRateLimit } from '@/lib/ip-limiter';
import { createMailbox, findBySid, listMessages, destroyMailbox, purgeExpired } from '@/lib/tempmail';

export const dynamic = 'force-dynamic';
const COOKIE = 'mz_tm';

const withCookie = (res, sid) => {
  res.cookies.set(COOKIE, sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60,
  });
  return res;
};

export async function GET() {
  const sid = cookies().get(COOKIE)?.value;
  try {
    const box = await findBySid(sid);
    if (!box) return NextResponse.json({ address: null, messages: [] });
    const messages = await listMessages(box);
    return NextResponse.json({ address: box.address, expiresAt: box.expires_at, messages });
  } catch (e) {
    return NextResponse.json({ error: 'Could not reach the mail service.' }, { status: 502 });
  }
}

export async function POST(request) {
  const limit = ipRateLimit(clientIp(request), { max: 6, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many inboxes from this connection — try again later.' }, { status: 429 });
  }

  const sid = cookies().get(COOKIE)?.value;
  try {
    // Reuse the current box while it is alive: pressing "new" twice should not
    // strand a working address.
    const existing = await findBySid(sid);
    if (existing) {
      return NextResponse.json({ address: existing.address, expiresAt: existing.expires_at, messages: await listMessages(existing) });
    }

    purgeExpired().catch(() => {});
    const box = await createMailbox(clientIp(request));
    return withCookie(
      NextResponse.json({ address: box.address, expiresAt: box.expires_at, messages: [] }, { status: 201 }),
      box.sid
    );
  } catch (e) {
    if (e.code === 'LIMIT') return NextResponse.json({ error: e.message }, { status: 429 });
    return NextResponse.json({ error: 'Could not create an inbox right now.' }, { status: 502 });
  }
}

export async function DELETE() {
  const sid = cookies().get(COOKIE)?.value;
  try {
    const box = await findBySid(sid);
    if (box) await destroyMailbox(box);
  } catch {}
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
