import fs from 'fs';
const raw = fs.readFileSync('.env.local', 'utf8');
for (const line of raw.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { sql } = await import('./tmp-database.mjs');
const { creditReferralCommission } = await import('./tmp-api/referral.mjs');
const [b, a] = await Promise.all([
  sql`SELECT id, referred_by FROM users WHERE email = 'refer_b_test@mzazi.dev' LIMIT 1`,
  sql`SELECT id FROM users WHERE email = 'refer_a_test@mzazi.dev' LIMIT 1`,
]);
console.log('B.referred_by =', b[0]?.referred_by, '(should be A id', a[0]?.id + ')');
const order = await sql`INSERT INTO orders (user_id, product_id, package_name, amount, status, reference) VALUES (${b[0].id}, 1, 'Test Panel', 500, 'completed', 'ref_test_order_001') RETURNING id`;
await creditReferralCommission({ orderId: order[0].id, buyerUserId: b[0].id, reference: 'ref_test_order_001' });
// second call — must NOT double credit
await creditReferralCommission({ orderId: order[0].id, buyerUserId: b[0].id, reference: 'ref_test_order_001' });
const [wallet, comm, txns] = await Promise.all([
  sql`SELECT balance FROM wallet WHERE user_id = ${a[0].id}`,
  sql`SELECT COUNT(*) AS c, COALESCE(SUM(amount),0)::numeric AS sum FROM referral_commissions WHERE referrer_user_id = ${a[0].id}`,
  sql`SELECT type, amount, status FROM wallet_transactions WHERE user_id = ${a[0].id} AND type = 'referral'`,
]);
console.log('A wallet balance:', JSON.stringify(wallet[0]));
console.log('commissions:', JSON.stringify(comm[0]), '(expect count 1, sum 20)');
console.log('transactions:', JSON.stringify(txns));
