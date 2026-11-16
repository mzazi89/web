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
          {/* A holly sprig leads the mark — two leaves and a berry, small
              enough to read as decoration rather than a second logo. */}
          <svg className="mz-sprig" viewBox="0 0 20 24" width={Math.round(wordSize * 0.62)} height={Math.round(wordSize * 0.74)} aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="mzLeafA" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#0b6b41" />
                <stop offset="100%" stopColor="#2fc47e" />
              </linearGradient>
            </defs>
            <path className="mz-leaf l1" d="M9 17C4.5 15.5 2 11.5 3.2 6.5 7.8 8 10 12 9 17Z" fill="url(#mzLeafA)" />
            <path className="mz-leaf l2" d="M11 15C15.5 13 17.6 9 16.2 4 11.8 6.2 10.2 10.2 11 15Z" fill="url(#mzLeafA)" />
            <circle className="mz-berry" cx="10.2" cy="18.6" r="2.1" fill="#e23b45" />
            <circle className="mz-berry b" cx="6.4" cy="20.4" r="1.7" fill="#e23b45" />
          </svg>

          <span className="mz-mark">
            <span className="mz-word" style={{ fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
              MZAZI
            </span>
            <span className="mz-tech" style={{ fontWeight: 600, letterSpacing: '0.16em', fontSize: '0.78em' }}>
              TECH
            </span>

            {/* The garland: leaves under the wordmark, so the letters sit on
                greenery instead of floating. Fixed positions, no layout cost. */}
            <svg className="mz-garland" viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path d="M0 5.2C14 3.4 26 7 40 5.2S66 3 80 5.2s26 2.4 40 .4" fill="none" stroke="#1fae6b" strokeOpacity=".55" strokeWidth="1.1" />
              <g fill="url(#mzLeafA)">
                <ellipse className="mz-gl g1" cx="9" cy="4.4" rx="2.6" ry="1.5" transform="rotate(-18 9 4.4)" />
                <ellipse className="mz-gl g2" cx="30" cy="6" rx="2.6" ry="1.5" transform="rotate(16 30 6)" />
                <ellipse className="mz-gl g3" cx="52" cy="4.2" rx="2.6" ry="1.5" transform="rotate(-14 52 4.2)" />
                <ellipse className="mz-gl g4" cx="74" cy="6" rx="2.6" ry="1.5" transform="rotate(14 74 6)" />
                <ellipse className="mz-gl g5" cx="96" cy="4.4" rx="2.6" ry="1.5" transform="rotate(-16 96 4.4)" />
                <ellipse className="mz-gl g6" cx="113" cy="6" rx="2.4" ry="1.4" transform="rotate(12 113 6)" />
              </g>
            </svg>
          </span>

          {/* The grove: one full tree, two saplings behind it. Each keeps its
              own blink offsets so the cluster never pulses as a block. */}
          <svg className="mz-tree sapling" viewBox="0 0 18 26" width={Math.round(wordSize * 0.56)} height={Math.round(wordSize * 0.8)} aria-hidden="true" focusable="false">
            <path d="M9 2.6 12.6 11h-2l3 5.4h-2.2L14 22H4l2.6-5.6H4.4l3-5.4h-2z" fill="#0e7d4c" />
            <circle className="mz-bulb s1" cx="9" cy="9" r=".85" fill="#ffd166" />
            <circle className="mz-bulb s2" cx="6.6" cy="14.6" r=".85" fill="#ff6b6b" />
          </svg>

          <svg className="mz-tree" viewBox="0 0 24 32" width={Math.round(wordSize * 1.05)} height={Math.round(wordSize * 1.4)} aria-hidden="true" focusable="false">
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
            <path d="M12 3.2 16.6 12h-2.7l3.9 6.4h-2.9L19 26H5l4.1-7.6H6.2l3.9-6.4H7.4z" fill="url(#mzTree)" />
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
