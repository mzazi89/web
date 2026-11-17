// GET /api/music/stream?id=VIDEO — free playback source.
//
// Proxies the provider's audio, but correctly: the browser's Range header is
// forwarded and the upstream 206 response is passed through with its
// Content-Length, Content-Range and Accept-Ranges intact. That is what lets
// <audio> know the duration and seek.
//
// A bare redirect was not enough: the signed URL answers only for the request
// shape it was issued for, and a media element following a cross-origin 302
// often receives nothing usable — which is the 0:00 the player was showing.
import { NextResponse } from 'next/server';
import { audioSource } from '@/lib/music';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id') || '';
  const range = request.headers.get('range');

  try {
    const { url, mime } = await audioSource(id);
    const upstream = await fetch(url, {
      headers: range ? { range } : {},
      cache: 'no-store',
    });

    const headers = new Headers({
      'Content-Type': mime || 'audio/mp4',
      'Cache-Control': 'no-store',
      'Accept-Ranges': 'bytes',
    });
    for (const h of ['content-length', 'content-range']) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }

    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch (e) {
    return NextResponse.json(
      { error: 'That track could not be played — try another.', detail: e.message.slice(0, 100) },
      { status: 502 }
    );
  }
}
