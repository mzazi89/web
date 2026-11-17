// GET /api/music/stream?id=VIDEO — free playback source.
//
// Exists so the page can use a real <audio> element instead of an embedded
// player: only real audio keeps playing when the phone is locked, and only real
// audio can drive a media notification. Nothing is stored; the bytes are piped
// straight from the extractor to the listener.
import { NextResponse } from 'next/server';
import { openAudio } from '@/lib/music';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id') || '';
  try {
    const { stream, title } = await openAudio(id);
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'audio/mp4',
        'Cache-Control': 'no-store',
        'Content-Disposition': `inline; filename="${title}.m4a"`,
        'Accept-Ranges': 'none',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'That track could not be played — try another.', detail: e.message.slice(0, 80) }, { status: 502 });
  }
}
