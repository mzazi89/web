// MZAZI TECH — brand mark.
//
// A bolt inside a rounded frame, drawn with design tokens so it themes itself
// in light and dark mode. The API is unchanged from v1 (`size`, `withText`) so
// every existing call site keeps working.

export default function Logo({ size = 34, withText = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        style={{ display: 'block', flexShrink: 0 }}
        role="img"
        aria-label="MZAZI TECH"
      >
        <defs>
          <linearGradient id="mzazi-bolt" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--blue)" />
          </linearGradient>
        </defs>

        {/* Rounded frame with a brand gradient border */}
        <rect
          x="2.5" y="2.5" width="43" height="43" rx="11"
          fill="var(--surface)"
          stroke="url(#mzazi-bolt)"
          strokeWidth="2.2"
        />
        {/* Bolt */}
        <path
          d="M27.2 8.5 L15.5 26.5 L22.4 26.5 L20.4 39.5 L32.8 20.8 L25.6 20.8 Z"
          fill="url(#mzazi-bolt)"
        />
        {/* Corner accents */}
        <circle cx="8.5" cy="8.5" r="1.5" fill="var(--blue)" />
        <circle cx="39.5" cy="39.5" r="1.5" fill="var(--brand)" />
      </svg>

      {withText && (
        <span
          className="display"
          style={{
            fontSize: size > 40 ? 19 : 16,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
          }}
        >
          MZAZI<span style={{ color: 'var(--brand)' }}>.</span>TECH
        </span>
      )}
    </span>
  );
}
