import { NextResponse } from 'next/server';
import { ApiError, errorStatus, apiErrorBody } from '@/lib/api/errors';
import { authenticate } from '@/lib/api/auth';
import { checkAndIncrement, finalizeUsage } from '@/lib/api/rate-limit';
import { logRequest, newRequestId } from '@/lib/api/logger';
import { corsHeaders, handleOptions, mergeHeaders } from '@/lib/api/cors';
import { rateLimitHeaders, successResponse } from '@/lib/api/response';
import { getEndpoint } from '@/lib/api/endpoints';
import { providerForEndpoint } from '@/lib/api/providers';
import { getClientIp, getUserAgent } from '@/lib/api/utils';
import { MAX_QUERY_LENGTH } from '@/lib/api/constants';

export const dynamic = 'force-dynamic';

const ENDPOINT_PATH = '/api/download/play';

// GET /api/download/play?query=...&apikey=...
// request → authentication → rate limit → controller → provider → normalize
//        → log request → update usage → return JSON
export async function GET(request) {
  const started = Date.now();
  const requestId = newRequestId();
  const cors = corsHeaders(request);

  const preflight = handleOptions(request);
  if (preflight) return preflight;

  const ip = getClientIp(request);
  const ua = getUserAgent(request);

  let identity = null;   // authenticated API key identity
  let rateInfo = null;   // rate-limit state after quota check
  let statusCode = 500;
  let errorCode = null;
  let providerName = null;
  let providerFailure = false;

  const buildErrorHeaders = () => {
    const extra = rateInfo && rateInfo.limit >= 0
      ? rateLimitHeaders(rateInfo.limit, rateInfo.remaining, rateInfo.reset)
      : {};
    return mergeHeaders(cors, extra);
  };

  try {
    // 1. Controller: parse & validate input
    const url = new URL(request.url);
    const query = (url.searchParams.get('query') || '').trim();

    if (!query) throw new ApiError('MISSING_QUERY');
    if (query.length > MAX_QUERY_LENGTH) throw new ApiError('QUERY_TOO_LONG');

    // 2. Authentication
    identity = await authenticate(request);

    // 3. Rate limit (counts this request)
    rateInfo = await checkAndIncrement(identity.key.id, identity.user.id, identity.key.plan);

    // 4. Endpoint registry — only active endpoints with a provider run
    const endpoint = await getEndpoint(ENDPOINT_PATH);
    if (!endpoint || !endpoint.is_active) throw new ApiError('ENDPOINT_DISABLED');
    providerName = endpoint.provider;

    const provider = providerForEndpoint(endpoint);
    if (!provider) throw new ApiError('ENDPOINT_DISABLED');

    // 5. Provider call
    const result = await provider.handler({ query });

    statusCode = 200;

    // 6. Return normalized JSON
    return successResponse(result, {}, mergeHeaders(cors, rateLimitHeaders(rateInfo.limit, rateInfo.remaining, rateInfo.reset)));
  } catch (e) {
    const err = e instanceof ApiError ? e : new ApiError('INTERNAL_ERROR');
    statusCode = err.statusCode;
    errorCode = err.code;
    providerFailure = ['PROVIDER_ERROR', 'PROVIDER_TIMEOUT', 'PROVIDER_NOT_CONFIGURED'].includes(err.code);

    if (!(e instanceof ApiError)) {
      // never expose stack traces in production
      console.error(`[mzazi-api] ${requestId} unhandled:`, e.message);
    }

    return NextResponse.json(apiErrorBody(err.code, err.message), {
      status: errorStatus(err.code),
      headers: buildErrorHeaders(),
    });
  } finally {
    // 7. Log request + 8. update usage (never breaks the response)
    const responseTimeMs = Date.now() - started;
    logRequest({
      requestId,
      userId: identity?.user?.id ?? null,
      apiKeyId: identity?.key?.id ?? null,
      endpoint: ENDPOINT_PATH,
      method: 'GET',
      statusCode,
      responseTimeMs,
      provider: providerName,
      ip,
      userAgent: ua,
      errorCode,
    });
    if (identity && rateInfo) {
      finalizeUsage(identity.key.id, identity.user.id, {
        success: statusCode === 200,
        providerFailure,
        responseTimeMs,
      });
    }
  }
}
