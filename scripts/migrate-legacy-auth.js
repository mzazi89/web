// ─────────────────────────────────────────────────────────────────────────────
// Migrate accounts into Clerk.
//
// Every users row that has no clerk_id gets a Clerk user created for it
// (matched by email), then users.clerk_id is set. Clerk cannot consume the
// existing bcrypt password hashes, so migrated accounts are created with
// `skipPasswordRequirement` — those users must use "Forgot password" on
// /forgot-password (email reset code) to set a new password, then sign in.
//
// Run ONCE after switching to Clerk Auth:
//
//   cd web
//   CLERK_SECRET_KEY="sk_test_..." DATABASE_URL="postgres://..." \
//   node scripts/migrate-legacy-auth.js
//
// Safe to re-run: already-migrated users are skipped.
// ─────────────────────────────────────────────────────────────────────────────
const { neon } = require('@neondatabase/serverless');
const { createClerkClient } = require('@clerk/backend');

const DATABASE_URL = process.env.DATABASE_URL;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!DATABASE_URL || !CLERK_SECRET_KEY) {
  console.error('Missing env: DATABASE_URL, CLERK_SECRET_KEY');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });

(async () => {
  const rows = await sql`
    SELECT id, email, firstname, lastname, fullname FROM users
    WHERE clerk_id IS NULL AND email IS NOT NULL
    ORDER BY id
  `;
  console.log(`Found ${rows.length} account(s) without a Clerk link.`);

  let ok = 0, skipped = 0, failed = 0;
  for (const u of rows) {
    const email = String(u.email || '').trim().toLowerCase();
    if (!email) { skipped++; continue; }
    try {
      const user = await clerk.users.createUser({
        emailAddress: [email],
        firstName: u.firstname || u.fullname?.split(' ')[0] || '',
        lastName: u.lastname || u.fullname?.split(' ').slice(1).join(' ') || '',
        skipPasswordRequirement: true,
      });
      await sql`UPDATE users SET clerk_id = ${user.id} WHERE id = ${u.id}`;
      console.log(`  migrated ${email} -> ${user.id}`);
      ok++;
    } catch (e) {
      if (/already exists|already.*exist/i.test(e.message || '')) {
        try {
          const { data } = await clerk.users.getUserList({ emailAddress: [email] });
          const match = data?.[0];
          if (match) {
            await sql`UPDATE users SET clerk_id = ${match.id} WHERE id = ${u.id}`;
            console.log(`  linked existing clerk user ${email} -> ${match.id}`);
            ok++;
          } else {
            console.log(`  SKIP ${email}: already exists, could not resolve id`);
            skipped++;
          }
        } catch (e2) {
          console.log(`  FAIL ${email}: ${e2.message}`);
          failed++;
        }
      } else {
        console.log(`  FAIL ${email}: ${e.message}`);
        failed++;
      }
    }
  }

  console.log(`\nDone. migrated/linked: ${ok}, skipped: ${skipped}, failed: ${failed}`);
  console.log('Note: migrated accounts have no password yet — users must use');
  console.log('"Forgot password" (email reset code) to set one before signing in.');
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('Migration error:', e.message);
  process.exit(1);
});
