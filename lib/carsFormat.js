// Shared display helpers for the showroom, in a plain module so both the server
// pages and the client browser can import them without pulling a client bundle
// across the boundary.
export const GOLD = '#C9A227';
export const GOLD_SOFT = 'rgba(201, 162, 39, 0.14)';

export const km = (n) => (n == null ? null : `${Number(n).toLocaleString('en-KE')} km`);

export const priceLabel = (n) =>
  n == null ? 'Price on request' : `KES ${Number(n).toLocaleString('en-KE')}`;
