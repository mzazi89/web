// MZAZI API — social downloader provider (Twitter / X)
// Uses the public fixvx/fxtwitter embed APIs — no key required.
// Both services are tried in order; the first healthy one serves the request.
import { ApiError } from '../../api/errors';
import { PROVIDER_TIMEOUT_MS } from '../../api/constants';
import { recordHealth } from '../shared';

export const id = 'social';

const SERVICES = [
  { base: 'https://api.fxtwitter.com/status', fx: true },
  { base: 'https://api.vxtwitter.com/status', fx: false },
];

const TWEET_ID_RE = /(?:twitter\.com|x\.com)\/[A-Za-z0-9_]+\/status\/(\d+)/;

function extractTweetId(value) {
  if (!value) return null;
  if (/^\d+$/.test(value)) return value;
  const m = String(value).match(TWEET_ID_RE);
  return m ? m[1] : null;
}

export function isConfigured() {
  return true;
}

export function missingEnvVars() {
  return [];
}

// ── Upstream call ────────────────────────────────────────────────
export async function call(_upstream, params = {}, _method = 'GET') {
  const tweetId = extractTweetId(params.url || params.q || params.id);
  if (!tweetId) {
    const err = new ApiError('MISSING_PARAMETER');
    err.message = 'The "url" parameter is required — a Twitter/X status link.';
    throw err;
  }

  let lastErr = null;
  for (const svc of SERVICES) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      const res = await fetch(`${svc.base}/${tweetId}`, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const ms = Date.now() - started;
      if (!res.ok) {
        recordHealth(id, false, ms, `HTTP ${res.status} @ ${svc.base}`);
        lastErr = new ApiError('PROVIDER_ERROR');
        continue;
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) {
        recordHealth(id, false, ms, `non-json @ ${svc.base}`);
        continue;
      }
      const data = await res.json();
      const failed = svc.fx ? data.code !== 200 || !data.tweet : !data.text && !data.tweet;
      if (failed) {
        recordHealth(id, false, ms, `not-found @ ${svc.base}`);
        lastErr = new ApiError('PROVIDER_ERROR');
        continue;
      }
      recordHealth(id, true, ms, null);
      return { data, ms };
    } catch (e) {
      clearTimeout(timer);
      const ms = Date.now() - started;
      lastErr = e?.name === 'ApiError' ? e : new ApiError('PROVIDER_ERROR');
      recordHealth(id, false, ms, `fetch-fail @ ${svc.base}`);
    }
  }
  throw lastErr || new ApiError('PROVIDER_ERROR');
}

// ── Payload extraction ───────────────────────────────────────────
// Unify fxtwitter ({ tweet: {...} }) and vxtwitter (flat) shapes.
export function drillPayload(data) {
  const t = data?.tweet || data;
  if (!t || typeof t !== 'object') return data;
  const author = t.author
    ? { name: t.author.name || null, handle: t.author.screen_name || t.author.username || null, avatar: t.author.avatar_url || null }
    : { name: t.user_name || null, handle: t.user_screen_name || null, avatar: null };

  const media = t.media || {};
  const videos = (media.videos || []).map((v) => ({ kind: 'video', url: v.url || v.direct_url, type: v.type || v.format || null }));
  const images = (media.images || []).map((i) => ({ kind: 'image', url: i.url || i.direct_url, type: i.type || 'image/jpeg' }));

  return {
    text: t.text || null,
    author,
    created_at: t.created_at || t.date || null,
    likes: t.likes ?? null,
    retweets: t.retweets ?? t.rt_count ?? null,
    replies: t.replies ?? null,
    media: { videos, images },
  };
}

export function normalizerFor() {
  return (payload) => payload;
}
