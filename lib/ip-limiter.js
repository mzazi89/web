// ─────────────────────────────────────────────────────────────────────────────
// Lightweight per-IP sliding-window rate limiter for interactive endpoints
// (login, AI chat, inquiry forms). In-memory per warm instance — burst
// protection, not a global quota. The public API platform uses the stronger
// DB-backed quota system in lib/api/rate-limit.js.
// ─────────────────────────────────────────────────────────────────────────────
const buckets = new Map();
const MAX_BUCKETS = 10000;

export function ipRateLimit(ip, { max = 10, windowMs = 60_000 } = {}) {
  const key = `${ip || 'unknown'}:${max}:${windowMs}`;
  const now = Date.now();

  const rec = buckets.get(key);
  if (!rec || now - rec.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    if (buckets.size > MAX_BUCKETS) buckets.clear(); // bound memory under abuse
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }

  rec.count += 1;
  if (rec.count > max) {
    return { allowed: false, remaining: 0, retryAfterMs: windowMs - (now - rec.start) };
  }
  return { allowed: true, remaining: max - rec.count, retryAfterMs: 0 };
}

// Best-effort client IP from proxy headers (same logic as lib/api/utils)
export function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim().slice(0, 45);
  return request.headers.get('cf-connecting-ip') || 'unknown';
}
