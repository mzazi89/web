'use client';

import { useId } from 'react';

// MZAZI TECH — the loading ring.
//
// One component for every "we are working" moment: button spinners, page
// loaders, the first-open overlay. It is an SVG rather than a spinning border
// because a gradient and rounded stroke ends look deliberate at 14 px and at
// 112 px, and because the arc can breathe while the ring turns — the difference
// between "busy" and "broken".
//
// r = 47 in a 100 viewBox, which makes the circumference 295.35 — the numbers
// in the CSS keyframes are derived from that, so keep them in step if the
// radius ever changes.

export default function Ring({ size = 18, stroke = 3.5, glow = false, className = '' }) {
  const raw = useId();
  const id = `rg${raw.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      className={['ring', glow ? 'ring-glow' : '', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2e6bff" />
          <stop offset="58%" stopColor="#4d8bff" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(122,180,255,.20)" strokeWidth={stroke} />
      <circle
        className="ring-arc"
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}
