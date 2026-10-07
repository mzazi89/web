// Shared brand artwork for generated images (icons, apple icon, OG card).
// Pure JSX — rendered by next/og (Satori) into PNGs at request time.

// The MZAZI bolt-in-frame mark, in 48-space coordinates (mirrors components/Logo.js)
export function BoltMark({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="2.5" y="2.5" width="43" height="43" rx="3" fill="#04060D" stroke="#60A5FA" strokeWidth="2.2" />
      <path d="M27.2 8.5 L15.5 26.5 L22.4 26.5 L20.4 39.5 L32.8 20.8 L25.6 20.8 Z" fill="#60A5FA" />
      <circle cx="8" cy="8" r="1.4" fill="#38BDF8" />
      <circle cx="40" cy="40" r="1.4" fill="#38BDF8" />
    </svg>
  );
}

// 1200×630 social card — used by opengraph-image and twitter-image
export function BrandCard() {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: '#04060D',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '84px 88px',
        position: 'relative',
        fontFamily: 'Space Grotesk',
      }}
    >
      {/* hairline frame */}
      <div
        style={{
          position: 'absolute',
          inset: 28,
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 4,
        }}
      />
      {/* corner ticks */}
      <div style={{ position: 'absolute', left: 52, top: 52, width: 26, height: 4, background: '#60A5FA' }} />
      <div style={{ position: 'absolute', right: 52, bottom: 52, width: 26, height: 4, background: '#38BDF8' }} />

      {/* top: wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <BoltMark size={84} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 74, fontWeight: 700, letterSpacing: -2 }}>MZAZI TECH</span>
          <span style={{ fontSize: 74, fontWeight: 700, color: '#60A5FA' }}>.</span>
        </div>
      </div>

      {/* middle: tagline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820 }}>
        <div style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.3, color: '#C9D3E6' }}>
          Pterodactyl panels · WhatsApp automation
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.3, color: '#C9D3E6' }}>
          Developer APIs — one wallet, one account.
        </div>
      </div>

      {/* bottom: meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 20, letterSpacing: 5, color: '#A9B6CE', textTransform: 'uppercase' }}>
          Nairobi — Kenya
        </span>
        <span style={{ fontSize: 22, letterSpacing: 2, color: '#60A5FA' }}>mzazi.shop</span>
      </div>
    </div>
  );
}
