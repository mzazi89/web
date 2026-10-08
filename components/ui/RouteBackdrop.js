'use client';

// MZAZI TECH — route-aware page backdrop.
//
// One component, mounted once in the root layout, gives EVERY page artwork that
// matches what that page is about — without touching a single page file. The route
// table below is the only place to maintain.
//
// This used to paint a photograph: 19 webp files, 524 kB, mapped onto 48 routes.
// It now draws a canvas motif instead (components/ui/artKinds.js), which is
// sharper at any viewport, costs no request, and follows the theme automatically
// because the palette is read from the live CSS custom properties.
//
// Background motifs are built differently from the foreground art: fewer, much
// larger, higher-contrast elements, because fine detail is wasted behind the
// scrim. Each route picks the motif that reads as its subject — a code brace for
// the API pages, a handset grid for devices, a padlock for auth.
//
// Layering (back to front):
//   1. the motif, at the route's `opacity`
//   2. a scrim of var(--bg), so foreground text keeps WCAG contrast
//   3. the page's own gradients, then content
//
// Everything is `position: fixed` and `pointer-events: none`, so it never affects
// layout flow, never scrolls, and never intercepts a click.

import { usePathname } from 'next/navigation';
import CanvasArt from './CanvasArt';

/**
 * Route → { kind, opacity }. ORDER MATTERS: the first match wins, so the more
 * specific paths must come before their prefixes (e.g. /admin/login before
 * /admin, /api/docs before /api).
 *
 * `opacity` is now actually applied — it is passed to the layer as --backdrop-image.
 * (The old table carried per-route opacities too, but the component collected them
 * and never used them, so every route rendered at the same fixed value.)
 *
 * Text-heavy legal pages stay quietest; pages that are mostly a single panel can
 * carry a stronger motif because less copy sits directly on the page background.
 */
const ROUTES = [
  // ── Admin (most specific first) ──────────────────────────────────────────
  ['/admin/broadcast',      'wave',     0.85],
  ['/admin/vouchers',       'ticket',   0.85],
  ['/admin/commands',       'terminal', 0.85],
  ['/admin/bot',            'terminal', 0.85],
  ['/admin/sessions',       'tiles',    0.85],
  ['/admin/users',          'crowd',    0.8],
  ['/admin/resellers',      'crowd',    0.8],
  ['/admin/inquiries',      'bubbles',  0.8],
  ['/admin/testimonials',   'crowd',    0.8],
  ['/admin/subscriptions',  'ledger',   0.85],
  ['/admin/transactions',   'ledger',   0.85],
  ['/admin/settings',       'gears',    0.8],
  ['/admin/panel-host',     'hosting',  0.85],
  ['/admin/panel',          'gears',    0.8],
  ['/admin/vps',            'hosting',  0.85],
  ['/admin/packages',       'hosting',  0.85],
  ['/admin/dashboard',      'gauges',   0.8],
  ['/admin/login',          'lock',     0.9],
  ['/api/admin',            'terminal', 0.8],

  // ── User site ────────────────────────────────────────────────────────────
  ['/api/docs',             'terminal', 0.8],
  ['/api/explorer',         'terminal', 0.8],
  ['/api/status',           'gauges',   0.8],
  ['/api/dashboard',        'gauges',   0.8],
  ['/api',                  'terminal', 0.8],
  ['/devices',              'tiles',    0.85],
  ['/whatsapp-bot',         'tiles',    0.85],
  ['/subscription',         'ledger',   0.8],
  ['/payments',             'ledger',   0.8],
  ['/wallet',               'ledger',   0.8],
  ['/payment',              'ledger',   0.8],
  ['/account',              'gears',    0.75],
  ['/help',                 'bubbles',  0.8],
  ['/contact',              'bubbles',  0.8],
  ['/about',                'crowd',    0.8],
  ['/testimonials',         'crowd',    0.8],
  ['/temp-number',          'sim',      0.85],
  ['/ludo',                 'dice',     0.8],
  ['/vps',                  'hosting',  0.8],
  ['/products',             'hosting',  0.8],
  // Long-form reading: keep the artwork almost subliminal.
  ['/privacy',              'scroll',   0.45],
  ['/terms',                'scroll',   0.45],
  ['/login',                'lock',     0.9],
  ['/signup',               'lock',     0.9],
  ['/forgot-password',      'lock',     0.9],
  ['/dashboard',            'gauges',   0.8],
];

/** Longest-prefix match, with `/` matched exactly only. */
function backdropFor(pathname) {
  if (!pathname) return null;
  if (pathname === '/') return { kind: 'mesh', opacity: 0.8 };
  for (const [prefix, kind, opacity] of ROUTES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return { kind, opacity };
    }
  }
  return { kind: 'mesh', opacity: 0.7 };
}

export default function RouteBackdrop() {
  const pathname = usePathname();
  const spec = backdropFor(pathname);
  if (!spec) return null;

  // `key` remounts the canvas when the route changes subject, so the previous
  // drawing can never linger for a frame under the new route's scrim.
  return (
    <div
      aria-hidden="true"
      className="backdrop-root"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <div className="backdrop-img" style={{ '--backdrop-image': spec.opacity }}>
        <CanvasArt
          key={spec.kind}
          kind={spec.kind}
          bare
          decorative
          animate={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      </div>
      {/* Contrast guarantee: the reason any artwork is safe behind text. */}
      <div className="backdrop-scrim" />
    </div>
  );
}
