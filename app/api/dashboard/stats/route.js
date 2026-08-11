import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '../../../../lib/api/web-auth';
import { getPlanLimit, getDailyUsage } from '../../../../lib/api/rate-limit';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

// GET /api/dashboard/stats — real usage statistics for the logged-in user
export async function GET() {
  try {
    const user = await requireUser();

    const [totals, today, avg, activeKeys, mostUsed, recent, daily] = await Promise.all([
      // lifetime totals
      sql`
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN status_code < 400 THEN 1 ELSE 0 END) AS success,
               SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS failed
        FROM api_requests WHERE user_id = ${user.id}
      `,
      // today
      sql`
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN status_code < 400 THEN 1 ELSE 0 END) AS success,
               SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS failed
        FROM api_requests
        WHERE user_id = ${user.id} AND created_at >= CURRENT_DATE
      `,
      // average response time
      sql`SELECT AVG(response_time_ms)::numeric(10,1) AS avg_ms FROM api_requests WHERE user_id = ${user.id}`,
      // active keys
      sql`SELECT COUNT(*) AS cnt FROM api_keys WHERE user_id = ${user.id} AND status = 'active'`,
      // most used endpoint
      sql`
        SELECT endpoint, COUNT(*) AS cnt FROM api_requests
        WHERE user_id = ${user.id}
        GROUP BY endpoint ORDER BY cnt DESC LIMIT 1
      `,
      // recent requests
      sql`
        SELECT request_id, endpoint, method, status_code, response_time_ms, provider, error_code, created_at
        FROM api_requests
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC LIMIT 10
      `,
      // last 14 days series
      sql`
        SELECT date, SUM(requests) AS requests, SUM(success) AS success, SUM(failed) AS failed
        FROM api_usage WHERE user_id = ${user.id} AND date >= CURRENT_DATE - 13
        GROUP BY date ORDER BY date ASC
      `,
    ]);

    // Platform endpoint stats (registry-driven counts)
    const [endpointStats, topEndpoints, topCategories] = await Promise.all([
      sql`
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active
        FROM endpoints
      `,
      sql`
        SELECT e.endpoint, e.category, SUM(e.requests) AS cnt
        FROM endpoint_usage e
        WHERE e.date >= CURRENT_DATE - 13
        GROUP BY e.endpoint, e.category
        ORDER BY cnt DESC LIMIT 5
      `,
      sql`
        SELECT e.category, SUM(e.requests) AS cnt
        FROM endpoint_usage e
        WHERE e.date >= CURRENT_DATE - 13 AND e.category IS NOT NULL
        GROUP BY e.category
        ORDER BY cnt DESC LIMIT 8
      `,
    ]);

    // Quota per active key
    const keyRows = await sql`
      SELECT id, name, key_prefix, plan FROM api_keys
      WHERE user_id = ${user.id} AND status = 'active' ORDER BY created_at DESC
    `;
    const quotas = await Promise.all(keyRows.map(async (k) => {
      const limit = await getPlanLimit(k.plan);
      const used = await getDailyUsage(k.id);
      return {
        id: k.id,
        name: k.name,
        prefix: k.key_prefix,
        plan: k.plan,
        daily_limit: limit,
        used_today: used,
        remaining: limit < 0 ? -1 : Math.max(0, limit - used),
      };
    }));

    // Fill any missing days with zeros
    const byDate = {};
    daily.forEach(d => { byDate[d.date] = d; });
    const series = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const row = byDate[d];
      series.push({
        date: d,
        requests: row ? parseInt(row.requests, 10) : 0,
        success: row ? parseInt(row.success, 10) : 0,
        failed: row ? parseInt(row.failed, 10) : 0,
      });
    }

    return NextResponse.json({
      stats: {
        total_requests: parseInt(totals[0].total, 10) || 0,
        successful_requests: parseInt(totals[0].success, 10) || 0,
        failed_requests: parseInt(totals[0].failed, 10) || 0,
        requests_today: parseInt(today[0].total, 10) || 0,
        success_today: parseInt(today[0].success, 10) || 0,
        failed_today: parseInt(today[0].failed, 10) || 0,
        avg_response_ms: avg[0].avg_ms ? Number(avg[0].avg_ms) : null,
        active_keys: parseInt(activeKeys[0].cnt, 10) || 0,
        most_used_endpoint: mostUsed[0]?.endpoint || null,
      },
      quotas,
      recent_requests: recent,
      daily_series: series,
      endpoints: {
        total: parseInt(endpointStats[0].total, 10) || 0,
        active: parseInt(endpointStats[0].active, 10) || 0,
      },
      top_endpoints: topEndpoints.map(e => ({
        endpoint: e.endpoint,
        category: e.category,
        count: parseInt(e.cnt, 10) || 0,
      })),
      top_categories: topCategories.map(c => ({
        category: c.category,
        count: parseInt(c.cnt, 10) || 0,
      })),
    });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[mzazi-api] dashboard stats error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
