import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '../../../../lib/api/web-auth';
import { safeInt } from '../../../../lib/api/utils';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

// GET /api/dashboard/usage — paginated request logs with filters
// ?endpoint=...&key_id=...&status=success|failed&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&per_page=20
export async function GET(request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);

    const endpoint = url.searchParams.get('endpoint') || null;
    const keyId = url.searchParams.get('key_id') || null;
    const status = url.searchParams.get('status') || null;
    const from = url.searchParams.get('from') || null;
    const to = url.searchParams.get('to') || null;
    const page = Math.max(1, safeInt(url.searchParams.get('page'), 1));
    const perPage = Math.min(100, Math.max(1, safeInt(url.searchParams.get('per_page'), 20)));

    const where = [];
    if (endpoint) { where.push(sql`endpoint = ${endpoint}`); }
    if (keyId) { where.push(sql`api_key_id = ${safeInt(keyId, 0)}`); }
    if (status === 'success') where.push(sql`status_code < 400`);
    if (status === 'failed') where.push(sql`status_code >= 400`);
    if (from) where.push(sql`created_at >= ${from}::date`);
    if (to) where.push(sql`created_at < (${to}::date + 1)`);

    // Compose WHERE from nested neon fragments (parameterized, injection-safe)
    let whereSql = sql``;
    if (where.length > 0) {
      whereSql = sql`WHERE ${where[0]}`;
      for (let i = 1; i < where.length; i++) {
        whereSql = sql`${whereSql} AND ${where[i]}`;
      }
    }

    const [countRows, rows, summary, perEndpoint, perDay] = await Promise.all([
      sql`SELECT COUNT(*) AS cnt FROM api_requests ${whereSql}`,
      sql`
        SELECT r.request_id, r.endpoint, r.method, r.status_code, r.response_time_ms,
               r.provider, r.error_code, r.created_at, k.name AS key_name, k.key_prefix
        FROM api_requests r
        LEFT JOIN api_keys k ON k.id = r.api_key_id
        ${whereSql}
        ORDER BY r.created_at DESC
        LIMIT ${perPage} OFFSET ${(page - 1) * perPage}
      `,
      sql`
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN status_code < 400 THEN 1 ELSE 0 END) AS success,
               SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS failed,
               SUM(CASE WHEN error_code IN ('PROVIDER_ERROR','PROVIDER_TIMEOUT','PROVIDER_NOT_CONFIGURED') THEN 1 ELSE 0 END) AS provider_failures,
               AVG(response_time_ms)::numeric(10,1) AS avg_ms
        FROM api_requests ${whereSql}
      `,
      sql`
        SELECT endpoint, COUNT(*) AS cnt, AVG(response_time_ms)::numeric(10,1) AS avg_ms
        FROM api_requests ${whereSql}
        GROUP BY endpoint ORDER BY cnt DESC
      `,
      sql`
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt,
               SUM(CASE WHEN status_code < 400 THEN 1 ELSE 0 END) AS success,
               SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS failed
        FROM api_requests ${whereSql}
        GROUP BY DATE(created_at) ORDER BY day ASC
      `,
    ]);

    const total = parseInt(countRows[0].cnt, 10) || 0;

    return NextResponse.json({
      requests: rows,
      meta: {
        total,
        page,
        per_page: perPage,
        total_pages: Math.max(1, Math.ceil(total / perPage)),
      },
      summary: {
        total: parseInt(summary[0].total, 10) || 0,
        success: parseInt(summary[0].success, 10) || 0,
        failed: parseInt(summary[0].failed, 10) || 0,
        provider_failures: parseInt(summary[0].provider_failures, 10) || 0,
        avg_response_ms: summary[0].avg_ms ? Number(summary[0].avg_ms) : null,
      },
      per_endpoint: perEndpoint.map(e => ({
        endpoint: e.endpoint,
        count: parseInt(e.cnt, 10) || 0,
        avg_response_ms: e.avg_ms ? Number(e.avg_ms) : null,
      })),
      per_day: perDay.map(d => ({
        date: d.day,
        requests: parseInt(d.cnt, 10) || 0,
        success: parseInt(d.success, 10) || 0,
        failed: parseInt(d.failed, 10) || 0,
      })),
    });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[mzazi-api] dashboard usage error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
