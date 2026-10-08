// MZAZI TECH — canvas drawing routines.
//
// Every illustration in the product is drawn here at runtime rather than shipped
// as an image. Two reasons: it stays vector-crisp at any size and any DPR, and it
// costs no network request — a few hundred bytes of drawing code instead of a
// 40-60 kB webp. The site's 19 route wallpapers alone were 524 kB of photographs.
//
// The hard rule: **colours come from the caller's palette, which is read from the
// live CSS custom properties** (see CanvasArt.readPalette). A canvas cannot use
// `var(--brand)` and the usual workaround — a duplicated hex — silently keeps the
// old palette the next time the theme moves. That is exactly what happened to the
// favicon during the retone, so it is worth the indirection.
//
// Two families live here:
//   · foreground art  — small, detailed, sits inside a card (mesh, pairing, …)
//   · backdrop motifs — full-bleed, few and large, drawn behind a whole page and
//                       then veiled by a scrim, where fine detail would be wasted
//
// This module has no React in it, so the drawing code can be unit-tested and
// rasterised headlessly.

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

/* ── backdrop motifs ──────────────────────────────────────────────────────────
   Drawn full-bleed behind an entire page, then veiled by a scrim. That changes
   the brief completely from the foreground art above: detail is wasted behind a
   scrim, so these are built from FEWER, MUCH LARGER, higher-contrast elements —
   usually one dominant object and one supporting one.

   All of them centre their composition and open with the same radial wash, so
   moving between routes never feels like the design language changed. Every
   colour comes from the caller's palette, which is itself read from the live CSS
   custom properties — so these follow light/dark automatically.
   ─────────────────────────────────────────────────────────────────────────── */

/** The shared opening wash: a soft glow pulling the eye to the middle. */
function wash(ctx, w, h, P, color, strength) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.44, 0, w * 0.5, h * 0.44, Math.max(w, h) * 0.72);
  g.addColorStop(0, withAlpha(color, strength * (P.dark ? 1.45 : 1)));
  g.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** A glowing rounded panel — the base of most backdrop compositions. */
function panel(ctx, x, y, w, h, P, r) {
  ctx.save();
  ctx.shadowColor = withAlpha(P.brand, 0.34);
  ctx.shadowBlur = Math.min(w, h) * 0.16;
  roundRect(ctx, x, y, w, h, r === undefined ? Math.min(w, h) * 0.09 : r);
  ctx.fillStyle = P.surface;
  ctx.fill();
  ctx.restore();
  roundRect(ctx, x, y, w, h, r === undefined ? Math.min(w, h) * 0.09 : r);
  ctx.strokeStyle = withAlpha(P.brand, 0.32);
  ctx.lineWidth = Math.max(1.5, Math.min(w, h) * 0.006);
  ctx.stroke();
}

/** A stack of soft bars — used for lists, code, and text-heavy motifs. */
function bars(ctx, x, y, w, count, gap, hgt, P, shrink) {
  for (let i = 0; i < count; i++) {
    roundRect(ctx, x, y + i * gap, w * (1 - i * (shrink || 0.12)), hgt, hgt / 2);
    ctx.fillStyle = withAlpha(P.brandBright, 0.3 - i * 0.035);
    ctx.fill();
  }
}

/** terminal — developer APIs: braces around a block of code lines. */
function terminal(ctx, w, h, P) {
  wash(ctx, w, h, P, P.brand, 0.13);
  const bw = w * 0.46, bh = h * 0.56;
  const x = w * 0.5 - bw / 2, y = h * 0.5 - bh / 2;
  panel(ctx, x, y, bw, bh, P);

  // The braces: { and }, pushed well apart and tall, so they frame the code
  // rather than closing on each other into a diamond.
  const bs = bh * 0.66, mid = h * 0.5;
  ctx.lineWidth = Math.max(2, bw * 0.014);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = withAlpha(P.brand, 0.7);
  // Curved, not polygonal. Straight segments made the pair read as a closed
  // hexagon; a real brace is two arcs meeting at a single outward point.
  const reach = bs * 0.26;   // how wide each brace opens
  const nub = bs * 0.2;      // how far the middle point sticks out
  for (const [bx, dir] of [[x + bw * 0.24, 1], [x + bw * 0.76, -1]]) {
    ctx.beginPath();
    ctx.moveTo(bx + dir * reach, mid - bs / 2);
    ctx.quadraticCurveTo(bx - dir * nub * 0.15, mid - bs * 0.27, bx - dir * nub, mid);
    ctx.quadraticCurveTo(bx - dir * nub * 0.15, mid + bs * 0.27, bx + dir * reach, mid + bs / 2);
    ctx.stroke();
  }
  // code lines, filling the gap the braces now leave open
  bars(ctx, x + bw * 0.36, y + bh * 0.24, bw * 0.28, 3, bh * 0.17, bh * 0.055, P, 0.14);
}

