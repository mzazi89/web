'use client';

// MZAZI TECH — the canvas artwork component.
//
// Draws one of the illustrations from ./artKinds.js into a <canvas>. All drawing
// lives in that module; this file is only the React/DOM half: sizing, device pixel
// ratio, theme awareness, resize handling and reduced motion.
//
// The important design rule: **colours are read from the live CSS custom
// properties**, never hard-coded. A canvas cannot use `var(--brand)`, and the
// usual workaround — a duplicated hex — silently keeps the old palette the next
// time the theme moves, which is exactly what happened to the favicon during the
// retone. Reading the tokens through getComputedStyle means this artwork follows
// :root, [data-theme='dark'] and prefers-color-scheme for free, and repaints when
// the theme is toggled.
//
// Accessibility: rendered as role="img" with a label, and all motion is skipped
// when the user prefers reduced motion.

import { useCallback, useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';
import { KINDS } from './artKinds';

/**
 * Live palette from the design tokens. Falls back to the blue ramp so the very
 * first paint, before styles resolve, still looks intentional.
 */
function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const g = (name, fallback) => {
    const v = cs.getPropertyValue(name);
    return v && v.trim() ? v.trim() : fallback;
  };
  const scheme = document.documentElement.style.colorScheme;
  const dark = scheme ? scheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;

  return {
    dark,
    brand: g('--brand', dark ? '#60A5FA' : '#2563EB'),
    brandBright: g('--brand-bright', dark ? '#93C5FD' : '#3B82F6'),
    brandDeep: g('--brand-deep', dark ? '#3B82F6' : '#1D4ED8'),
    blue: g('--blue', dark ? '#38BDF8' : '#0284C7'),
    blueBright: g('--blue-bright', dark ? '#7DD3FC' : '#0EA5E9'),
    sky: g('--pink', dark ? '#7DD3FC' : '#0369A1'),
    deep: g('--yellow', dark ? '#BFDBFE' : '#1E40AF'),
    ink: g('--ink', dark ? '#FFFFFF' : '#05070D'),
    ink2: g('--ink-2', dark ? '#C9D3E6' : '#33405A'),
    muted: g('--muted', dark ? '#B6C2D9' : '#46536E'),
    surface: g('--surface', dark ? 'rgba(15,21,37,.72)' : 'rgba(255,255,255,.82)'),
    surface2: g('--surface-2', dark ? 'rgba(23,30,50,.6)' : 'rgba(255,255,255,.66)'),
    line: g('--line', dark ? 'rgba(52,64,96,.72)' : 'rgba(203,213,229,.82)'),
    a08: g('--brand-a08', 'rgba(37,99,235,.08)'),
    a15: g('--brand-a15', 'rgba(37,99,235,.15)'),
    a25: g('--brand-a25', 'rgba(37,99,235,.25)'),
    a45: g('--brand-a45', 'rgba(37,99,235,.45)'),
    font: g('--font-display', 'system-ui, sans-serif').replace(/^["']|["']$/g, ''),
  };
}

const RADII = {
  none: 0, sm: 'var(--r-sm)', md: 'var(--r-md)',
  lg: 'var(--r-lg)', xl: 'var(--r-xl)', full: '999px',
};

export default function CanvasArt({
  kind = 'mesh',
  ratio = '4-3',              // '1-1' | '4-3' | '16-9' | '3-4' | 'auto'
  label = '',                 // accessible name
  rounded = 'xl',
  animate = true,             // only the animated kinds use it
  decorative = false,         // skip role/label when the art is purely ambience
  bare = false,               // skip the .media frame (for full-bleed backdrops)
  className = '',
  style,
}) {
  const ref = useRef(null);
  const raf = useRef(0);
  const { resolved } = useTheme();   // redraw when light/dark flips

  const radius = RADII[rounded] ?? RADII.xl;
  const ratioClass = ratio === 'auto' ? '' : `media-${ratio}`;

  const draw = useCallback((t) => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    // Capped at 2x: a 4K backdrop at 3x would be a 30 MP buffer for no visible gain.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    (KINDS[kind] || KINDS.mesh)(ctx, w, h, readPalette(), t);
  }, [kind]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const running = animate && !reduce;
    const start = performance.now();

    const frame = () => {
      draw(performance.now() - start);
      raf.current = requestAnimationFrame(frame);
    };

    draw(0);
    const ro = new ResizeObserver(() => draw(running ? performance.now() - start : 0));
    ro.observe(canvas);

    if (running) raf.current = requestAnimationFrame(frame);

    const onVisibility = () => {
      if (!running) return;
      cancelAnimationFrame(raf.current);
      if (!document.hidden) raf.current = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [draw, animate, resolved]);

  const canvasStyle = { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' };

  // `bare` drops the .media frame, which paints a surface fill and a hairline
  // border. A full-bleed page backdrop must not have either.
  if (bare) {
    return <canvas ref={ref} className={className} style={{ ...canvasStyle, ...style }} aria-hidden="true" />;
  }

  return (
    <div
      className={`media ${ratioClass} ${className}`}
      style={{ borderRadius: radius, ...style }}
      {...(decorative
        ? { 'aria-hidden': 'true' }
        : { role: 'img', 'aria-label': label || 'MZAZI TECH illustration' })}
    >
      <canvas ref={ref} aria-hidden="true" style={canvasStyle} />
    </div>
  );
}
