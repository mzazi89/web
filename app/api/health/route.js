import { NextResponse } from 'next/server';
import { healthBody } from '../../../lib/api/response';
import { corsHeaders, handleOptions, mergeHeaders } from '../../../lib/api/cors';

export const dynamic = 'force-dynamic';

// GET /api/health — system health (public, JSON)
export async function GET(request) {
  const cors = corsHeaders(request);
  const preflight = handleOptions(request);
  if (preflight) return preflight;

  return NextResponse.json(healthBody(), {
    headers: mergeHeaders(cors, {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    }),
  });
}
