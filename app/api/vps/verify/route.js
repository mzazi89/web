// MZAZI API — GET /api/vps/verify?reference=…
// Card-payment callback URL (Paystack redirects the buyer here). Verifies the
// payment, fulfills the order, then sends the buyer to /vps?success=1… where
// their credentials are revealed.
import { NextResponse } from 'next/server';
import { ensureVpsSchema, fulfillVpsOrderIfPaid } from '@/lib/vps';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const reference = request.nextUrl.searchParams.get('reference') || request.nextUrl.searchParams.get('trxref');
    if (!reference) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/vps?error=1`);
    }

    await ensureVpsSchema();
    const result = await fulfillVpsOrderIfPaid(reference);

    if (result.success) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/vps?success=1&reference=${encodeURIComponent(reference)}`);
    }
    if (result.reason === 'out_of_stock') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/vps?error=stock`);
    }
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/vps?error=1`);
  } catch (e) {
    console.error('VPS verify error:', e.message);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/vps?error=1`);
  }
}
