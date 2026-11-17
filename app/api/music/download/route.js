// GET /api/music/download?id=VIDEO — paid: streams the audio as an attachment.
//
// The pass is checked here, not in the page. Hiding a button is decoration; the
// entitlement is the row in music_passes.
import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api/session';
import { activePass, openAudio } from '@/lib/music';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  const user = await optionalUser();
  if (!user) return NextResponse.json({ error: 'Sign in to download.' }, { status: 401 });

  const pass = await activePass(user.id);
  if (!pass) return NextResponse.json({ error: 'A download pass is needed.' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const fmt = searchParams.get('fmt') === 'mp4' ? 'mp4' : 'mp3';

  try {
    const { stream, title } = await openAudio(id, fmt);
    return new NextResponse(stream, {
      headers: {
        'Content-Type': fmt === 'mp4' ? 'video/mp4' : 'audio/mp4',
        'Content-Disposition': `attachment; filename="${title}.${fmt === 'mp4' ? 'mp4' : 'm4a'}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'That track could not be prepared — try another.', detail: e.message.slice(0, 80) }, { status: 502 });
  }
}
