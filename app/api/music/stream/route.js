// GET /api/music/stream?id=VIDEO — free playback source.
//
// Redirects to the provider's own signed audio URL instead of piping bytes. A
// proxied stream arrives chunked with no Content-Length, so the player cannot
// compute a duration (it shows 0:00) and seeking does nothing; Google's URL
// supports Range natively, which is what makes a real <audio> player behave.
import { NextResponse } from 'next/server';
import { audioSource } from '@/lib/music';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id') || '';
  try {
    const { url } = await audioSource(id);
    return NextResponse.redirect(url, {
      status: 302,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'That track could not be played — try another.', detail: e.message.slice(0, 100) },
      { status: 502 }
    );
  }
}
