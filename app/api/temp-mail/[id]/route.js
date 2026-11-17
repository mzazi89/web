// MZAZI API — GET /api/temp-mail/[id]
//
// One message, plain text only. The page runs on our origin, so upstream HTML is
// never inserted into it — a marketing email with a <script> tag would otherwise
// be same-origin script execution.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findBySid, readMessage } from '@/lib/tempmail';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const box = await findBySid(cookies().get('mz_tm')?.value);
  if (!box) return NextResponse.json({ error: 'No inbox' }, { status: 404 });

  try {
    return NextResponse.json(await readMessage(box, params.id));
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Could not open that message.' }, { status: 502 });
  }
}
