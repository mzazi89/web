// Clerk configuration switch.
//
// The migration is env-driven on purpose: a deploy with no Clerk keys keeps
// running on the existing JWT login, so the site can never be taken down by a
// half-configured auth change. The moment both keys exist, Clerk takes over.
//
// NEXT_PUBLIC_* values are inlined at build time, which is why they are read
// as literal `process.env.X` expressions rather than through a helper.

export const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
export const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';

// Server-side: needs both halves before we hand identity over to Clerk.
export const clerkEnabled = Boolean(clerkPublishableKey && clerkSecretKey);

// Client-side: only the publishable key is visible in the browser bundle, so
// components gate on this instead of the pair above.
export const clerkEnabledClient = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export const CLERK_APPEARANCE = {
  variables: {
    colorPrimary: '#2563eb',
    colorBackground: '#0b1220',
    colorText: '#e8eefc',
    colorInputBackground: '#0f172a',
    colorInputText: '#e8eefc',
    borderRadius: '12px',
  },
};
