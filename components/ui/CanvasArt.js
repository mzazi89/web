'use client';

// MZAZI TECH — canvas artwork.
//
// Photographic stills on the marketing pages were replaced with drawings made at
// runtime. Two reasons: they stay razor sharp at any size and on any DPR, and
// they cost no network request at all — the whole illustration is a few hundred
// bytes of drawing code instead of a 60 kB webp.
//
// The important design rule: **colours are read from the live CSS custom
// properties**, not hard-coded. A canvas cannot use `var(--brand)`, so the usual
// workaround is a duplicated hex — which then silently keeps the old palette the
// next time the theme moves. Reading the tokens through getComputedStyle means
// this artwork follows `:root`, `[data-theme='dark']` and
// `prefers-color-scheme` for free, and it re-draws when the theme is toggled.
//
// Everything is drawn in relative units (fractions of the canvas box), so one
// routine serves a 320 px phone card and a 900 px hero banner.
//
// Accessibility: rendered as `role="img"` with a label, and all motion is skipped
// when the user prefers reduced motion.

import { useCallback, useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

// ─── colour helpers ──────────────────────────────────────────────────────────

/** Accepts `#rgb`, `#rrggbb`, `rgb()` or `rgba()` and returns an rgba() string. */
function withAlpha(color, a) {
  const c = String(color || '').trim();
  if (c.startsWith('rgb')) {
    const nums = c.replace(/^rgba?\(|\)$/g, '').split(',').map((n) => parseFloat(n));
    return `rgba(${nums[0] || 0}, ${nums[1] || 0}, ${nums[2] || 0}, ${a})`;
  }
  let h = c.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  if (h.length !== 6) return `rgba(37, 99, 235, ${a})`;
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/**
 * Live palette from the design tokens. Falls back to the blue ramp so the very
 * first paint (before styles resolve) still looks intentional.
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

// ─── drawing helpers ─────────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function dot(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function label(ctx, text, x, y, { size, weight = 700, color, align = 'center', letter = 0, font }) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (letter) ctx.letterSpacing = `${letter}px`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Largest size at or below `maxSize` at which `text` fits `maxWidth`.
 *
 * Canvas has no text-overflow and never wraps. Text painted into a fixed panel
 * therefore has to be measured first, or it runs straight over the edges — which
 * is exactly what the pairing code did at 34px inside a 152px panel.
 *
 * `letterSpacing` is applied by the caller, and some engines exclude it from
 * measureText, so callers pass a width with a little slack.
 */
function fitText(ctx, text, maxWidth, { maxSize, minSize = 6, weight = 800, font }) {
  let size = maxSize;
  for (let i = 0; i < 120 && size > minSize; i++) {
    ctx.save();
    ctx.font = `${weight} ${size}px ${font}`;
    const w = ctx.measureText(text).width;
    ctx.restore();
    if (w <= maxWidth) break;
    size -= 0.5;
  }
  return size;
}

// ─── illustrations ───────────────────────────────────────────────────────────
// Each receives (ctx, w, h, P, t) where t is elapsed ms — used only by the
// animated kinds.

/**
 * mesh — the hero: a hub with satellites, pulses travelling the links.
 * Reads as "one account, many automations" without a single word.
 */
function mesh(ctx, w, h, P, t) {
  const cx = w * 0.5;
  const cy = h * 0.54;
  const R = Math.min(w * 0.33, h * 0.34);

  // ambient wash so the artwork sits on the glass card rather than floating
  const wash = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.62);
  wash.addColorStop(0, withAlpha(P.brand, P.dark ? 0.16 : 0.1));
  wash.addColorStop(0.55, withAlpha(P.blue, P.dark ? 0.06 : 0.04));
  wash.addColorStop(1, withAlpha(P.brand, 0));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  const sat = [];
  const N = 6;
  for (let i = 0; i < N; i++) {
    const a = (Math.PI * 2 * i) / N - Math.PI / 2 + 0.35;
    sat.push({ x: cx + Math.cos(a) * R * 1.06, y: cy + Math.sin(a) * R * 0.82, a });
  }

  // links
  for (const s of sat) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const mx = (cx + s.x) / 2 + Math.cos(s.a + Math.PI / 2) * R * 0.12;
    const my = (cy + s.y) / 2 + Math.sin(s.a + Math.PI / 2) * R * 0.12;
    ctx.quadraticCurveTo(mx, my, s.x, s.y);
    ctx.strokeStyle = withAlpha(P.brand, P.dark ? 0.3 : 0.22);
    ctx.lineWidth = Math.max(1, h * 0.0035);
    ctx.stroke();
  }

  // pulses
  const period = 2600;
  for (let i = 0; i < sat.length; i++) {
    const s = sat[i];
    const p = (((t + (i * period) / sat.length) % period) / period);
    const mx = (cx + s.x) / 2 + Math.cos(s.a + Math.PI / 2) * R * 0.12;
    const my = (cy + s.y) / 2 + Math.sin(s.a + Math.PI / 2) * R * 0.12;
    const k = p;
    const x = (1 - k) * (1 - k) * cx + 2 * (1 - k) * k * mx + k * k * s.x;
    const y = (1 - k) * (1 - k) * cy + 2 * (1 - k) * k * my + k * k * s.y;
    const fade = Math.sin(p * Math.PI);
    dot(ctx, x, y, h * 0.009 * (0.6 + fade), withAlpha(P.brandBright, 0.25 + 0.75 * fade));
  }

  // satellites
  const sSize = Math.min(w, h) * 0.1;
  for (const s of sat) {
    ctx.save();
    ctx.shadowColor = withAlpha(P.brand, 0.45);
    ctx.shadowBlur = 14;
    roundRect(ctx, s.x - sSize / 2, s.y - sSize / 2, sSize, sSize, sSize * 0.3);
    ctx.fillStyle = P.surface;
    ctx.fill();
    ctx.restore();
    roundRect(ctx, s.x - sSize / 2, s.y - sSize / 2, sSize, sSize, sSize * 0.3);
    ctx.strokeStyle = withAlpha(P.brand, 0.4);
    ctx.lineWidth = Math.max(1, h * 0.003);
    ctx.stroke();
    dot(ctx, s.x, s.y, sSize * 0.15, withAlpha(P.brandBright, 0.9));
  }

  // hub
  const hs = Math.min(w, h) * 0.17;
  const pulse = 1 + Math.sin(t / 900) * 0.03;
  ctx.save();
  ctx.shadowColor = withAlpha(P.brand, 0.75);
  ctx.shadowBlur = 34;
  const g = ctx.createLinearGradient(cx - hs, cy - hs, cx + hs, cy + hs);
  g.addColorStop(0, P.brand);
  g.addColorStop(1, P.brandDeep);
  roundRect(ctx, cx - (hs * pulse) / 2, cy - (hs * pulse) / 2, hs * pulse, hs * pulse, hs * 0.32);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();

  // bolt glyph inside the hub
  ctx.save();
  ctx.fillStyle = '#fff';
  const b = hs * 0.42;
  ctx.beginPath();
  ctx.moveTo(cx + b * 0.12, cy - b);
  ctx.lineTo(cx - b * 0.62, cy + b * 0.1);
  ctx.lineTo(cx - b * 0.02, cy + b * 0.1);
  ctx.lineTo(cx - b * 0.12, cy + b);
  ctx.lineTo(cx + b * 0.62, cy - b * 0.12);
  ctx.lineTo(cx + b * 0.02, cy - b * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * pairing — a handset showing the 8-character pairing code.
 * Matches the copy beside it ("link any number with a pairing code").
 */
function pairing(ctx, w, h, P) {
  const pw = Math.min(w * 0.42, h * 0.62);
  const ph = Math.min(h * 0.84, pw * 1.85);
  const x = (w - pw) / 2;
  const y = (h - ph) / 2 + h * 0.03;

  const wash = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.6);
  wash.addColorStop(0, withAlpha(P.brand, P.dark ? 0.14 : 0.08));
  wash.addColorStop(1, withAlpha(P.brand, 0));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  // signal arcs radiating from the top of the handset
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(w / 2, y, pw * (0.42 + i * 0.3), -Math.PI * 0.78, -Math.PI * 0.22);
    ctx.strokeStyle = withAlpha(P.brandBright, 0.42 / i);
    ctx.lineWidth = Math.max(1.2, h * 0.005);
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // handset body
  ctx.save();
  ctx.shadowColor = withAlpha(P.brand, 0.35);
  ctx.shadowBlur = 26;
  roundRect(ctx, x, y, pw, ph, pw * 0.15);
  ctx.fillStyle = P.surface;
  ctx.fill();
  ctx.restore();
  roundRect(ctx, x, y, pw, ph, pw * 0.15);
  ctx.strokeStyle = withAlpha(P.brand, 0.45);
  ctx.lineWidth = Math.max(1, h * 0.004);
  ctx.stroke();

  // screen
  const ix = x + pw * 0.09;
  const iy = y + ph * 0.1;
  const iw = pw * 0.82;
  const ih = ph * 0.8;
  roundRect(ctx, ix, iy, iw, ih, pw * 0.09);
  ctx.fillStyle = P.dark ? 'rgba(4,6,13,.72)' : 'rgba(255,255,255,.55)';
  ctx.fill();

  // earpiece
  roundRect(ctx, w / 2 - pw * 0.12, y + ph * 0.045, pw * 0.24, ph * 0.014, ph * 0.01);
  ctx.fillStyle = withAlpha(P.brand, 0.5);
  ctx.fill();

  // the code panel
  const code = 'MZ4Z·9K2P';
  const cw = iw * 0.82;
  const ch = ih * 0.3;
  const cx0 = ix + (iw - cw) / 2;
  const cy0 = iy + ih * 0.22;
  roundRect(ctx, cx0, cy0, cw, ch, pw * 0.06);
  ctx.fillStyle = withAlpha(P.brand, P.dark ? 0.2 : 0.1);
  ctx.fill();
  ctx.strokeStyle = withAlpha(P.brand, 0.34);
  ctx.lineWidth = 1;
  ctx.stroke();

  const codeLetter = Math.max(0.5, pw * 0.012);
  const codeSize = fitText(ctx, code, cw * 0.84, {
    maxSize: pw * 0.16, minSize: 7, weight: 800, font: P.font,
  });
  label(ctx, code, ix + iw / 2, cy0 + ch * 0.52, {
    size: codeSize, weight: 800, color: P.brandBright, letter: codeLetter, font: P.font,
  });

  const capLetter = Math.max(0.4, pw * 0.01);
  const capSize = fitText(ctx, 'PAIRING CODE', cw * 0.9, {
    maxSize: pw * 0.072, minSize: 5, weight: 800, font: P.font,
  });
  label(ctx, 'PAIRING CODE', ix + iw / 2, cy0 - ch * 0.36, {
    size: capSize, weight: 800, color: withAlpha(P.muted, 0.95), letter: capLetter, font: P.font,
  });

  // three todo rows, drawing the eye down the screen
  for (let i = 0; i < 3; i++) {
    const ry = cy0 + ch + ih * (0.16 + i * 0.13);
    const rw = iw * (0.72 - i * 0.09);
    roundRect(ctx, ix + iw * 0.09, ry, rw, ih * 0.062, ih * 0.031);
    ctx.fillStyle = withAlpha(P.brandBright, 0.26 - i * 0.06);
    ctx.fill();
    dot(ctx, ix + iw * 0.05, ry + ih * 0.031, ih * 0.019, withAlpha(P.blue, 0.85));
  }

  // home indicator
  roundRect(ctx, w / 2 - pw * 0.15, y + ph * 0.955, pw * 0.3, ph * 0.008, ph * 0.004);
  ctx.fillStyle = withAlpha(P.brand, 0.45);
  ctx.fill();
}

/**
 * flow — three stages left to right with a travelling marker.
 * Mirrors the three numbered steps printed next to it.
 */
function flow(ctx, w, h, P, t) {
  const pad = Math.min(w, h) * 0.09;
  const nodes = ['LINK', 'CHOOSE', 'AUTOMATE'];
  const cols = 3;
  const gap = (w - pad * 2) / cols;
  const boxW = gap * 0.66;
  const boxH = Math.min(h * 0.46, boxW * 0.95);
  const cy = h * 0.5;

  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, withAlpha(P.brand, P.dark ? 0.12 : 0.07));
  wash.addColorStop(1, withAlpha(P.blue, P.dark ? 0.08 : 0.05));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < cols; i++) {
    const bx = pad + i * gap + (gap - boxW) / 2;
    const by = cy - boxH / 2;

    ctx.save();
    ctx.shadowColor = withAlpha(P.brand, 0.3);
    ctx.shadowBlur = 18;
    roundRect(ctx, bx, by, boxW, boxH, boxW * 0.16);
    ctx.fillStyle = P.surface;
    ctx.fill();
    ctx.restore();
    roundRect(ctx, bx, by, boxW, boxH, boxW * 0.16);
    ctx.strokeStyle = withAlpha(P.brand, 0.34);
    ctx.lineWidth = Math.max(1, h * 0.004);
    ctx.stroke();

    // index chip
    const chip = boxW * 0.24;
    ctx.beginPath();
    ctx.arc(bx + boxW / 2, by + boxH * 0.33, chip / 2, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha(P.brand, 0.18);
    ctx.fill();
    label(ctx, String(i + 1), bx + boxW / 2, by + boxH * 0.33, {
      size: chip * 0.5, weight: 800, color: P.brandBright, font: P.font,
    });

    label(ctx, nodes[i], bx + boxW / 2, by + boxH * 0.68, {
      size: Math.max(7, boxW * 0.135), weight: 800,
      color: P.ink2, letter: Math.max(0.3, boxW * 0.012), font: P.font,
    });

    // connector + travelling marker
    if (i < cols - 1) {
      const ax = bx + boxW + gap * 0.06;
      const bx2 = pad + (i + 1) * gap + (gap - boxW) / 2 - gap * 0.06;
      const my = cy + boxH * 0.14;
      ctx.beginPath();
      ctx.moveTo(ax, my);
      ctx.lineTo(bx2 - h * 0.014, my);
      ctx.strokeStyle = withAlpha(P.brand, 0.4);
      ctx.lineWidth = Math.max(1, h * 0.004);
      ctx.lineCap = 'round';
      ctx.stroke();

      // arrowhead, so the chain reads as a flow rather than three boxes
      ctx.beginPath();
      ctx.moveTo(bx2, my);
      ctx.lineTo(bx2 - h * 0.022, my - h * 0.014);
      ctx.lineTo(bx2 - h * 0.022, my + h * 0.014);
      ctx.closePath();
      ctx.fillStyle = withAlpha(P.brand, 0.5);
      ctx.fill();

      const p = ((t / 1800) + i * 0.33) % 1;
      dot(ctx, ax + (bx2 - ax - h * 0.014) * p, my, h * 0.013,
        withAlpha(P.brandBright, 0.35 + 0.65 * Math.sin(p * Math.PI)));
    }
  }
}

