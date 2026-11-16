// MZAZI API — GET /api/avatar/generated?seed=Name&style=personas
//
// A real-looking person avatar for someone who has not uploaded a photo:
// illustrated, deterministic from their name, and served from our own domain.
//
// Proxied rather than hotlinked for two reasons — the reviewer's name never
// travels to a third party from their browser, and the bytes are cached at our
// edge instead of theirs, so a page of reviews costs one origin request each,
// once.
//
// Styles are whitelisted; the seed is length-capped; anything upstream that is
// not an SVG is rejected. On failure it returns a neutral silhouette with a
// short cache, so a reviewer never appears as a broken image.
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const STYLES = new Set(['personas', 'avataaars', 'notionists', 'adventurer']);
const TINTS = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';

function silhouette(seed) {
  const hue = 204 + ([...String(seed)].reduce((n, c) => n + c.charCodeAt(0), 0) % 78);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="hsl(${hue} 82% 56%)"/><stop offset="100%" stop-color="hsl(${(hue + 34) % 360} 86% 62%)"/>
  </linearGradient></defs>
  <rect width="64" height="64" fill="url(#g)"/>
  <circle cx="32" cy="25" r="11" fill="rgba(255,255,255,.92)"/>
  <path d="M10 64c0-13 10-21 22-21s22 8 22 21z" fill="rgba(255,255,255,.92)"/>
</svg>`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const seed = String(searchParams.get('seed') || '').trim().slice(0, 64);
  const style = STYLES.has(searchParams.get('style')) ? searchParams.get('style') : 'personas';

  if (!seed) {
    return new NextResponse(silhouette('mzazi'), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' },
    });
  }

  const url = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${TINTS}&radius=50`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal, headers: { accept: 'image/svg+xml' } });
    clearTimeout(timer);

    const type = res.headers.get('content-type') || '';
    const body = res.ok ? await res.text() : '';
    if (!res.ok || !type.includes('svg') || body.length > 200_000 || !body.trimStart().startsWith('<svg')) {
      throw new Error('unusable upstream response');
    }

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        // Deterministic for a given seed: safe to keep for a year.
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse(silhouette(seed), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
    });
  }
}
