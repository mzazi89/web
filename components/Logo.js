// MZAZI TECH — brand mark.
//
// A geometric "M" monogram on a gradient app-icon tile, with a small live node
// at the top right (the "automation is running" cue). Drawn as vector so it
// stays sharp at 24px in the drawer and at 2x on retina.
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
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        style={{ display: 'block', flexShrink: 0, filter: 'drop-shadow(0 4px 12px rgba(37, 99, 235, .35))' }}
        role="img"
        aria-label="MZAZI TECH"
      >
        <defs>
          <linearGradient id="mz-tile" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="55%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
          <linearGradient id="mz-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.30" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Tile */}
        <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#mz-tile)" />
        {/* Top sheen — gives the tile depth without a second colour */}
        <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#mz-sheen)" />
        {/* Hairline rim */}
        <rect x="2.6" y="2.6" width="42.8" height="42.8" rx="12.4" fill="none"
          stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1.2" />

        {/* M monogram */}
        <path
          d="M14 33.5V16.5l10 11 10-11v17"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Live node */}
        <circle cx="37.5" cy="12.2" r="2.6" fill="#67E8F9" stroke="#0B1220" strokeWidth="1.6" />
      </svg>

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
              fontSize: '0.82em',
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