/**
 * scale — concentric device rings, labelled. Sits in the pricing teaser next to
 * the plan tags.
 */
function scale(ctx, w, h, P) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const R = Math.min(w, h) * 0.42;
  const rings = [
    { r: 0.28, text: '1' },
    { r: 0.46, text: '5' },
    { r: 0.63, text: '10' },
    { r: 0.8, text: '20' },
    { r: 1.0, text: '∞' },
  ];

  const wash = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
  wash.addColorStop(0, withAlpha(P.brand, P.dark ? 0.16 : 0.09));
  wash.addColorStop(1, withAlpha(P.brand, 0));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  rings.forEach((ring, i) => {
    ctx.beginPath();
    ctx.arc(cx, cy, R * ring.r, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(P.brand, 0.34 - i * 0.045);
    ctx.lineWidth = Math.max(1, h * 0.004);
    ctx.setLineDash(i === rings.length - 1 ? [h * 0.02, h * 0.016] : []);
    ctx.stroke();
    ctx.setLineDash([]);

    // A marker on each ring, stepping round so the eye spirals outward. Offset
    // off the top: the labels sit there, and a dot on top of a label reads as a
    // collision rather than a design.
    const a = -Math.PI / 2 + 0.62 + (i * Math.PI * 2) / rings.length;
    const mx = cx + Math.cos(a) * R * ring.r;
    const my = cy + Math.sin(a) * R * ring.r;
    dot(ctx, mx, my, h * 0.012, withAlpha(P.brandBright, 0.95));

    // Sit each label just inside the top of its OWN ring, so they stack down
    // the middle instead of piling up on one line at the centre.
    const size = Math.max(7, h * 0.032);
    const ly = cy - R * ring.r + size * 0.95;
    ctx.save();
    ctx.font = `800 ${size}px ${P.font}`;
    const tw = ctx.measureText(ring.text).width;
    ctx.restore();
    const pillW = tw + size * 1.1;
    roundRect(ctx, cx + size * 0.5, ly - size * 0.78, pillW, size * 1.55, size * 0.78);
    ctx.fillStyle = P.dark ? 'rgba(4,6,13,.72)' : 'rgba(255,255,255,.86)';
    ctx.fill();
    label(ctx, ring.text, cx + size * 0.5 + pillW / 2, ly, {
      size, weight: 800, color: withAlpha(P.muted, 0.95), font: P.font,
    });
  });

  ctx.save();
  ctx.shadowColor = withAlpha(P.brand, 0.7);
  ctx.shadowBlur = 24;
  dot(ctx, cx, cy, Math.min(w, h) * 0.075, P.brand);
  ctx.restore();
  label(ctx, '⚡', cx, cy + h * 0.004, {
    size: Math.min(w, h) * 0.085, weight: 700, color: '#fff', font: P.font,
  });
}

