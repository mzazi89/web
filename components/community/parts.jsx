'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/community/parts.jsx — the small pieces the community screen shares.
//
// Everything here is presentational: an initials avatar on a colour the API
// derived from the account id, the delivery ticks, the date rules and the emoji
// tray. Keeping them in one place is what makes a DM and a group bubble look like
// they came from the same app.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Icons } from '@/components/ui';

/**
 * Someone's face, or their initials when they have not set one.
 *
 * `photo` is the URL from the API; when the image fails to load (a photo removed
 * between the list being rendered and the request landing) the initials layer
 * underneath simply shows through, so an avatar never becomes a broken-image box.
 */
export function Avatar({ avatar, photo = null, label, size = 46, online = false, square = false, ring = false }) {
  const ink = avatar?.ink || 'var(--brand)';
  const tint = avatar?.tint || 'var(--brand-tint)';
  const text = avatar?.initials || (label ? label.slice(0, 2).toUpperCase() : '?');
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(photo) && !failed;

  return (
    <div style={{ position: 'relative', flex: `0 0 ${size}px`, width: size, height: size }}>
      <div
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          borderRadius: square ? Math.round(size * 0.3) : '50%',
          background: tint,
          color: ink,
          display: 'grid',
          placeItems: 'center',
          fontSize: Math.max(11, Math.round(size * 0.36)),
          fontWeight: 800,
          letterSpacing: '0.01em',
          boxShadow: ring ? `inset 0 0 0 1.5px ${ink}` : 'none',
          userSelect: 'none',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {text}
        {showPhoto && (
          <img
            src={photo}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 'inherit',
            }}
          />
        )}
      </div>
      {online && (
        <span
          title="Online"
          style={{
            position: 'absolute',
            right: -1,
            bottom: -1,
            width: Math.max(10, Math.round(size * 0.24)),
            height: Math.max(10, Math.round(size * 0.24)),
            borderRadius: '50%',
            background: 'var(--good)',
            border: '2px solid var(--bg)',
          }}
        />
      )}
    </div>
  );
}

/** 12px double-tick artwork: grey = delivered, blue = read. */
export function Ticks({ status = 'sent', size = 15 }) {
  const read = status === 'read';
  const color = read ? 'var(--blue)' : 'currentColor';
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 22 12" aria-label={read ? 'Read' : 'Sent'} role="img">
      <path d="M1.6 6.6 4.6 9.4 10.4 2.9" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      {read !== null && (
        <path d="M7.4 6.6 10.4 9.4 16.2 2.9" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', height: 12 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--dim)',
            animation: `comBounce 1.15s ${i * 0.14}s infinite ease-in-out`,
          }}
        />
      ))}
    </span>
  );
}

// ─── time ────────────────────────────────────────────────────────────────────

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

export const clock = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const dayKey = (ts) => startOfDay(ts);

export function dayLabel(ts) {
  const today = startOfDay(Date.now());
  const day = startOfDay(ts);
  const diff = Math.round((today - day) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return new Date(ts).toLocaleDateString([], { weekday: 'long' });
  return new Date(ts).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}

/** The timestamp a chat list row shows: time today, "Yesterday", else a date. */
export function listTime(ts) {
  if (!ts) return '';
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / 86_400_000);
  if (diff === 0) return clock(ts);
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return new Date(ts).toLocaleDateString([], { weekday: 'short' });
  return new Date(ts).toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

export function lastSeenLabel(online, ts) {
  if (online) return 'online';
  if (!ts) return 'offline';
  const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60_000);
  if (mins < 2) return 'last seen just now';
  if (mins < 60) return `last seen ${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `last seen ${hours}h ago`;
  return `last seen ${new Date(ts).toLocaleDateString([], { day: '2-digit', month: 'short' })}`;
}

// ─── composer extras ─────────────────────────────────────────────────────────

export const EMOJIS = [
  '😀', '😂', '🥲', '😍', '😎', '🤔', '😴', '😭',
  '👍', '🙏', '🙌', '👏', '💪', '🤝', '✌️', '👀',
  '❤️', '🔥', '✨', '🎉', '💯', '✅', '⚡', '🚀',
];

export function EmojiTray({ onPick, onClose }) {
  return (
    <div
      role="dialog"
      aria-label="Emoji"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        marginBottom: 8,
        zIndex: 20,
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: 10,
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 2,
        backdropFilter: 'blur(var(--glass-blur))',
      }}
    >
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onPick(e)}
          aria-label={e}
          style={{ fontSize: 18, lineHeight: 1, padding: '4px 2px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8 }}
        >
          {e}
        </button>
      ))}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close emoji picker"
        style={{ gridColumn: '1 / -1', marginTop: 4, fontSize: 11, color: 'var(--dim)', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        Close
      </button>
    </div>
  );
}

export function IconButton({ label, onClick, children, active = false, size = 34 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        border: '1px solid',
        borderColor: active ? 'var(--brand-a35)' : 'transparent',
        background: active ? 'var(--brand-a12)' : 'transparent',
        color: active ? 'var(--brand)' : 'var(--muted)',
        cursor: 'pointer',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-a08)'; e.currentTarget.style.color = 'var(--brand)'; }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active ? 'var(--brand-a12)' : 'transparent';
        e.currentTarget.style.color = active ? 'var(--brand)' : 'var(--muted)';
      }}
    >
      {children}
    </button>
  );
}

/** Group glyph used where a group has no custom art. */
export const GroupGlyph = Icons.Users;

// ─── glyphs the shared icon set does not carry ───────────────────────────────

export function MicIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8.5h2.6l1.3-2h8.2l1.3 2H20V19H4V8.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function StopIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" fill="currentColor" />
    </svg>
  );
}

/** 0:07 — voice-note lengths are short, so mm:ss is enough. */
export function fmtDuration(ms) {
  const total = Math.max(0, Math.round(Number(ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * A deterministic bar pattern for a voice note.
 *
 * Real waveforms need the decoded samples, which means downloading the whole
 * recording before it can be drawn. The bars are decoration: they show where you
 * are in the clip, and deriving their heights from the message id means the same
 * note always looks the same instead of reshuffling on every poll.
 */
export function waveform(seed, count = 27) {
  let x = Math.abs(Number(seed) || 1) % 9973 || 7;
  return Array.from({ length: count }, () => {
    x = (x * 16807) % 2147483647;
    return 0.28 + ((x % 100) / 100) * 0.72;
  });
}
