import { runEndpoint } from '@/lib/api/pipeline';
import { corsHeaders, handleOptions } from '@/lib/api/cors';

export const dynamic = 'force-dynamic';

const ENDPOINT_PATH = '/api/download/play';

// GET /api/download/play?query=...&apikey=...
// Delegates to the shared pipeline (registry-driven, same behavior as always).
export async function GET(request) {
  const preflight = handleOptions(request);
  if (preflight) return preflight;
  return runEndpoint(request, ENDPOINT_PATH, 'GET');
}

export async function POST(request) {
  const preflight = handleOptions(request);
  if (preflight) return preflight;
  return runEndpoint(request, ENDPOINT_PATH, 'POST');
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
