import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '../../../lib/api/web-auth';
import { generateApiKey, hashKey } from '../../../lib/api/utils';
import { getPlanLimit, getDailyUsage, todayKey } from '../../../lib/api/rate-limit';
import { MAX_KEYS_PER_USER } from '../../../lib/api/constants';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

// GET /api/api-keys — list the current user's API keys with live usage
export async function GET() {
  try {
    const user = await requireUser();
    const rows = await sql`
      SELECT id, name, key_prefix, status, plan, expires_at, last_used_at, created_at, revoked_at
      FROM api_keys
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    const keys = await Promise.all(
      rows.map(async (k) => {
        const [used, limit] = await Promise.all([
          getDailyUsage(k.id),
          getPlanLimit(k.plan),
        ]);
        const total = await sql`
          SELECT COUNT(*) AS cnt, AVG(response_time_ms)::numeric(10,1) AS avg_ms
          FROM api_requests WHERE api_key_id = ${k.id}
        `;
        return {
          id: k.id,
          name: k.name,
          prefix: k.key_prefix,
          status: k.status,
          plan: k.plan,
          expires_at: k.expires_at,
          last_used_at: k.last_used_at,
          created_at: k.created_at,
          revoked_at: k.revoked_at,
          requests_today: used,
          total_requests: parseInt(total[0].cnt, 10) || 0,
          avg_response_ms: total[0].avg_ms ? Number(total[0].avg_ms) : null,
          daily_limit: limit,
          remaining_today: limit < 0 ? -1 : Math.max(0, limit - used),
        };
      })
    );

    return NextResponse.json({ keys });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[mzazi-api] list keys error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/api-keys — create a new API key (full key returned exactly once)
export async function POST(request) {
  try {
    const user = await requireUser();

    let name = 'Default Key';
    try {
      const body = await request.json();
      if (body?.name) name = String(body.name).trim().slice(0, 255);
    } catch { /* optional body */ }

    const count = await sql`SELECT COUNT(*) AS cnt FROM api_keys WHERE user_id = ${user.id} AND status = 'active'`;
    if (parseInt(count[0].cnt, 10) >= MAX_KEYS_PER_USER) {
      return NextResponse.json({ error: `Maximum of ${MAX_KEYS_PER_USER} active API keys allowed` }, { status: 400 });
    }

    const rawKey = generateApiKey();
    const keyHash = hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 14) + '…';

    await sql`
      INSERT INTO api_keys (user_id, name, key_hash, key_prefix)
      VALUES (${user.id}, ${name}, ${keyHash}, ${keyPrefix})
    `;

    return NextResponse.json({
      message: 'API key created',
      key: rawKey, // shown exactly once — not stored in plain text
      prefix: keyPrefix,
      name,
      warning: 'Store this key securely. It will not be shown again.',
    }, { status: 201 });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[mzazi-api] create key error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