/** tiles — connected devices: a grid of handsets, one lit. */
function tiles(ctx, w, h, P) {
  wash(ctx, w, h, P, P.blue, 0.13);
  const cols = 3, rows = 2;
  const tw = Math.min(w * 0.17, h * 0.5), th = tw * 1.72;
  const gx = (w - cols * tw) / (cols + 1);
  const gy = (h - rows * th) / (rows + 1);
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gx + c * (tw + gx), y = gy + r * (th + gy);
      const lit = n === 1;
      ctx.save();
      if (lit) { ctx.shadowColor = withAlpha(P.brand, 0.6); ctx.shadowBlur = tw * 0.4; }
      roundRect(ctx, x, y, tw, th, tw * 0.2);
      ctx.fillStyle = lit ? withAlpha(P.brand, 0.34) : P.surface;
      ctx.fill();
      ctx.restore();
      roundRect(ctx, x, y, tw, th, tw * 0.2);
      ctx.strokeStyle = withAlpha(P.brand, lit ? 0.75 : 0.3);
      ctx.lineWidth = Math.max(1.5, tw * 0.035);
      ctx.stroke();
      roundRect(ctx, x + tw * 0.2, y + th * 0.14, tw * 0.6, th * 0.5, tw * 0.09);
      ctx.fillStyle = withAlpha(P.brandBright, lit ? 0.5 : 0.2);
      ctx.fill();
      dot(ctx, x + tw / 2, y + th * 0.84, tw * 0.07, withAlpha(P.brandBright, lit ? 0.95 : 0.4));
      n++;
    }
  }
}

/** ledger — money: stacked cards with value flowing between them. */
function ledger(ctx, w, h, P) {
  wash(ctx, w, h, P, P.brand, 0.13);
  const cw = w * 0.4, ch = cw * 0.62;
  for (let i = 0; i < 3; i++) {
    const x = w * 0.5 - cw / 2 + (i - 1) * cw * 0.14;
    const y = h * 0.5 - ch / 2 + (i - 1) * ch * 0.3;
    panel(ctx, x, y, cw, ch, P, ch * 0.14);
    roundRect(ctx, x + cw * 0.1, y + ch * 0.24, cw * 0.34, ch * 0.16, ch * 0.08);
    ctx.fillStyle = withAlpha(P.brandBright, 0.55 - i * 0.12);
    ctx.fill();
    dot(ctx, x + cw * 0.82, y + ch * 0.34, ch * 0.09, withAlpha(P.brand, 0.6));
  }
}

/** gears — settings: two meshed cogs with a toggle row. */
function gears(ctx, w, h, P) {
  wash(ctx, w, h, P, P.brand, 0.13);
  const cx = w * 0.5, cy = h * 0.46;
  const specs = [[cx - w * 0.06, cy, h * 0.2, 10], [cx + w * 0.13, cy + h * 0.14, h * 0.12, 8]];
  for (let s = 0; s < specs.length; s++) {
    const [gx, gy, R, teeth] = specs[s];
    ctx.save();
    ctx.shadowColor = withAlpha(P.brand, 0.3);
    ctx.shadowBlur = R * 0.5;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (Math.PI * i) / teeth;
      const r = i % 2 ? R : R * 0.82;
      const px = gx + Math.cos(a) * r, py = gy + Math.sin(a) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = s ? withAlpha(P.blue, 0.26) : withAlpha(P.brand, 0.34);
    ctx.fill();
    ctx.restore();
    dot(ctx, gx, gy, R * 0.3, P.surface);
  }
  for (let i = 0; i < 2; i++) {
    const y = h * 0.82 + i * h * 0.07;
    roundRect(ctx, cx - w * 0.14, y, w * 0.28, h * 0.04, h * 0.02);
    ctx.fillStyle = withAlpha(P.brand, 0.2);
    ctx.fill();
    dot(ctx, cx + w * (i ? 0.1 : -0.1), y + h * 0.02, h * 0.026,
      withAlpha(P.brandBright, i ? 0.95 : 0.5));
  }
}

