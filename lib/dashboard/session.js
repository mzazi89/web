// MZAZI TECH — who is looking at the dashboard.
//
// One place that reads the site session cookie (`token`, minted by
// /api/auth/login), verifies it, and loads the row it points at. Every
// dashboard page goes through this, and every query downstream takes
// `viewer.id` — a customer can only ever read their own records because no
// other id is ever in scope.
//
// Role gate: `users.status` is the only account-state column the schema has.
// Anything other than active/blank means the session is no longer honoured, so
// a suspended account cannot keep browsing with an old cookie.

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import { loadAvatar } from '@/lib/avatar';

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

const BLOCKED = new Set(['suspended', 'banned', 'disabled', 'deleted']);

export async function getViewer() {
  const store = await cookies();
  const token = store.get('token');
  if (!token?.value) return null;

  let decoded;
  try {
    decoded = jwt.verify(token.value, process.env.JWT_SECRET);
  } catch {
    return null;
  }
  if (!decoded?.userId) return null;

  const rows = await sql`
    SELECT id, firstname, lastname, fullname, email, role, status, created_at
    FROM users
    WHERE id = ${Number(decoded.userId)}
    LIMIT 1
  `;
  const user = rows[0];
  if (!user) return null;
  if (user.status && BLOCKED.has(String(user.status).toLowerCase())) return null;

  // The photo lives in its own column and its own query, so a database that has
  // not been migrated yet costs a missing avatar rather than a broken page.
  const avatar = await loadAvatar(user.id);

  return { ...user, avatar, isAdmin: String(user.role || '').toLowerCase() === 'admin' };
}

// Small shared helpers so pages do not each invent their own phrasing.
export function displayName(user) {
  if (!user) return 'Member';
  return user.firstname || user.fullname || String(user.email || '').split('@')[0] || 'Member';
}

export function initials(user) {
  const source = [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.email || 'M';
  return source.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}
