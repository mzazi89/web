// ─────────────────────────────────────────────────────────────────────────────
// web/lib/ptero.js — shared Pterodactyl application API helpers.
// Panel credentials come from the shared `settings` table (admin Settings
// page) first, with env fallback — same precedence the bot and admin use.
// Used by the "Add Server" API route.
// ─────────────────────────────────────────────────────────────────────────────
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

// Read the two panel keys out of one key/value table. Literal IN lists rather
// than ANY(<array>): this is the form lib/bots.js already uses, and it does not
// depend on how the driver coerces a JS array.
//
// Failures are logged rather than swallowed. A silent failure here downgrades
// the whole app to an empty API key, which reaches the buyer as an empty nest
// list with no explanation of why.
async function readPanelKeys(table) {
  try {
    const rows = table === 'settings'
      ? await sql`SELECT key, value FROM settings WHERE key IN ('pterodactyl_url', 'pterodactyl_api_key')`
      : await sql`SELECT key, value FROM api_settings WHERE key IN ('pterodactyl_url', 'pterodactyl_api_key')`;
    const out = {};
    for (const r of rows) if (r.value) out[r.key] = String(r.value).trim();
    return out;
  } catch (err) {
    console.warn(`[ptero] could not read ${table}:`, err?.message || err);
    return {};
  }
}

/**
 * Panel credentials: admin Settings first, env second.
 *
 * `settings` is the documented home for these keys. `api_settings` is the other
 * admin-editable key/value table, so it is checked too — a key saved on either
 * admin screen is honoured, and only when `settings` has nothing to say.
 */
export async function pteroConfig() {
  let url = process.env.PTERODACTYL_URL || 'https://public.mzazi.shop';
  let key = process.env.PTERODACTYL_API_KEY || '';

  const fromSettings = await readPanelKeys('settings');
  const fromApiSettings = fromSettings.pterodactyl_api_key ? {} : await readPanelKeys('api_settings');
  const merged = { ...fromApiSettings, ...fromSettings };

  if (merged.pterodactyl_url) url = merged.pterodactyl_url;
  if (merged.pterodactyl_api_key) key = merged.pterodactyl_api_key;

  return { url: String(url).replace(/\/+$/, ''), key: String(key || '').trim() };
}

export async function pteroHeaders() {
  const { key } = await pteroConfig();
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export async function pteroGet(path) {
  const { url } = await pteroConfig();
  const res = await fetch(`${url}/api/application${path}`, { headers: await pteroHeaders() });
  return { status: res.status, data: await res.json() };
}

// DELETE answers 204 with no body, so parsing is best-effort rather than assumed.
export async function pteroDelete(path) {
  const { url } = await pteroConfig();
  const res = await fetch(`${url}/api/application${path}`, {
    method: 'DELETE',
    headers: await pteroHeaders(),
  });
  let data = null;
  try { data = await res.json(); } catch { /* 204 — nothing to parse */ }
  return { status: res.status, data };
}

export async function pteroPost(path, body) {
  const { url } = await pteroConfig();
  const res = await fetch(`${url}/api/application${path}`, {
    method: 'POST',
    headers: await pteroHeaders(),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

// Pick a concrete free allocation — automatic deployment (deploy.locations)
// fails with "No nodes satisfying the requirements..." on panels whose nodes
// aren't auto-deploy ready. Using an unassigned allocation works anywhere.
export async function pickFreeAllocation() {
  try {
    const { data } = await pteroGet('/nodes?include=allocations&per_page=100');
    for (const n of data?.data || []) {
      const allocs = n.attributes?.relationships?.allocations?.data || [];
      const free = allocs.find((a) => a.attributes && !a.attributes.assigned);
      if (free) return { allocation: { default: free.attributes.id } };
    }
  } catch {}
  return { deploy: { locations: [1], dedicated_ip: false, port_range: [] } };
}

export function pteroErr(data) {
  if (!data) return 'Unknown Pterodactyl error';
  if (Array.isArray(data.errors) && data.errors[0]?.detail) return data.errors[0].detail;
  return data.error || JSON.stringify(data).slice(0, 200);
}

// Egg details (docker image, startup, variables) for a nest/egg pair.
export async function fetchEgg(nestId, eggId) {
  const { data } = await pteroGet(`/nests/${nestId}/eggs/${eggId}?include=variables`);
  const attrs = data?.attributes;
  if (!attrs) throw new Error('Could not fetch egg details from the panel');
  const environment = {};
  for (const v of attrs.relationships?.variables?.data || []) {
    const attr = v.attributes;
    environment[attr.env_variable] = attr.default_value ?? '';
  }
  return {
    dockerImage: attrs.docker_image || (attrs.docker_images && attrs.docker_images[0]) || 'ghcr.io/pterodactyl/yolks:java_17',
    startup: attrs.startup || '{{SERVER_JARFILE}}',
    environment,
  };
}