/**
 * hosting — server rack, for the panel/infrastructure mention.
 */
function hosting(ctx, w, h, P) {
  const rackW = Math.min(w * 0.66, h * 0.9);
  const unitH = rackW * 0.19;
  const totalH = unitH * 4 + unitH * 0.24;
  const x = (w - rackW) / 2;
  const y = (h - totalH) / 2;

  const wash = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
  wash.addColorStop(0, withAlpha(P.blue, P.dark ? 0.14 : 0.08));
  wash.addColorStop(1, withAlpha(P.blue, 0));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 4; i++) {
    const uy = y + i * unitH * 1.24;
    ctx.save();
    ctx.shadowColor = withAlpha(P.brand, 0.28);
    ctx.shadowBlur = 16;
    roundRect(ctx, x, uy, rackW, unitH, unitH * 0.18);
    ctx.fillStyle = P.surface;
    ctx.fill();
    ctx.restore();
    roundRect(ctx, x, uy, rackW, unitH, unitH * 0.18);
    ctx.strokeStyle = withAlpha(P.brand, 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();

    // status lamp + two drive slots
    dot(ctx, x + unitH * 0.42, uy + unitH / 2, unitH * 0.09,
      i === 1 ? withAlpha(P.blueBright, 0.95) : withAlpha(P.brandBright, 0.9));
    for (let k = 0; k < 2; k++) {
      roundRect(ctx, x + rackW * (0.58 + k * 0.19), uy + unitH * 0.3,
        rackW * 0.14, unitH * 0.4, unitH * 0.09);
      ctx.fillStyle = withAlpha(P.brand, 0.16);
      ctx.fill();
    }
    roundRect(ctx, x + rackW * 0.14, uy + unitH * 0.32, rackW * 0.24, unitH * 0.36, unitH * 0.1);
    ctx.fillStyle = withAlpha(P.brand, 0.24);
    ctx.fill();
  }
}

