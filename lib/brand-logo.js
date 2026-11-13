// MZAZI — the brand mark as an inline data URI.
//
// Receipts and statements are documents people print or forward, so the logo has
// to travel inside the HTML: a remote <img src="/brand/logo.png"> fails the
// moment the page is printed from a saved copy, opened from an attachment, or
// rendered where mzazi.shop is not reachable.
//
// Read once per process and cached — the file is 72 KB, which is ~96 KB of
// base64, and re-reading it per request would be wasted work.
import { readFileSync } from 'node:fs';
import path from 'node:path';

let cached = null;

export function logoDataUri() {
  if (cached !== null) return cached;
  try {
    const file = path.join(process.cwd(), 'public', 'brand', 'logo.png');
    cached = `data:image/png;base64,${readFileSync(file).toString('base64')}`;
  } catch {
    cached = ''; // documents fall back to the wordmark rather than failing
  }
  return cached;
}
