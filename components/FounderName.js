'use client';

// MZAZI TECH — the founder's name, typed.
//
// Three constraints shaped this:
//
//   1. It has to be readable before JavaScript runs. The first render (server
//      AND the first client render, so hydration matches) is the COMPLETE name;
//      the effect then clears it and types it back in. A name that only exists
//      after hydration is invisible to a crawler and flashes empty to a slow
//      phone.
//   2. It has to stop for anyone who asked motion to stop. `prefers-reduced-
//      motion: reduce` keeps the finished name on screen and starts no timers.
//   3. The text has to be one string to a screen reader. The animated spans are
//      aria-hidden and the wrapper carries the real label, so the name is never
//      read out one letter at a time.
//
// Timing is deliberately slow-ish (85ms/character, 2.6s hold): a name that
// re-types itself every second is a distraction, not a flourish.
import { useEffect, useRef, useState } from 'react';

const LINE_1 = 'Dominic Mokua';
const LINE_2 = 'Kerubo.';
const TYPE_MS = 85;
const DELETE_MS = 32;
const HOLD_MS = 2600;
const GAP_MS = 320;

export default function FounderName({ className = '' }) {
  const [typed1, setTyped1] = useState(LINE_1.length);
  const [typed2, setTyped2] = useState(LINE_2.length);
  const [caretLine, setCaretLine] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    const reduced = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    let cancelled = false;
    const later = (fn, ms) => {
      const id = setTimeout(() => { if (!cancelled) fn(); }, ms);
      timers.current.push(id);
    };

    // Clear, then type line 1, then line 2, hold, delete, repeat.
    const run = (l1, l2) => {
      setTyped1(l1);
      setTyped2(l2);
      if (l1 < LINE_1.length) {
        setCaretLine(1);
        later(() => run(l1 + 1, l2), TYPE_MS);
        return;
      }
      if (l2 < LINE_2.length) {
        setCaretLine(2);
        later(() => run(l1, l2 + 1), TYPE_MS);
        return;
      }
      later(() => erase(LINE_1.length, LINE_2.length), HOLD_MS);
    };

    const erase = (l1, l2) => {
      setTyped1(l1);
      setTyped2(l2);
      if (l2 > 0) {
        setCaretLine(2);
        later(() => erase(l1, l2 - 1), DELETE_MS);
        return;
      }
      if (l1 > 0) {
        setCaretLine(1);
        later(() => erase(l1 - 1, l2), DELETE_MS);
        return;
      }
      later(() => run(0, 0), GAP_MS);
    };

    const start = setTimeout(() => { if (!cancelled) run(0, 0); }, 260);
    timers.current.push(start);

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const caret = (line) => (
    <span
      className={`fn-caret${caretLine === line ? ' is-on' : ''}`}
      aria-hidden="true"
    />
  );

  return (
    <span className={`founder-name ${className}`.trim()} aria-label={`${LINE_1} ${LINE_2}`}>
      <span className="fn-line" aria-hidden="true">
        {LINE_1.slice(0, typed1)}
        {caret(1)}
      </span>
      <br />
      <span className="fn-line fn-line-accent" aria-hidden="true">
        {LINE_2.slice(0, typed2)}
        {caret(2)}
      </span>
    </span>
  );
}