/** bubbles — support: a large conversation pair. */
function bubbles(ctx, w, h, P) {
  wash(ctx, w, h, P, P.blue, 0.13);
  const bw = w * 0.4, bh = h * 0.2;
  const specs = [[w * 0.5 - bw * 0.72, h * 0.34, true], [w * 0.5 - bw * 0.28, h * 0.6, false]];
  for (const [x, y, mine] of specs) {
    ctx.save();
    ctx.shadowColor = withAlpha(P.brand, 0.3);
    ctx.shadowBlur = bh * 0.8;
    roundRect(ctx, x, y, bw, bh, bh * 0.36);
    ctx.fillStyle = mine ? withAlpha(P.brand, 0.34) : P.surface;
    ctx.fill();
    ctx.restore();
    roundRect(ctx, x, y, bw, bh, bh * 0.36);
    ctx.strokeStyle = withAlpha(P.brand, 0.4);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    bars(ctx, x + bw * 0.12, y + bh * 0.3, bw * 0.6, 2, bh * 0.28, bh * 0.13, P, 0.25);
  }
}

/** crowd — about and reviews: a cluster of people marks. */
function crowd(ctx, w, h, P) {
  wash(ctx, w, h, P, P.brand, 0.14);
  const R = Math.min(w, h) * 0.075;
  const mid = { x: w * 0.5, y: h * 0.42 };
  const pts = [
    [0, 0], [-2.3, 0.5], [2.3, 0.5], [-1.3, 1.5], [1.3, 1.5],
    [-3.1, 1.4], [3.1, 1.4],
  ];
  pts.forEach(([dx, dy], i) => {
    const x = mid.x + dx * R * 1.15, y = mid.y + dy * R * 1.05;
    const big = i === 0;
    ctx.save();
    ctx.shadowColor = withAlpha(P.brand, big ? 0.55 : 0.25);
    ctx.shadowBlur = R * (big ? 0.9 : 0.4);
    ctx.beginPath();
    ctx.arc(x, y, R * (big ? 1.25 : 0.86), 0, Math.PI * 2);
    ctx.fillStyle = big ? withAlpha(P.brand, 0.4) : P.surface;
    ctx.fill();
    ctx.restore();
    // head over shoulders, the universal person mark
    dot(ctx, x, y - R * 0.2, R * 0.32, withAlpha(P.brandBright, big ? 0.85 : 0.45));
    roundRect(ctx, x - R * 0.5, y + R * 0.16, R, R * 0.55, R * 0.27);
    ctx.fillStyle = withAlpha(P.brandBright, big ? 0.6 : 0.3);
    ctx.fill();
  });
}

