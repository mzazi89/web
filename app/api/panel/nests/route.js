// MZAZI API — /api/panel/nests
// The nest list a buyer picks from on /products.
//
// Credentials resolve through lib/ptero, which reads the admin Settings value
// before falling back to env. This route used to read process.env directly, so a
// key saved in admin Settings was invisible to it: every request went out as
// `Bearer undefined`, the panel answered 401, and the buyer got an empty nest
// list with nothing to select.
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { pteroConfig, pteroGet, pteroErr } from '@/lib/ptero';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    jwt.verify(token.value, JWT_SECRET);

    const { key } = await pteroConfig();
    if (!key) {
      return NextResponse.json(
        { error: 'The panel API key is not configured. Add it in the admin Settings page.' },
        { status: 503 }
      );
    }

    // per_page: the panel pages this endpoint, and the default is well below
    // what an admin will have created.
    const { status, data } = await pteroGet('/nests?per_page=100');
    if (status !== 200) {
      console.error('Nests fetch failed:', status, data);
      return NextResponse.json(
        { error: pteroErr(data) || `The panel rejected the request (HTTP ${status}).` },
        { status: 502 }
      );
    }

    const nests = (data.data || []).map((n) => ({
      id: n.attributes.id,
      name: n.attributes.name,
      description: n.attributes.description,
    }));

    return NextResponse.json({ nests });
  } catch (error) {
    console.error('Nests fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch nests' }, { status: 500 });
  }
}
