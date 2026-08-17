// MZAZI API — Keyless free-API provider adapter
// Each endpoint's `upstream` is an ABSOLUTE URL (no shared base).
// GET-only; query params are appended as-is. No API keys required.
import { ApiError } from '../../api/errors';
import { PROVIDER_TIMEOUT_MS } from '../../api/constants';
import { recordHealth, drillPayload as sharedDrill, normalizeDefault } from '../shared';

export const id = 'keyless';

export function isConfigured() {
  return true; // keyless by design
}

export function missingEnvVars() {
  return [];
}

// ── Upstream call ────────────────────────────────────────────────
export async function call(upstream, params = {}, method = 'GET') {
  if (!upstream || !upstream.startsWith('http')) {
    throw new ApiError('PROVIDER_NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  const started = Date.now();

  try {
    let url = upstream;
    const fetchOpts = {
      method,
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    };

    if (method === 'POST') {
      const body = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') body[k] = v;
      }
      fetchOpts.headers['Content-Type'] = 'application/json';
      fetchOpts.body = JSON.stringify(body);
    } else {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') qs.set(k, v);
      }
      const q = qs.toString();
      if (q) url += (url.includes('?') ? '&' : '?') + q;
    }

    const res = await fetch(url, fetchOpts);
    const ms = Date.now() - started;

    if (!res.ok) {
      recordHealth(id, false, ms, `HTTP ${res.status}`);
      throw new ApiError('PROVIDER_ERROR');
    }

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) {
      recordHealth(id, false, ms, 'non-JSON response');
      throw new ApiError('PROVIDER_ERROR');
    }

    const data = await res.json();
    recordHealth(id, true, ms, null);
    return { data, ms };
  } catch (e) {
    if (e.name === 'ApiError') throw e;
    if (controller.signal.aborted) {
      recordHealth(id, Date.now() - started, 'timeout');
      throw new ApiError('PROVIDER_TIMEOUT');
    }
    recordHealth(id, Date.now() - started, e.message.slice(0, 200));
    throw new ApiError('PROVIDER_ERROR');
  } finally {
    clearTimeout(timer);
  }
}

export function drillPayload(data) {
  return sharedDrill(data);
}

export function normalizerFor() {
  return normalizeDefault;
}