/** sim — temporary numbers: a SIM with signal arcs. */
function sim(ctx, w, h, P) {
  wash(ctx, w, h, P, P.blue, 0.13);
  const sw = Math.min(w * 0.26, h * 0.42), sh = sw * 0.78;
  const x = w * 0.5 - sw / 2, y = h * 0.5 - sh / 2;
  // Signal arcs above. Radii are kept inside the box: at 0.26 per step the
  // outermost arc ran off the top of the canvas and got clipped.
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(w * 0.5, y - sh * 0.06, sw * (0.26 + i * 0.17), -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.strokeStyle = withAlpha(P.brandBright, 0.5 / i);
    ctx.lineWidth = Math.max(2, sh * 0.05);
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.save();
  ctx.shadowColor = withAlpha(P.brand, 0.45);
  ctx.shadowBlur = sw * 0.3;
  ctx.beginPath();                       // clipped corner, like a real SIM
  ctx.moveTo(x + sw * 0.22, y);
  ctx.lineTo(x + sw, y);
  ctx.lineTo(x + sw, y + sh);
  ctx.lineTo(x, y + sh);
  ctx.lineTo(x, y + sh * 0.28);
  ctx.closePath();
  ctx.fillStyle = withAlpha(P.brand, 0.34);
  ctx.fill();
  ctx.restore();
  roundRect(ctx, x + sw * 0.18, y + sh * 0.34, sw * 0.64, sh * 0.5, sh * 0.12);
  ctx.fillStyle = P.surface;
  ctx.fill();
  bars(ctx, x + sw * 0.3, y + sh * 0.46, sw * 0.4, 2, sh * 0.16, sh * 0.06, P, 0.2);
}

/** dice — the Ludo room: pips and board squares. */
function dice(ctx, w, h, P) {
  wash(ctx, w, h, P, P.brand, 0.13);
  const d = Math.min(w, h) * 0.3;
  for (const [ox, oy, rot] of [[-0.28, -0.16, -0.14], [0.3, 0.14, 0.12]]) {
    const x = w * 0.5 + ox * d, y = h * 0.5 + oy * d;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.shadowColor = withAlpha(P.brand, 0.35);
    ctx.shadowBlur = d * 0.3;
    roundRect(ctx, -d / 2, -d / 2, d, d, d * 0.2);
    ctx.fillStyle = P.surface;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    roundRect(ctx, -d / 2, -d / 2, d, d, d * 0.2);
    ctx.strokeStyle = withAlpha(P.brand, 0.5);
    ctx.lineWidth = Math.max(2, d * 0.025);
    ctx.stroke();
    const off = d * 0.22;
    for (const [px, py] of [[-off, -off], [0, 0], [off, off], [off, -off], [-off, off]]) {
      dot(ctx, px, py, d * 0.062, withAlpha(P.brandBright, 0.85));
    }
    ctx.restore();
  }
}

/** scroll — legal pages: a document with a seal. Deliberately the calmest. */
function scroll(ctx, w, h, P) {
  wash(ctx, w, h, P, P.blue, 0.09);
  const dw = Math.min(w * 0.32, h * 0.5), dh = dw * 1.28;
  const x = w * 0.5 - dw / 2, y = h * 0.5 - dh / 2;
  panel(ctx, x, y, dw, dh, P, dw * 0.05);
  bars(ctx, x + dw * 0.14, y + dh * 0.16, dw * 0.62, 7, dh * 0.1, dh * 0.032, P, 0.06);
  const sx = x + dw * 0.78, sy = y + dh * 0.84;
  ctx.save();
  ctx.shadowColor = withAlpha(P.brand, 0.45);
  ctx.shadowBlur = dw * 0.18;
  dot(ctx, sx, sy, dw * 0.1, withAlpha(P.brand, 0.55));
  ctx.restore();
  dot(ctx, sx, sy, dw * 0.055, withAlpha(P.brandBright, 0.9));
}

/** lock — auth: a padlock whose shackle is open. */
function lock(ctx, w, h, P) {
  wash(ctx, w, h, P, P.brand, 0.14);
  const bw = Math.min(w * 0.22, h * 0.36), bh = bw * 0.86;
  const x = w * 0.5 - bw / 2, y = h * 0.5 - bh * 0.1;
  // shackle
  ctx.beginPath();
  ctx.arc(w * 0.5, y, bw * 0.34, Math.PI, 0);
  ctx.strokeStyle = withAlpha(P.brand, 0.6);
  ctx.lineWidth = Math.max(3, bw * 0.09);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = withAlpha(P.brand, 0.45);
  ctx.shadowBlur = bw * 0.4;
  roundRect(ctx, x, y, bw, bh, bw * 0.2);
  ctx.fillStyle = withAlpha(P.brand, 0.36);
  ctx.fill();
  ctx.restore();
  roundRect(ctx, x, y, bw, bh, bw * 0.2);
  ctx.strokeStyle = withAlpha(P.brand, 0.6);
  ctx.lineWidth = Math.max(1.5, bw * 0.025);
  ctx.stroke();
  dot(ctx, w * 0.5, y + bh * 0.42, bw * 0.09, withAlpha(P.brandBright, 0.9));
  roundRect(ctx, w * 0.5 - bw * 0.035, y + bh * 0.48, bw * 0.07, bh * 0.24, bw * 0.035);
  ctx.fillStyle = withAlpha(P.brandBright, 0.9);
  ctx.fill();
}

/** gauges — dashboards: a donut and a bar chart. */
function gauges(ctx, w, h, P) {
  wash(ctx, w, h, P, P.brand, 0.12);
  // donut
  const cx = w * 0.36, cy = h * 0.5, R = Math.min(w, h) * 0.16;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = withAlpha(P.brand, 0.22);
  ctx.lineWidth = R * 0.34;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI * 0.72);
  ctx.strokeStyle = withAlpha(P.brandBright, 0.85);
  ctx.lineWidth = R * 0.34;
  ctx.lineCap = 'round';
  ctx.stroke();
  // bars
  const bx = w * 0.6, base = h * 0.68, bw = w * 0.05;
  [0.4, 0.72, 0.55, 0.95].forEach((v, i) => {
    const bh = h * 0.3 * v;
    ctx.save();
    if (i === 3) { ctx.shadowColor = withAlpha(P.brand, 0.5); ctx.shadowBlur = bw; }
    roundRect(ctx, bx + i * bw * 1.6, base - bh, bw, bh, bw * 0.34);
    ctx.fillStyle = withAlpha(i === 3 ? P.brandBright : P.brand, i === 3 ? 0.8 : 0.34);
    ctx.fill();
    ctx.restore();
  });
}

