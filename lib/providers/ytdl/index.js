// MZAZI API — YouTube download provider (multi-instance failover)
// Uses public Piped / Invidious JSON instances. No API key required.
// All instances are tried in order; the first healthy one serves the
// request, so the endpoint auto-heals whenever any instance is back.
import { ApiError } from '../../api/errors';
import { recordHealth } from '../shared';

export const id = 'ytdl';

const INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.leptons.xyz',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.moomoo.me',
  'https://pipedapi.reallyaweso.me',
  'https://inv.nadeko.net/api/v1',
  'https://invidious.f5.si/api/v1',
  'https://invidious.nerdvpn.de/api/v1',
  'https://invidious.privacydev.net/api/v1',
  'https://invidious.baczek.me/api/v1',
];

const YT_ID_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

function extractId(value) {
  if (!value) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  const m = String(value).match(YT_ID_RE);
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
  const videoId = extractId(params.url || params.q || params.video);
  if (!videoId) {
    const err = new ApiError('MISSING_PARAMETER');
    err.message = 'The "url" parameter is required — a YouTube watch, short or youtu.be link.';
    throw err;
  }

  const audioOnly = ['mp3', 'audio', 'm4a'].includes(String(params.format || '').toLowerCase());
  let lastErr = null;

  for (const base of INSTANCES) {
    const isPiped = base.includes('piped');
    const url = base + (isPiped ? `/streams/${videoId}` : `/videos/${videoId}`);
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      const ms = Date.now() - started;
      if (!res.ok) {
        recordHealth(id, false, ms, `HTTP ${res.status} @ ${base}`);
        lastErr = new ApiError('PROVIDER_ERROR');
        continue;
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) {
        recordHealth(id, false, ms, `non-json @ ${base}`);
        continue;
      }
      const data = await res.json();
      const hasStreams = isPiped
        ? (data.audioStreams?.length > 0 || data.videoStreams?.length > 0)
        : (data.adaptiveFormats?.length > 0 || data.formatStreams?.length > 0);
      if (data.error || !hasStreams) {
        recordHealth(id, ms, `no streams @ ${base}`);
        lastErr = new ApiError('PROVIDER_ERROR');
        continue;
      }
      // audio-only mode: keep only audio streams
      if (audioOnly && isPiped) data.videoStreams = [];
      if (audioOnly && !isPiped) data.formatStreams = [];
      recordHealth(id, true, ms, null);
      return { data, ms };
    } catch (e) {
      clearTimeout(timer);
      const ms = Date.now() - started;
      lastErr = e?.name === 'ApiError' ? e : new ApiError('PROVIDER_ERROR');
      recordHealth(id, false, ms, `fetch-fail @ ${base}`);
    }
  }
  throw lastErr || new ApiError('PROVIDER_ERROR');
}

// ── Payload extraction ───────────────────────────────────────────
// Unify Piped (audioStreams/videoStreams) and Invidious
// (adaptiveFormats/formatStreams) into one download-friendly shape.
export function drillPayload(data) {
  const isPiped = !!(data.audioStreams || data.videoStreams);
  if (isPiped) {
    return {
      title: data.title || null,
      uploader: data.uploader || null,
      duration: data.duration || null,
      thumbnail: data.thumbnailUrl || data.thumbnail || null,
      formats: [
        ...(data.audioStreams || []).map((s) => ({ kind: 'audio', quality: s.quality, mime: s.mimeType, url: s.url })),
        ...(data.videoStreams || []).map((s) => ({ kind: 'video', quality: s.quality, mime: s.mimeType, url: s.url })),
      ],
    };
  }
  return {
    title: data.title || null,
    uploader: data.author || null,
    duration: data.lengthSeconds || null,
    thumbnail: data.thumbnailUrl || data.videoThumbnails?.[0]?.url || null,
    formats: [
      ...(data.adaptiveFormats || []).map((f) => ({ kind: 'audio', quality: f.qualityLabel || f.audioQuality || null, mime: f.type, url: f.url })),
      ...(data.formatStreams || []).map((f) => ({ kind: 'video', quality: f.qualityLabel, mime: f.type, url: f.url })),
    ],
  };
}

export function normalizerFor() {
  return (payload) => payload;
}
