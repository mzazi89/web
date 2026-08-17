// MZAZI API — shared provider helpers
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Record a health check for a provider (never throws — health must not break responses)
export async function recordHealth(providerName, ok, ms, error) {
  try {
    const prov = await sql`SELECT id FROM providers WHERE name = ${providerName} LIMIT 1`;
    if (prov.length === 0) return;
    const pid = prov[0].id;
    await sql`
      INSERT INTO provider_health (provider_id, ok, response_time_ms, error)
      VALUES (${pid}, ${ok}, ${ms}, ${error})
    `;
    if (ok) {
      await sql`UPDATE providers SET last_success_at = CURRENT_TIMESTAMP, last_error = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ${pid}`;
    } else {
      await sql`UPDATE providers SET last_failure_at = CURRENT_TIMESTAMP, last_error = ${error}, updated_at = CURRENT_TIMESTAMP WHERE id = ${pid}`;
    }
  } catch {
    // ignore
  }
}

// Drill through common envelope keys (result/data/response/results)
export function drillPayload(upstream, depth = 0) {
  if (!upstream || typeof upstream !== 'object' || depth > 4) return upstream;
  for (const k of ['result', 'data', 'response', 'results']) {
    if (upstream[k] !== undefined && upstream[k] !== null) {
      const v = upstream[k];
      if (typeof v === 'object' && !Array.isArray(v)) return drillPayload(v, depth + 1);
      return v;
    }
  }
  const clean = {};
  for (const [k, v] of Object.entries(upstream)) {
    if (['creator', 'success', 'status', 'timestamp', 'message'].includes(k)) continue;
    clean[k] = v;
  }
  return Object.keys(clean).length ? clean : upstream;
}

// Simple pass-through normalizer
export function normalizeDefault(payload) {
  return payload;
}