/** wave — broadcast: concentric signal rings from a mast. */
function wave(ctx, w, h, P) {
  wash(ctx, w, h, P, P.brand, 0.13);
  const cx = w * 0.5, cy = h * 0.62;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * i * 0.16, -Math.PI * 0.86, -Math.PI * 0.14);
    ctx.strokeStyle = withAlpha(P.brandBright, 0.5 / i);
    ctx.lineWidth = Math.max(2, h * 0.012);
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.save();
  ctx.shadowColor = withAlpha(P.brand, 0.5);
  ctx.shadowBlur = h * 0.08;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h * 0.16);
  ctx.lineTo(cx + w * 0.035, cy + h * 0.06);
  ctx.lineTo(cx + w * 0.012, cy + h * 0.06);
  ctx.lineTo(cx + w * 0.012, cy + h * 0.14);
  ctx.lineTo(cx - w * 0.012, cy + h * 0.14);
  ctx.lineTo(cx - w * 0.012, cy + h * 0.06);
  ctx.lineTo(cx - w * 0.035, cy + h * 0.06);
  ctx.closePath();
  ctx.fillStyle = withAlpha(P.brand, 0.6);
  ctx.fill();
  ctx.restore();
  dot(ctx, cx, cy - h * 0.19, h * 0.026, withAlpha(P.brandBright, 0.95));
}

/** ticket — vouchers: a perforated coupon. */
function ticket(ctx, w, h, P) {
  wash(ctx, w, h, P, P.brand, 0.12);
  const tw = w * 0.5, th = tw * 0.4;
  const x = w * 0.5 - tw / 2, y = h * 0.5 - th / 2;
  panel(ctx, x, y, tw, th, P, th * 0.14);
  // notches + perforation
  const px = x + tw * 0.66;
  dot(ctx, px, y, th * 0.1, P.dark ? '#04060D' : '#F8FAFD');
  dot(ctx, px, y + th, th * 0.1, P.dark ? '#04060D' : '#F8FAFD');
  ctx.beginPath();
  ctx.moveTo(px, y + th * 0.16);
  ctx.lineTo(px, y + th * 0.84);
  ctx.strokeStyle = withAlpha(P.brand, 0.45);
  ctx.lineWidth = Math.max(1.5, th * 0.02);
  ctx.setLineDash([th * 0.07, th * 0.055]);
  ctx.stroke();
  ctx.setLineDash([]);
  bars(ctx, x + tw * 0.1, y + th * 0.32, tw * 0.4, 2, th * 0.24, th * 0.1, P, 0.25);
  // The discount mark, centred in the right-hand stub at a size that survives
  // the scrim.
  const stubMid = (px + (x + tw)) / 2;
  const pctSize = fitText(ctx, '%', (x + tw - px) * 0.72, {
    maxSize: th * 0.58, minSize: 8, weight: 800, font: P.font,
  });
  label(ctx, '%', stubMid, y + th * 0.52, {
    size: pctSize, weight: 800, color: withAlpha(P.brandBright, 0.9), font: P.font,
  });
}

// ─── registry ────────────────────────────────────────────────────────────────
// The single place to see what artwork exists. CanvasArt renders any of these by
// name; RouteBackdrop maps routes onto the backdrop family.
const KINDS = {
  // foreground
  mesh, pairing, flow, scale, hosting,
  // backdrop
  terminal, tiles, ledger, gears, bubbles, crowd, sim, dice, scroll, lock, gauges, wave, ticket,
};

module.exports = { KINDS, KINDS_NAMES: Object.keys(KINDS), withAlpha, fitText, roundRect, dot, label };
