import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';
const PTERO_URL = process.env.PTERODACTYL_URL || 'https://public.mzazi.shop';
const PTERO_KEY = process.env.PTERODACTYL_API_KEY;

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    jwt.verify(token.value, JWT_SECRET);

    const url = new URL(request.url);
    const nestId = url.searchParams.get('nest_id');
    if (!nestId) return NextResponse.json({ error: 'nest_id is required' }, { status: 400 });

    const res = await fetch(`${PTERO_URL}/api/application/nests/${nestId}/eggs?include=variables`, {
      headers: {
        Authorization: `Bearer ${PTERO_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    const data = await res.json();

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
