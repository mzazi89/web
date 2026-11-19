// Shared display helpers for the showroom, in a plain module so both the server
// pages and the client browser can import them without pulling a client bundle
// across the boundary.
export const GOLD = '#C9A227';
export const GOLD_SOFT = 'rgba(201, 162, 39, 0.14)';

export const km = (n) => (n == null ? null : `${Number(n).toLocaleString('en-KE')} km`);

export const priceLabel = (n, currency = 'KES') =>
  n == null ? 'Price on request' : `${currency || 'KES'} ${Number(n).toLocaleString('en-KE')}`;

/**
 * The message a customer sends when they tap Enquire.
 *
 * It names the company, the exact vehicle and — when one is configured — the
 * sales representative the enquiry belongs to, so the person receiving it knows
 * which yard listing and which colleague it came from without opening the site.
 */
export function enquiryText(car, contact = {}, company = 'Golden Lion Motor Co. Limited') {
  const by = contact.salesName
    ? ` by ${contact.salesName} (${contact.salesTitle || 'sales representative'})`
    : '';
  return `Hello ${company}, I am interested in the ${car.title} listed on mzazi.shop${by}`;
}

/** wa.me link with the message pre-filled, or null when there is no number. */
export function waLink(number, text) {
  const digits = String(number || '').replace(/\D/g, '');
  if (digits.length < 9) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
