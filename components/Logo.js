// MZAZI TECH — brand mark.
//
// The emblem is artwork now, not geometry: the chrome M·T monogram inside the
// crown ring, shipped as public/brand/logo.png and clipped to a rounded tile so
// it matches the app icon it becomes on a home screen.
//
// The lockup is deliberately two-weight: MZAZI in heavy ink, TECH in tracked
// brand blue. That reads as a wordmark rather than two words in a row.
//
// API is unchanged (`size`, `withText`) so every call site keeps working.

export default function Logo({ size = 34, withText = false }) {
  const wordSize = Math.round(size * 0.62);
  const gap = Math.max(8, Math.round(size * 0.28));

  return (
    <span className="mz-brand" style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      {/* WebP first (14 KB vs 72 KB), PNG fallback. A 256px source covers the
          44px slot at 3x, so the mark stays sharp without shipping a 627px file. */}
      <picture style={{ display: 'inline-flex', flexShrink: 0 }}>
        <source srcSet="/brand/logo.webp" type="image/webp" />
        <img
          src="/brand/logo.png"
          width={size}
          height={size}
          alt="MZAZI TECH"
          decoding="async"
          style={{
            display: 'block',
            flexShrink: 0,
            objectFit: 'cover',
            borderRadius: Math.round(size * 0.26),
            boxShadow: '0 0 0 1px rgba(96, 165, 250, 0.18), 0 6px 16px rgba(37, 99, 235, 0.32)',
          }}
        />
      </picture>

      {withText && (
        <span
          className="display mz-wordmark"
          // --mz-word is the intended size; the stylesheet caps it with vw so the
          // lockup never overflows a 360px phone.
          style={{ '--mz-word': `${wordSize}px`, display: 'inline-flex', alignItems: 'baseline', gap: '0.22em', lineHeight: 1, whiteSpace: 'nowrap' }}
        >
          <span style={{ fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
            MZAZI
          </span>
          <span
            style={{
              fontWeight: 600,
              letterSpacing: '0.16em',
              fontSize: '0.78em',
              background: 'linear-gradient(90deg, #60A5FA 0%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            TECH
          </span>
        </span>
      )}
    </span>
  );
}
