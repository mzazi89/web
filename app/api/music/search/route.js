// GET /api/music/search?q=  — public: finding a song is free.
import { NextResponse } from 'next/server';
import { search } from '@/lib/music';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const q = new URL(request.url).searchParams.get('q') || '';
  try {
    return NextResponse.json({ results: await search(q) });
  } catch (e) {
    return NextResponse.json({ error: 'Search is not answering right now.', detail: e.message.slice(0, 80) }, { status: 502 });
  }
}
