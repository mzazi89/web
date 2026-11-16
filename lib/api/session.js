// MZAZI API — "who is this, possibly nobody".
//
// requireUser() throws UNAUTHORIZED when the cookie is missing or stale, which is
// the right contract for code that must not continue. Routes that answer 401
// themselves need the other shape: a null they can test. Without this, an
// anonymous request turned into a 500 and the page showed "network error".
import { requireUser } from './web-auth';

export async function optionalUser() {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}

/**
 * How a customer's own name is shown to other people.
 *
 * Reviews and comments are public, so the name printed beside them must be the
 * one on the account — never something typed into a box. Prefers the real name,
 * then the full name, the username, and finally the email local part, so a
 * half-filled profile still produces something human.
 */
export function displayNameOf(user) {
  if (!user) return 'MZAZI customer';
  const full = [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
  return (
    full ||
    String(user.fullname || '').trim() ||
    String(user.username || '').trim() ||
    String(user.email || '').split('@')[0] ||
    'MZAZI customer'
  );
}
