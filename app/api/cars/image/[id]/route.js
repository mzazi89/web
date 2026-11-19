import { NextResponse } from 'next/server';
import { sql, ensureCars } from '@/lib/cars';

export const dynamic = 'force-dynamic';

// MZAZI API — GET /api/cars/image/:id
//
// A showroom photo. Public, because the listing is: a car for sale is meant to be
// seen, and anything that gates it would break the page for a shared link.
//
// The id is immutable — a row's bytes are never rewritten — so this is safe to
// cache for a year and served with an ETag for the repeat view in a gallery.
export async function GET(request, { params }) {
  try {
    await ensureCars();
    const { id } = await params;
    const imageId = Number(id);
    if (!imageId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const rows = await sql`SELECT mime, bytes, size_bytes FROM car_images WHERE id = ${imageId} LIMIT 1`;
    const image = rows[0];
    if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const bytes = Buffer.from(String(image.bytes || ''), 'base64');
    if (!bytes.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const etag = `"car-${imageId}-${bytes.length}"`;
    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': image.mime || 'image/jpeg',
        'Content-Length': String(bytes.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        ETag: etag,
      },
    });
  } catch (e) {
    console.error('[cars/image]', e?.message || e);
    return NextResponse.json({ error: 'Could not load that photo' }, { status: 500 });
  }
}
