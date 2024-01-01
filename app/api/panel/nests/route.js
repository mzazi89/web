import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';
const PTERO_URL = process.env.PTERODACTYL_URL || 'https://public.mzazi.shop';
const PTERO_KEY = process.env.PTERODACTYL_API_KEY;

async function pteroFetch(path) {
  const res = await fetch(`${PTERO_URL}/api/application${path}`, {
    headers: {
      Authorization: `Bearer ${PTERO_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  return res.json();
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    jwt.verify(token.value, JWT_SECRET);

    const data = await pteroFetch('/nests');
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