const KINDS = { mesh, pairing, flow, scale, hosting };

// ─── component ───────────────────────────────────────────────────────────────

export default function CanvasArt({
  kind = 'mesh',
  ratio = '4-3',              // '1-1' | '4-3' | '16-9' | '3-4' | 'auto'
  label = '',                 // accessible name, also used as the caption
  rounded = 'xl',
  animate = true,             // only some kinds use it
  className = '',
  style,
}) {
  const ref = useRef(null);
  const raf = useRef(0);
  const { resolved } = useTheme();   // redraw when light/dark flips

  const radius = { none: 0, sm: 'var(--r-sm)', md: 'var(--r-md)', lg: 'var(--r-lg)', xl: 'var(--r-xl)', full: '999px' }[rounded] ?? 'var(--r-xl)';
  const ratioClass = ratio === 'auto' ? '' : `media-${ratio}`;

  const draw = useCallback((t) => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    (KINDS[kind] || mesh)(ctx, w, h, readPalette(), t);
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

    // first paint, then size-driven repaints (the grid re-flows on resize)
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

  return (
    <div
      className={`media ${ratioClass} ${className}`}
      style={{ borderRadius: radius, ...style }}
      role="img"
      aria-label={label || 'MZAZI TECH illustration'}
    >
      <canvas
        ref={ref}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
