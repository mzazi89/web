'use client';

import { useEffect, useState } from 'react';

// MZAZI TECH — the first-open animation.
//
// Shown once per browser session, not once per page: a splash that reappears on
// every navigation is a delay, not a welcome. It is also capped — whatever
// happens, it is gone within a second, because the site must never wait on its
// own decoration.
//
// Skipped entirely for prefers-reduced-motion.

export default function IntroSplash() {
  const [state, setState] = useState('idle'); // idle | in | out

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce) return undefined;

    let seen = true;
    try {
      seen = sessionStorage.getItem('mz:intro') === '1';
    } catch {
      seen = false;
    }
    if (seen) return undefined;

    try {
      sessionStorage.setItem('mz:intro', '1');
    } catch {}

    setState('in');
    const leave = setTimeout(() => setState('out'), 620);
    const clear = setTimeout(() => setState('idle'), 980);
    return () => {
      clearTimeout(leave);
      clearTimeout(clear);
    };
  }, []);

  if (state === 'idle') return null;

  return (
    <div className={`intro ${state === 'out' ? 'is-leaving' : ''}`} aria-hidden="true">
      <div className="intro-inner">
        <span className="intro-mark">
          <img src="/brand/logo.png" alt="" width="56" height="56" />
        </span>
        <span className="intro-word">
          MZAZI<span>TECH</span>
        </span>
        <svg className="intro-ring" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="introStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2e6bff" />
              <stop offset="55%" stopColor="#4d8bff" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <circle className="intro-track" cx="50" cy="50" r="46" />
          <circle className="intro-arc" cx="50" cy="50" r="46" />
        </svg>
      </div>
    </div>
  );
}
