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
