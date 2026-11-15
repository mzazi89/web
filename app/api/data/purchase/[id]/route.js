// MZAZI API — GET /api/data/purchase/[id]
//
// Refresh a transaction: asks Safaricom for the current state and returns the
// full transition history, so "pending" can be inspected rather than waited on
// blindly.
import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api/session';
import { refreshStatus } from '@/lib/daraja/service';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const user = await optionalUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const id = Number(params?.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Which purchase?' }, { status: 400 });

  const result = await refreshStatus({ userId: user.id, purchaseId: id });
  return NextResponse.json(result, { status: result.ok ? 200 : result.kind === 'not_found' ? 404 : 502 });
}
