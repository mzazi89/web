// ─────────────────────────────────────────────────────────────────────────────
// web/lib/ptero.js — shared Pterodactyl application API helpers.
// Panel credentials come from the shared `settings` table (admin Settings
// page) first, with env fallback — same precedence the bot and admin use.
// Used by the "Add Server" API route.
// ─────────────────────────────────────────────────────────────────────────────
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

export async function pteroConfig() {
  let url = process.env.PTERODACTYL_URL || 'https://public.mzazi.shop';
  let key = process.env.PTERODACTYL_API_KEY || '';
  try {
    const rows = await sql`SELECT key, value FROM settings WHERE key = ANY(${['pterodactyl_url', 'pterodactyl_api_key']})`;
    for (const r of rows) {
      if (r.key === 'pterodactyl_url' && r.value) url = r.value;
      if (r.key === 'pterodactyl_api_key' && r.value) key = r.value;
    }
  } catch {}
  return { url: String(url).replace(/\/+$/, ''), key };
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
