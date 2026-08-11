// MZAZI Temp Number tool proxy — server-side bridge to the upstream provider.
// Lets the /temp-number page work WITHOUT the visitor needing an API key.
// Light per-IP rate limit + short cache to protect the upstream.
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const UPSTREAM = 'https://apis.davidcyril.name.ng';
const PROVIDERS = new Set(['receive-sms-online', 'hs3x', 'receive-smss', 'sms24', 'receivesms', 'smstome']);
const CACHE_TTL = 30000; // 30s
const RATE_LIMIT = { windowMs: 60000, max: 20 }; // 20 req/min per IP
const cache = new Map();
const hits = new Map();

function ipOf(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function limited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > RATE_LIMIT.windowMs) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_LIMIT.max;
}

export async function GET(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action'); // numbers | inbox
  const provider = url.searchParams.get('provider');
  const number = url.searchParams.get('number') || '';

  if (!PROVIDERS.has(provider)) {
    return NextResponse.json({ status: false, error: 'INVALID_PROVIDER', message: 'Unknown provider.' }, { status: 400 });
  }
  if (action !== 'numbers' && action !== 'inbox') {
    return NextResponse.json({ status: false, error: 'INVALID_ACTION', message: 'action must be numbers or inbox.' }, { status: 400 });
  }
  if (action === 'inbox' && !number) {
    return NextResponse.json({ status: false, error: 'MISSING_NUMBER', message: 'The number parameter is required.' }, { status: 400 });
  }

  const ip = ipOf(request);
  if (limited(ip)) {
    return NextResponse.json({ status: false, error: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  const cacheKey = `${provider}:${action}:${number}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.body, { headers: { 'X-Cache': 'HIT' } });
  }

  const upstream = `${UPSTREAM}/tempnumber/${provider}/${action === 'numbers' ? 'numbers' : 'inbox?number=' + encodeURIComponent(number)}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(upstream, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/126.0' },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    if (!res.ok) {
      return NextResponse.json({ status: false, error: 'PROVIDER_ERROR', message: `Upstream returned HTTP ${res.status}.` }, { status: 502 });
    }
    const data = await res.json();
    cache.set(cacheKey, { body: data, expires: Date.now() + CACHE_TTL });
    return NextResponse.json(data, { headers: { 'X-Cache': 'MISS' } });
  } catch (e) {
    if (e.name === 'AbortError') {
      return NextResponse.json({ status: false, error: 'PROVIDER_TIMEOUT', message: 'The provider timed out.' }, { status: 504 });
    }
    return NextResponse.json({ status: false, error: 'PROVIDER_ERROR', message: 'Could not reach the provider.' }, { status: 502 });
  }
}
