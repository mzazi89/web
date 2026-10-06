// MZAZI API — /api/panel/eggs?nest_id=…
// The egg list for the chosen nest on /products.
//
// Same credential bug as /api/panel/nests: this read process.env directly, so an
// API key saved in admin Settings never reached the panel and the buyer got an
// empty egg list to go with the empty nest list.
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { pteroConfig, pteroGet, pteroErr } from '@/lib/ptero';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    jwt.verify(token.value, JWT_SECRET);

    const url = new URL(request.url);
    const nestId = url.searchParams.get('nest_id');
    if (!nestId) return NextResponse.json({ error: 'nest_id is required' }, { status: 400 });

    const { key } = await pteroConfig();
    if (!key) {
      return NextResponse.json(
        { error: 'The panel API key is not configured. Add it in the admin Settings page.' },
        { status: 503 }
      );
    }

    const { status, data } = await pteroGet(`/nests/${encodeURIComponent(nestId)}/eggs?include=variables&per_page=100`);
    if (status !== 200) {
      console.error('Eggs fetch failed:', status, data);
      return NextResponse.json(
        { error: pteroErr(data) || `The panel rejected the request (HTTP ${status}).` },
        { status: 502 }
      );
    }

    const eggs = (data.data || []).map((e) => ({
      id: e.attributes.id,
      name: e.attributes.name,
      description: e.attributes.description,
    }));

    return NextResponse.json({ eggs });
  } catch (error) {
    console.error('Eggs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch eggs' }, { status: 500 });
  }
}
