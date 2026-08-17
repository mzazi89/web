// MZAZI API — YOUR OWN API provider adapter (generic REST)
// ---------------------------------------------------------------------------
// Point this at any JSON REST API without code changes:
//   MYAPI_API_URL         base URL, e.g. https://api.yourdomain.com   (required)
//   MYAPI_API_KEY         optional key
//   MYAPI_AUTH_MODE       'bearer' (default) or 'query' (sends ?api_key=)
//   MYAPI_AUTH_HEADER     header name (default 'Authorization')
//   MYAPI_AUTH_PREFIX     scheme prefix (default 'Bearer')
//
// Endpoints live in lib/api/registry/myapi.json — edit that file to expose
// your routes. After editing, deploy: the DB re-seeds automatically.
// ---------------------------------------------------------------------------
import { ApiError } from '../../api/errors';
import { PROVIDER_TIMEOUT_MS } from '../../api/constants';
import { recordHealth } from '../shared';

export const id = 'myapi';

const BASE_URL = (process.env.MYAPI_API_URL || '').replace(/\/$/, '');

export function isConfigured() {
  return Boolean(BASE_URL);
}

export function missingEnvVars() {
  return BASE_URL ? [] : ['MYAPI_API_URL'];
}

function authHeaders() {
  const key = process.env.MYAPI_API_KEY;
  if (!key) return {};
  if ((process.env.MYAPI_AUTH_MODE || 'bearer') === 'query') return {};
  const header = process.env.MYAPI_AUTH_HEADER || 'Authorization';
  const prefix = process.env.MYAPI_AUTH_PREFIX || 'Bearer';
  return { [header]: `${prefix} ${key}` };
}

// ── Upstream call ────────────────────────────────────────────────
export async function call(upstream = '/', params = {}, method = 'GET') {
  if (!isConfigured()) {
    const err = new ApiError('PROVIDER_NOT_CONFIGURED');
    err.message = `Provider is not configured. Missing environment variable(s): ${missingEnvVars().join(', ')}`;
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  const started = Date.now();

  try {
    let url = BASE_URL + upstream;
    const headers = { Accept: 'application/json', ...authHeaders() };
    const fetchOpts = { method, signal: controller.signal, cache: 'no-store', headers };

    if (method === 'POST') {
      const body = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') body[k] = v;
      }
      headers['Content-Type'] = 'application/json';
      fetchOpts.body = JSON.stringify(body);
    } else {
      const qs = new URLSearchParams();
      // query-mode auth key
      if (process.env.MYAPI_AUTH_MODE === 'query' && process.env.MYAPI_API_KEY) {
        qs.set('api_key', process.env.MYAPI_API_KEY);
      }
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
    if (e?.name === 'ApiError') throw e;
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

// ── Payload handling ─────────────────────────────────────────────
// Override these to match your API's response shape.
export function drillPayload(data) {
  return data;
}

export function normalizerFor() {
  return (payload) => payload;
}
