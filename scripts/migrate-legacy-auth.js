// ─────────────────────────────────────────────────────────────────────────────
// Migrate legacy (pre-Supabase) email/password accounts into Supabase Auth.
//
// Every users row that has a password hash but no supabase_id gets a Supabase
// Auth account created with the SAME bcrypt hash (email_confirm: true), then
// users.supabase_id is set. Run ONCE after switching to Supabase Auth:
//
//   cd web
//   DATABASE_URL="postgres://..." SUPABASE_URL="https://<proj>.supabase.co" \
//   SUPABASE_SERVICE_ROLE_KEY="sb_secret_..." node scripts/migrate-legacy-auth.js
//
// Safe to re-run: already-migrated users are skipped.
// ─────────────────────────────────────────────────────────────────────────────
const { neon } = require('@neondatabase/serverless');
const { createClient } = require('@supabase/supabase-js');

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DATABASE_URL || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env: DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

(async () => {
  const rows = await sql`
    SELECT id, email, password FROM users
    WHERE password IS NOT NULL AND supabase_id IS NULL
    ORDER BY id
  `;
  console.log(`Found ${rows.length} legacy password account(s) to migrate.`);

  let ok = 0, skipped = 0, failed = 0;
  for (const u of rows) {
    const email = String(u.email || '').trim().toLowerCase();
    if (!email) { skipped++; continue; }
    try {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password_hash: u.password, // reuse the existing bcrypt hash
        email_confirm: true,
      });
      if (error) {
        if (/already registered/i.test(error.message)) {
          // find the existing supabase user by email and link it
          const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
          const match = (list.users || []).find((x) => String(x.email || '').toLowerCase() === email);
          if (match) {
            await sql`UPDATE users SET supabase_id = ${match.id} WHERE id = ${u.id}`;
            console.log(`  linked existing supabase user ${email} -> ${match.id}`);
            ok++;
          } else {
            console.log(`  SKIP ${email}: already registered, could not resolve id`);
            skipped++;
          }
        } else {
          console.log(`  FAIL ${email}: ${error.message}`);
          failed++;
        }
        continue;
      }
      await sql`UPDATE users SET supabase_id = ${data.user.id} WHERE id = ${u.id}`;
      console.log(`  migrated ${email} -> ${data.user.id}`);
      ok++;
    } catch (e) {
      console.log(`  FAIL ${email}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone. migrated/linked: ${ok}, skipped: ${skipped}, failed: ${failed}`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('Migration error:', e.message);
  process.exit(1);
});
