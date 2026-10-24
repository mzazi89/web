// MZAZI TECH — where to send someone after they sign in.
//
// Every page on this site can be read without an account; only the actions
// inside them need one. So each action that hits a wall sends the visitor to
// /login?next=<the page they were on>, and the login form has to take them
// back there instead of dumping everyone on the dashboard.
//
// Only same-site absolute paths are accepted. An open redirect on a login page
// is a gift to phishing, and `//evil.com` leaves the site just as surely as
// `https://evil.com` does — the leading `//` is a protocol-relative URL.

const DEFAULT_NEXT = '/dashboard';

/**
 * @param {string|string[]|null|undefined} raw
 * @param {string} fallback
 * @returns {string} a path on this site, always starting with a single "/"
 */
export function safeNext(raw, fallback = DEFAULT_NEXT) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const path = String(value || '').trim();

  if (!path.startsWith('/')) return fallback;
  // Protocol-relative ("//host") and backslash tricks ("/\host", "/\t..") both
  // get normalised by browsers into an off-site URL.
  if (path.startsWith('//')) return fallback;
  if (/^\/\s*\\/.test(path)) return fallback;
  // Never bounce back into the auth pages themselves.
  if (/^\/(login|signup|forgot-password)\b/.test(path)) return fallback;

  return path;
}

/**
 * `/login` or `/signup`, carrying the page the visitor came from.
 * @param {string} next
 * @param {{ signup?: boolean }} [opts]
 */
export function authHref(next, opts = {}) {
  const base = opts.signup ? '/signup' : '/login';
  const target = safeNext(next, '');
  if (!target) return base;
  return `${base}?next=${encodeURIComponent(target)}`;
}
