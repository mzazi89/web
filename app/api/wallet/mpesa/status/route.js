// MZAZI API — GET /api/wallet/mpesa/status?ref=WALLET-…
//
// Thin wrapper over reconcileMpesa(): the page may poll here directly, and the
// generic /api/wallet/status poll delegates to the same function, so the answer
// is identical whichever entry point the UI uses.
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/web-auth';
import { sql } from '@/lib/wallet';
import { reconcileMpesa } from '@/lib/mpesaSettle';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const viewer = await requireUser();
  if (!viewer) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const reference = new URL(request.url).searchParams.get('ref') || '';
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

  const rows = await sql`
    SELECT id, reference, amount, status, provider_ref, failure_reason
    FROM wallet_transactions
    WHERE reference = ${reference} AND user_id = ${viewer.id} AND provider = 'mpesa'
    LIMIT 1
  `;
  if (!rows.length) return NextResponse.json({ error: 'Unknown deposit' }, { status: 404 });

  const result = await reconcileMpesa(rows[0]);
  return NextResponse.json(result);
}
