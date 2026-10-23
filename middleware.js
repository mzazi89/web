// Clerk middleware.
//
// Only installed when Clerk is configured. Without the keys this is a plain
// pass-through, which is what keeps a key-less deploy byte-for-byte identical
// to the old behaviour.

import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

const enabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

function passThrough() {
  return NextResponse.next();
}

export default enabled ? clerkMiddleware() : passThrough;

export const config = {
  // Everything except Next internals and static files.
  matcher: ['/((?!_next|.*\\..*).*)'],
};
