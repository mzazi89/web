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

// Provider health, cached for a minute. Four of the six upstreams answer 200
// with an empty list, which made the picker look broken: the customer chose a
// provider and saw "no numbers". The list is now built from what actually has
// numbers, and the default is the one with most.
let healthCache = { at: 0, data: null };

async function providerHealth() {
  if (healthCache.data && Date.now() - healthCache.at < 60_000) return healthCache.data;

  const entries = await Promise.all(
    [...PROVIDERS].map(async (id) => {
      try {
        const c = new AbortController();
        const timer = setTimeout(() => c.abort(), 6000);
        const res = await fetch(`${UPSTREAM}/tempnumber/${id}/numbers`, { signal: c.signal });
        clearTimeout(timer);
        const json = await res.json().catch(() => null);
        const numbers = json?.result?.numbers || [];
        return { id, count: Array.isArray(numbers) ? numbers.length : 0 };
      } catch {
        return { id, count: 0 };
      }
    })
  );

  healthCache = { at: Date.now(), data: entries.sort((a, b) => b.count - a.count) };
  return healthCache.data;
}

export async function GET(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action'); // numbers | inbox
  if (url.searchParams.get('action') === 'providers') {
    const providers = await providerHealth();
    return NextResponse.json(
      { status: true, providers: providers.filter((p) => p.count > 0), checked: providers },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

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
