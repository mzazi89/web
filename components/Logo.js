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
          <span className="mz-word" style={{ fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
            MZAZI
          </span>
          <span className="mz-tech" style={{ fontWeight: 600, letterSpacing: '0.16em', fontSize: '0.78em' }}>
            TECH
          </span>

          {/* The tree. Small, drawn rather than emoji so it can blink in the
              brand's own colours, and aria-hidden because it repeats the word
              next to it. */}
          <svg
            className="mz-tree"
            viewBox="0 0 24 32"
            width={Math.round(wordSize * 1.05)}
            height={Math.round(wordSize * 1.4)}
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient id="mzTree" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1fae6b" />
                <stop offset="100%" stopColor="#0b6b41" />
              </linearGradient>
              <linearGradient id="mzStar" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff3b0" />
                <stop offset="100%" stopColor="#f7c948" />
              </linearGradient>
            </defs>

            <path
              d="M12 3.2 16.6 12h-2.7l3.9 6.4h-2.9L19 26H5l4.1-7.6H6.2l3.9-6.4H7.4z"
              fill="url(#mzTree)"
            />
            <rect x="10.7" y="25.6" width="2.6" height="3" rx="0.7" fill="#6b4226" />
            <path className="mz-star" d="M12 0.6l1.1 2.2 2.4.3-1.8 1.7.5 2.4L12 6l-2.2 1.2.5-2.4L8.5 3.1l2.4-.3z" fill="url(#mzStar)" />

            <circle className="mz-bulb b1" cx="12" cy="9.6" r="1.05" fill="#ffd166" />
            <circle className="mz-bulb b2" cx="9.4" cy="15.4" r="1.05" fill="#ff6b6b" />
            <circle className="mz-bulb b3" cx="14.6" cy="15.6" r="1.05" fill="#eaf6ff" />
            <circle className="mz-bulb b4" cx="12" cy="19.4" r="1.05" fill="#ffd166" />
            <circle className="mz-bulb b5" cx="8.6" cy="23.2" r="1.05" fill="#ff6b6b" />
            <circle className="mz-bulb b6" cx="15.4" cy="23.2" r="1.05" fill="#eaf6ff" />
          </svg>
        </span>
      )}
    </span>
  );
}
