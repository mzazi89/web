'use client';

// MZAZI TECH — global animated background.
//
// Mounted once in the root layout, so all ~30 routes inherit it without a single
// page file knowing about it. It paints ABOVE RouteBackdrop (the layout mounts
// this second) for a reason: the wallpaper supplies texture and photographic
// detail, and this layer supplies the brand colour and the motion. Reversed, the
// movement was buried under the wallpaper scrim and the page looked static.
//
// Layering, back to front:
//   1. starfield      — two tiled dot layers, drifting one tile per loop
//   2. aurora band    — one large blurred conic sweep, rotating very slowly
//   3. three glows    — brand / blue / pink, breathing on staggered cycles
//   4. grid           — faint, masked so it fades before the content
//   5. vignette       — protects the navbar and footer edges
//
// Every animated property is `transform` or `opacity`, so each layer is
// rasterised once and then moved by the compositor. Nothing here animates a
// filter: animating `blur()` would re-blur a full-screen layer every frame,
// which is what makes this kind of background expensive on a phone. The whole
// set is disabled under `prefers-reduced-motion` (see globals.css §13).

export default function TechBackground() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      {/* 1 ── Starfield. Slowest thing on the page, and the cheapest: it is two
             background-images panning, not an element per dot. */}
      <div
        className="starfield anim-starfield"
        style={{ position: 'absolute', inset: '-10%', opacity: 0.75 }}
      />

      {/* 2 ── Aurora band. The single strongest "this page is alive" cue: a
             blurred conic sweep rotating once every two minutes. Blurred hard
             enough that it reads as light, never as a shape. */}
      <div
        className="anim-aurora-spin"
        style={{
          position: 'absolute',
          top: '-45%', left: '-30%',
          width: '160%', height: '160%',
          borderRadius: '50%',
          filter: 'blur(120px)',
          opacity: 0.12,
          background:
            'conic-gradient(from 0deg, transparent 0%, var(--brand) 16%, transparent 36%, var(--blue) 56%, transparent 76%, var(--pink) 90%, transparent 100%)',
        }}
      />

      {/* 3 ── Brand glow, top left. */}
      <div
        className="anim-aurora-a"
        style={{
          position: 'absolute', top: '-24%', left: '-14%',
          width: '60vw', height: '60vw', minWidth: 380, minHeight: 380,
          borderRadius: '50%', filter: 'blur(100px)',
          background: 'radial-gradient(circle at 40% 40%, var(--brand) 0%, transparent 66%)',
        }}
      />

      {/* ── Blue glow, bottom right. */}
      <div
        className="anim-aurora-b"
        style={{
          position: 'absolute', bottom: '-28%', right: '-16%',
          width: '62vw', height: '62vw', minWidth: 400, minHeight: 400,
          borderRadius: '50%', filter: 'blur(110px)',
          background: 'radial-gradient(circle at 60% 60%, var(--blue) 0%, transparent 66%)',
        }}
      />

      {/* ── Pink accent, so the middle does not feel empty on wide screens. */}
      <div
        className="anim-aurora-c"
        style={{
          position: 'absolute', top: '34%', right: '14%',
          width: '30vw', height: '30vw', minWidth: 220, minHeight: 220,
          borderRadius: '50%', filter: 'blur(90px)',
          background: 'radial-gradient(circle at 50% 50%, var(--pink) 0%, transparent 68%)',
        }}
      />

      {/* 4 ── Grid, masked so it dissolves before it reaches the content. */}
      <div
        className="grid-bg"
        style={{
          position: 'absolute', inset: 0,
          maskImage: 'radial-gradient(75% 60% at 50% 0%, #000 0%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(75% 60% at 50% 0%, #000 0%, transparent 78%)',
          opacity: 0.45,
        }}
      />

      {/* 5 ── Vignette. Keeps the navbar and the footer sitting on a calm field
             no matter how bright the wallpaper is behind them. */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background:
            'radial-gradient(125% 95% at 50% 42%, transparent 44%, var(--bg) 100%)',
          opacity: 0.72,
        }}
      />
    </div>
  );
}
