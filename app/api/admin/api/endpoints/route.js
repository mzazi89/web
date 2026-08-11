import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireAdmin } from '@/lib/api/web-auth';
import { safeInt } from '@/lib/api/utils';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

// GET /api/admin/api/endpoints — registry
export async function GET() {
  try {
    await requireAdmin();
    const rows = await sql`
      SELECT id, path, method, category, name, description, provider, requires_query, is_active, created_at
      FROM endpoints ORDER BY category ASC, path ASC
    `;
    return NextResponse.json({ endpoints: rows });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('[mzazi-api] admin endpoints error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/api/endpoints — enable / disable
export async function PUT(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const id = safeInt(body.id, 0);
    if (!id) return NextResponse.json({ error: 'Endpoint id required' }, { status: 400 });

    const isActive = Boolean(body.is_active);
    await sql`UPDATE endpoints SET is_active = ${isActive} WHERE id = ${id}`;

    const rows = await sql`SELECT path FROM endpoints WHERE id = ${id} LIMIT 1`;
    return NextResponse.json({
      message: isActive ? 'Endpoint enabled' : 'Endpoint disabled',
      path: rows[0]?.path,
    });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (e.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('[mzazi-api] admin endpoint update error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
