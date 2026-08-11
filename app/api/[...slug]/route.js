// MZAZI API — registry-driven endpoint dispatcher (catch-all)
// Handles any /api/* path not claimed by a more specific route:
//   registry lookup → params → auth → rate limit → provider → normalize → log → respond
// Unknown paths return a JSON 404 (never the website 404 page).
import { runEndpoint } from '@/lib/api/pipeline';
import { corsHeaders, handleOptions } from '@/lib/api/cors';

export const dynamic = 'force-dynamic';

function toPath(slug) {
  return '/api/' + (Array.isArray(slug) ? slug.join('/') : slug);
}

export async function GET(request, { params }) {
  const preflight = handleOptions(request);
  if (preflight) return preflight;
  const path = toPath((await params)?.slug);
  return runEndpoint(request, path, 'GET');
}

export async function POST(request, { params }) {
  const preflight = handleOptions(request);
  if (preflight) return preflight;
  const path = toPath((await params)?.slug);
  return runEndpoint(request, path, 'POST');
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
