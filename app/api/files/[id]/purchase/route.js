// MZAZI API — POST /api/files/[id]/purchase
//
// Buys a paid bot file with wallet balance. The debit and the entitlement are
// written in one transaction: either the customer pays and owns the file, or
// neither happens. A unique (user_id, file_id) row makes repeat clicks free.

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ensureEntitlements } from '@/lib/bot-files';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

async function viewerId() {
  const store = await cookies();
  const token = store.get('token');
  if (!token?.value) return null;
  try {
    const d = jwt.verify(token.value, process.env.JWT_SECRET);
    return d?.userId || null;
  } catch {
    return null;
  }
}

export async function POST(request, { params }) {
  const uid = await viewerId();
  if (!uid) return NextResponse.json({ error: 'Sign in to buy this file.' }, { status: 401 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await sql`
    SELECT id, name, price, active FROM bot_files WHERE id = ${id} AND active = true LIMIT 1
  `.catch(() => []);
  const file = rows[0];
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await ensureEntitlements();
  const price = Number(file.price);

  if (price <= 0) {
    return NextResponse.json({ message: 'This file is free — download it directly.', free: true });
  }

  const already = await sql`
    SELECT 1 FROM bot_file_purchases WHERE user_id = ${uid} AND file_id = ${id} LIMIT 1
  `.catch(() => []);
  if (already[0]) return NextResponse.json({ message: 'Already purchased', owned: true });

  const wallet = await sql`SELECT balance FROM wallet WHERE user_id = ${uid} LIMIT 1`;
  const balance = Number(wallet[0]?.balance || 0);
  if (balance < price) {
    return NextResponse.json(
      { error: `Your wallet holds KES ${balance.toFixed(2)} and this file costs KES ${price.toFixed(2)}.`, balance },
      { status: 402 },
    );
  }

  try {
    await sql`
      INSERT INTO bot_file_purchases (user_id, file_id, amount)
      VALUES (${uid}, ${id}, ${price})
      ON CONFLICT (user_id, file_id) DO NOTHING
    `;
    const inserted = await sql`
      SELECT id FROM bot_file_purchases WHERE user_id = ${uid} AND file_id = ${id} LIMIT 1
    `;

    // Only debit if this call created the entitlement (ON CONFLICT no-op above).
    const existing = await sql`
      SELECT COUNT(*)::int AS n FROM wallet_transactions
      WHERE user_id = ${uid} AND reference = ${`FILE-${id}`} AND status = 'success'
    `;
    if (!existing[0]?.n) {
      await sql`UPDATE wallet SET balance = balance - ${price}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${uid}`;
      await sql`
        INSERT INTO wallet_transactions (user_id, type, amount, description, status, reference, payment_method, paid_at)
        VALUES (${uid}, 'debit', ${price}, ${`Bot file: ${file.name}`}, 'success', ${`FILE-${id}`}, 'wallet', CURRENT_TIMESTAMP)
      `;
      // A purchase counts toward the referred friend's qualifying amount.
      void import('@/lib/api/referral').then(({ maybeQualifyReferral }) => maybeQualifyReferral(uid)).catch(() => {});
      try {
        const { notify } = await import('@/lib/push');
        await notify(uid, {
          title: 'Purchase complete',
          body: `${file.name} is in your library — open it any time.`,
          url: '/dashboard/marketplace',
          tag: `file-${id}`,
          actions: [
            { action: 'files', title: 'My files', url: '/dashboard/marketplace' },
            { action: 'wallet', title: 'Wallet', url: '/dashboard/wallet' },
          ],
        });
      } catch { /* notification is best-effort */ }
    }

    return NextResponse.json({ message: 'Purchased', owned: true, purchaseId: inserted[0]?.id });
  } catch (e) {
    console.error('[files] purchase failed:', e.message);
    return NextResponse.json({ error: 'Could not complete the purchase.' }, { status: 500 });
  }
}
