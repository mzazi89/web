'use client';

import { useEffect, useRef } from 'react';

// MZAZI TECH — the "did it work?" answer for a form.
//
// A ring draws itself, then the verdict draws inside it: a tick when the action
// succeeded, a cross when it did not (wrong password, failed sign-up, validation
// error). Everything is SVG + CSS keyframes (see `.verdict*` in
// app/globals.css), so there is no animation library, no JS frame loop, and it
// collapses to a static mark under `prefers-reduced-motion`.
//
// Why it covers the card instead of appearing above it: the answer belongs to
// the form the person just submitted, and showing it in place means the fields
// never jump while they are still looking at them.

export default function FeedbackMark({ status = 'success', message, size = 96 }) {
  const ok = status !== 'error';

  return (
    <div className="verdict-inner">
      <span className="verdict-halo" aria-hidden="true" />

      <svg
        className="verdict-ring"
        width={size}
        height={size}
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle className="verdict-track" cx="48" cy="48" r="42" />
        <circle className="verdict-circle" cx="48" cy="48" r="42" />

        {ok ? (
          <path className="verdict-glyph" d="M30 49.5 43 62 67 34" />
        ) : (
          <>
            <path className="verdict-glyph" d="M35 35 61 61" />
            <path className="verdict-glyph" d="M61 35 35 61" />
          </>
        )}
      </svg>

      {message ? <p className="verdict-text">{message}</p> : null}
    </div>
  );
}

/**
 * VerdictOverlay — positions the mark over its parent card and dismisses
 * itself. Pass `ttl={0}` when the page is about to navigate (success) and a
 * duration in ms when the person needs to read it and retry (failure).
 *
 * `verdict` shape: { id, status: 'success' | 'error', message }
 * `id` must change between attempts, otherwise React reuses the node and the
 * CSS animation will not replay for a second wrong password.
 */
export function VerdictOverlay({ verdict, ttl = 1800, onDone }) {
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!verdict || !ttl) return undefined;
    const timer = window.setTimeout(() => done.current && done.current(), ttl);
    return () => window.clearTimeout(timer);
  }, [verdict, ttl]);

  if (!verdict) return null;

  return (
    <div
      key={verdict.id}
      className="verdict"
      data-status={verdict.status === 'error' ? 'error' : 'success'}
      role={verdict.status === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <FeedbackMark status={verdict.status} message={verdict.message} />
    </div>
  );
}
