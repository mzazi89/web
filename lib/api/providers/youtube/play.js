// MZAZI API — YouTube "play" provider (music search + download)
// Upstream service is configured via environment variables:
//   YOUTUBE_API_URL  — e.g. https://api.example.com/api/download/yt
//   YOUTUBE_API_KEY  — provider credential (server-side only, never exposed)
// The upstream response is normalized to the MZAZI result contract:
//   { title, thumbnail, duration, views, download_url, video_url }
import { ApiError } from '../../errors';
import { PROVIDER_TIMEOUT_MS, MAX_QUERY_LENGTH } from '../../constants';
import { pick, safeNumber, formatDuration, toHttps } from '../../utils';

export const id = 'youtube';
export const endpointPath = '/api/download/play';

const UPSTREAM_URL = process.env.YOUTUBE_API_URL || '';
const UPSTREAM_KEY = process.env.YOUTUBE_API_KEY || '';

export function isConfigured() {
  return Boolean(UPSTREAM_URL);
}

export function missingEnvVars() {
  const missing = [];
  if (!UPSTREAM_URL) missing.push('YOUTUBE_API_URL');
  if (!UPSTREAM_KEY) missing.push('YOUTUBE_API_KEY');
  return missing;
}

// Build the upstream request URL from the configured template
function buildUpstreamUrl(query) {
  const q = encodeURIComponent(query);

  if (UPSTREAM_URL.includes('{query}')) {
    let url = UPSTREAM_URL.replace(/\{query\}/g, q);
    if (UPSTREAM_KEY && UPSTREAM_URL.includes('{apikey}')) {
      url = url.replace(/\{apikey\}/g, encodeURIComponent(UPSTREAM_KEY));
    }
    return url;
  }

  const url = new URL(UPSTREAM_URL);
  // common upstream parameter names — send them all (harmless if unused)
  url.searchParams.set('query', query);
  url.searchParams.set('q', query);
  url.searchParams.set('text', query);
  url.searchParams.set('url', query);
  if (UPSTREAM_KEY) {
    url.searchParams.set('apikey', UPSTREAM_KEY);
    url.searchParams.set('api_key', UPSTREAM_KEY);
    url.searchParams.set('key', UPSTREAM_KEY);
  }
  return url.toString();
}

// Drill into common response shapes to find the payload object
function findResult(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 4) return null;
  if (obj.result && typeof obj.result === 'object') return obj.result;
  if (obj.data && typeof obj.data === 'object') return findResult(obj.data, depth + 1);
  if (obj.payload && typeof obj.payload === 'object') return findResult(obj.payload, depth + 1);
  return obj;
}

// Normalize arbitrary upstream responses to the MZAZI contract
export function normalizeResponse(upstream) {
  const r = findResult(upstream);

  const title = pick(r, ['title', 'name', 'video_title', 'song', 'track'], 'Untitled');
  const thumbnail = toHttps(pick(r, ['thumbnail', 'thumb', 'image', 'cover', 'thumbnail_url', 'video_thumbnail']));
  const durationRaw = pick(r, ['duration', 'durationText', 'length', 'lengthText', 'dur', 'duration_seconds']);
  const viewsRaw = pick(r, ['views', 'viewCount', 'view_count', 'total_views']);

  let duration = durationRaw;
  if (duration !== null && !String(duration).includes(':')) {
    duration = formatDuration(safeNumber(duration));
  } else if (duration === null) {
    duration = '0:00';
  } else {
    duration = String(duration);
  }

  const views = Math.max(0, Math.round(safeNumber(viewsRaw)));

  // download_url often nested: { download: {...} } or { download_url }
  const dl = pick(r, ['download', 'audio', 'mp3']);
  const download_url = toHttps(
    pick(r, ['download_url', 'url', 'audio_url', 'mp3_url', 'direct_url']) ||
    (typeof dl === 'object' ? pick(dl, ['url', 'download_url', 'audio', 'link']) : null)
  );

  const video_url = toHttps(
    pick(r, ['video_url', 'youtube_url', 'watch_url', 'link', 'source_url']) ||
    (typeof r.video === 'object' ? pick(r.video, ['url', 'video_url']) : null)
  );

  if (!download_url) {
    throw new ApiError('PROVIDER_ERROR');
  }

  return { title, thumbnail, duration, views, download_url, video_url };
}

// Main provider handler — called by the API controller
export async function handler({ query }) {
  if (!isConfigured()) {
    const err = new ApiError('PROVIDER_NOT_CONFIGURED');
    err.message = `Provider is not configured. Missing environment variable(s): ${missingEnvVars().join(', ')}`;
    throw err;
  }

  if (!query || !query.trim()) {
    throw new ApiError('MISSING_QUERY');
  }
  if (query.length > MAX_QUERY_LENGTH) {
    throw new ApiError('QUERY_TOO_LONG');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  let upstream;
  try {
    const res = await fetch(buildUpstreamUrl(query.trim()), {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new ApiError('PROVIDER_ERROR');
    }

    upstream = await res.json();
  } catch (e) {
    if (e.name === 'ApiError') throw e;
    if (e.name === 'AbortError' || e.code === 'ABORT_ERR' || controller.signal.aborted) {
      throw new ApiError('PROVIDER_TIMEOUT');
    }
    throw new ApiError('PROVIDER_ERROR');
  } finally {
    clearTimeout(timer);
  }

  return normalizeResponse(upstream);
}
