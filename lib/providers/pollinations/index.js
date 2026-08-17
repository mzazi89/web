// MZAZI API — Pollinations AI provider adapter (keyless)
// Free, no API key required: https://text.pollinations.ai
// The adapter always POSTs JSON to the upstream, even for GET platform
// requests (the endpoint's own method stays GET for registry consistency).
import { ApiError } from '../../api/errors';
import { PROVIDER_TIMEOUT_MS } from '../../api/constants';
import { pick } from '../../api/utils';
import { recordHealth, drillPayload as sharedDrill, normalizeDefault } from '../shared';

export const id = 'pollinations';

const BASE_URL = (process.env.POLLINATIONS_API_URL || 'https://text.pollinations.ai').replace(/\/$/, '');

export function isConfigured() {
  return Boolean(BASE_URL);
}

export function missingEnvVars() {
  return BASE_URL ? [] : ['POLLINATIONS_API_URL'];
}

// ── Upstream call ────────────────────────────────────────────────
// params: { prompt (required), model?, system? }
export async function call(_upstreamPath, params = {}, _method = 'GET') {
  if (!isConfigured()) {
    const err = new ApiError('PROVIDER_NOT_CONFIGURED');
    err.message = `Provider is not configured. Missing environment variable(s): ${missingEnvVars().join(', ')}`;
    throw err;
  }

  const prompt = params.prompt || params.q || params.message;
  if (!prompt) {
    const err = new ApiError('MISSING_PARAMETER');
    err.message = 'The "prompt" parameter is required.';
    throw err;
  }

  const messages = [];
  if (params.system) messages.push({ role: 'system', content: String(params.system) });
  messages.push({ role: 'user', content: String(prompt).slice(0, 4000) });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  const started = Date.now();

  try {
    const res = await fetch(BASE_URL + '/', {
      method: 'POST',
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        model: params.model || 'openai',
        messages,
        private: true,
      }),
    });
    const ms = Date.now() - started;

    if (!res.ok) {
      recordHealth(id, false, ms, `HTTP ${res.status}`);
      throw new ApiError('PROVIDER_ERROR');
    }

    const ct = res.headers.get('content-type') || '';
    let data;
    if (ct.includes('json')) {
      data = await res.json();
    } else if (ct.includes('text') || ct.includes('plain')) {
      // Legacy Pollinations answers in plain text — treat the raw text as the answer
      data = { answer: await res.text() };
    } else {
      recordHealth(id, false, ms, 'unsupported content-type');
      throw new ApiError('PROVIDER_ERROR');
    }

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

// ── Payload extraction ───────────────────────────────────────────
// { choices: [{ message: { content } }] } → { answer, model }
export function drillPollinations(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return { answer: content, model: data?.model || data?.provider || null, usage: data?.usage || null };
  }
  return sharedDrill(data);
}

export function drillPayload(data) {
  return drillPollinations(data);
}

// ── Normalizers ──────────────────────────────────────────────────
export function normalizeAI(payload) {
  if (typeof payload === 'string') return { answer: payload };
  if (payload && typeof payload === 'object') {
    const answer = pick(payload, ['answer', 'response', 'reply', 'text', 'message', 'content'], null);
    return answer !== null ? { answer, ...payload } : payload;
  }
  return payload;
}

export function normalizerFor(category) {
  if (category === 'AI') return normalizeAI;
  return normalizeDefault;
}
