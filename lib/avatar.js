// MZAZI — profile photo plumbing shared by the dashboard and the account page.
//
// Two things live here because more than one place needs them and the logic is
// subtle enough that copies would drift:
//
//   ensureAvatarColumns()  the `avatar` / `avatar_at` columns, added on demand
//   avatarMeta(id), avatarUrl(meta)  read the version stamp, build the <img> URL
//
// The read is deliberately its own tiny query rather than a column added to the
// big `SELECT … FROM users`: if the schema has not been migrated yet on some
// environment, this returns null and the person simply keeps their initials,
// instead of taking the whole dashboard down with an undefined-column error.
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

let ready = null;

/** Idempotent, cached per process. ALTER … IF NOT EXISTS is a no-op once done. */
export function ensureAvatarColumns() {
  if (!ready) {
    ready = (async () => {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_at TIMESTAMP`;
    })().catch((e) => {
      ready = null; // let a later request try again
      throw e;
    });
  }
  return ready;
}

/** { at: number|null, has: boolean } or null when unknown — never throws. */
export async function avatarMeta(userId) {
  try {
    await ensureAvatarColumns();
    const rows = await sql`
      SELECT avatar_at, (avatar IS NOT NULL AND avatar <> '') AS has
      FROM users WHERE id = ${Number(userId)} LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;
    return { at: row.avatar_at ? new Date(row.avatar_at).getTime() : null, has: row.has === true };
  } catch {
    return null;
  }
}

/**
 * The URL to hand an <img>. `?v=` changes only when the photo does, so the
 * browser cache stays warm between visits and still busts after an upload.
 */
export function avatarUrl(meta) {
  if (!meta || !meta.has) return null;
  return `/api/account/avatar?v=${meta.at || 0}`;
}

/** Convenience: meta + url in one call, shaped for a component prop. */
export async function loadAvatar(userId) {
  const meta = await avatarMeta(userId);
  return avatarUrl(meta);
}
