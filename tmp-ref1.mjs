import fs from 'fs';
const raw = fs.readFileSync('.env.local', 'utf8');
for (const line of raw.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { sql } = await import('./tmp-database.mjs');
const { ensureReferralCode } = await import('./tmp-api/referral.mjs');
const rows = await sql`SELECT id FROM users WHERE email = 'refer_a_test@mzazi.dev' LIMIT 1`;
if (rows.length === 0) { console.log('NO USER A'); process.exit(1); }
const code = await ensureReferralCode(rows[0].id);
console.log('A code:', code);
