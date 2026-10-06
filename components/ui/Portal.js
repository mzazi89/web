'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders its children into <body>.
 *
 * This exists because <main> carries `.app-content`, which declares
 * `position: relative; z-index: 1` to stay above the fixed RouteBackdrop layers.
 * A positioned element with a z-index opens a stacking context, so anything
 * rendered inside <main> is confined to it and cannot paint above a sibling of
 * <main> — however high its own z-index is. <Footer> is exactly that sibling
 * (`position: relative; z-index: 1`, later in the DOM), so a full-screen overlay
 * written inside a page painted *under* the footer and had its bottom cut off.
 *
 * Use this for anything that must sit above the page: overlays, sheets, custom
 * dialogs. Modal.js does the same thing inline; this wrapper is the version for
 * one-off overlays that don't go through Modal.
 *
 * The one-frame hold-back keeps `document` out of the server render.
 */
export default function Portal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
