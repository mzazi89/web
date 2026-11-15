// MZAZI — the gateway client: token, timeout, error classification.
//
// Every call goes through one function so that a timeout, an expired token, a
// missing subscription and a bad payload are four different, actionable errors
// instead of one "something went wrong".
import { darajaConfig, offersContract, fill } from './config.js';
import { logApiCall } from './store.js';

// OAuth tokens are cached per environment and refreshed a minute early: Daraja
// issues 3599-second tokens and answers 404.001.03 (not 401) once they lapse.
const tokens = new Map();

export async function getToken(force = false) {
  const cfg = await darajaConfig();
  const key = `${cfg.env}:${cfg.consumerKey}`;
  const hit = tokens.get(key);
  if (!force && hit && hit.expires > Date.now() + 60_000) return hit.token;

  if (!cfg.consumerKey || !cfg.consumerSecret) {
    const err = new Error('Daraja consumer key and secret are not configured.');
    err.kind = 'config';
    throw err;
  }

  const basic = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString('base64');
  const res = await fetchWithTimeout(
    `${cfg.base}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${basic}` } },
    cfg.timeoutMs,
  );
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`Daraja rejected the credentials (${res.status}).`);
    err.kind = res.status === 401 || res.status === 403 ? 'auth' : 'upstream';
    err.status = res.status;
    throw err;
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    const err = new Error('Daraja returned a non-JSON token response.');
    err.kind = 'upstream';
    throw err;
  }
  if (!json.access_token) {
    const err = new Error('Daraja returned no access_token.');
    err.kind = 'upstream';
    throw err;
  }

  const ttl = Number(json.expires_in) || 3599;
  tokens.set(key, { token: json.access_token, expires: Date.now() + ttl * 1000 });
  return json.access_token;
}

export async function callOffers({ kind, vars }) {
  const cfg = await darajaConfig();
  const c = await offersContract();
  const map = {
    list: { path: c.listPath, body: c.listBody },
    buy: { path: c.buyPath, body: c.buyBody },
    status: { path: c.statusPath, body: c.statusBody },
  }[kind];

  if (!map || !map.path) {
    const err = new Error(
      `The Safaricom Dynamic Offers ${kind} endpoint is not configured. Paste it from your Daraja app's API definition (Admin → Settings → Data bundles).`,
    );
    err.kind = 'config';
    throw err;
  }

  const url = `${cfg.base}/v1/dynamic-offers/${String(map.path).replace(/^\/+/, '')}`;
  const body = map.body ? fill(map.body, vars) : null;
  const started = Date.now();

  let token = await getToken();
  let res = await request(url, { method: c.method, token, body }, cfg.timeoutMs);

  // One silent retry on an expired token: the gateway reports it as 404/401 with
  // "Invalid Access Token" rather than a 401 the client can act on.
  if (res.status === 401 || /invalid access token/i.test(res.text)) {
    token = await getToken(true);
    res = await request(url, { method: c.method, token, body }, cfg.timeoutMs);
  }

  const parsed = safeJson(res.text);
  const ok = res.status >= 200 && res.status < 300 && (!c.okMarker || res.text.includes(c.okMarker));

  await logApiCall({
    kind, url, status: res.status, ok, ms: Date.now() - started,
    request: body, response: res.text.slice(0, 4000),
  }).catch(() => {});

  if (!ok) {
    const err = new Error(explain(res.status, parsed, c.okMarker ? res.text : ''));
    err.kind = classify(res.status, parsed);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  return { json: parsed, text: res.text, status: res.status };
}

function request(url, { method, token, body }, timeoutMs) {
  return fetchWithTimeout(
    url,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...(body && method !== 'GET' ? { body } : {}),
    },
    timeoutMs,
  ).then(async (res) => ({ status: res.status, ok: res.ok, text: await res.text() }));
}

export async function fetchWithTimeout(url, init, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: 'no-store' });
  } catch (e) {
    const err = new Error(e.name === 'AbortError' ? 'Safaricom did not answer in time.' : 'Could not reach Safaricom.');
    err.kind = e.name === 'AbortError' ? 'timeout' : 'network';
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function classify(status, json) {
  if (status === 401) return 'auth';
  if (status === 403) return 'permission';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate';
  if (status >= 500) return 'upstream';
  return 'rejected';
}

// One sentence for the customer, with the part they can act on kept intact.
export function explain(status, json, text) {
  const msg =
    json?.header?.customerMessage ||
    json?.header?.responseMessage ||
    json?.message ||
    json?.error_description ||
    json?.error;
  if (msg) return String(msg).slice(0, 200);
  if (status === 401) return 'Safaricom rejected our access token.';
  if (status === 403) return 'This Daraja app is not authorised for the Dynamic Offers API.';
  if (status === 404) return 'That Dynamic Offers endpoint does not exist for this app.';
  if (status === 429) return 'Safaricom is rate-limiting us — try again in a moment.';
  if (text && text.length < 200) return text;
  return `Safaricom returned ${status}.`;
}
