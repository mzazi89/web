// MZAZI API — provider registry
// Each provider module exports { id, endpointPath, enabled, handler({query}) }.
// Only endpoints with a real provider module AND env configuration are active.
import * as youtubePlay from './youtube/play';

export const providers = {
  youtube: youtubePlay,
};

export function getProvider(name) {
  return providers[name] || null;
}

// Resolve the provider for an endpoint record
export function providerForEndpoint(endpoint) {
  if (!endpoint || !endpoint.provider) return null;
  return getProvider(endpoint.provider);
}
