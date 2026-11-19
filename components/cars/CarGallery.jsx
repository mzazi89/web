'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/cars/CarGallery.jsx — the vehicle photos.
//
// One large frame, a row of thumbnails, arrow keys, and a full-screen view for
// the detail shot people actually want on a phone. The images are already
// immutable URLs, so the browser caches them and switching is instant.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { Icons } from '@/components/ui';

const GOLD = '#C9A227';

export default function CarGallery({ images = [], title = '' }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);

  const count = images.length;
  const go = (next) => setIndex((next + count) % Math.max(1, count));

  useEffect(() => {
    if (!count) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setZoom(false);
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count]);

  if (!count) {
    return (
      <div
        style={{
          aspectRatio: '4 / 3', display: 'grid', placeItems: 'center',
          border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
          background: 'var(--surface)', color: 'var(--dim)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Icons.Car size={38} />
          <p style={{ fontSize: 12, marginTop: 8 }}>Photos coming soon</p>
        </div>
      </div>
    );
  }

  const current = images[index];

  return (
    <div>
      <div
        style={{
          position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden',
          border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', background: 'var(--bg-2)',
        }}
      >
        <img
          src={`/api/cars/image/${current.id}`}
          alt={`${title} — photo ${index + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
          onClick={() => setZoom(true)}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous photo"
              style={arrowStyle('left')}
            >
              <Icons.ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next photo"
              style={arrowStyle('right')}
            >
              <Icons.ChevronRight size={20} />
            </button>
            <span
              style={{
                position: 'absolute', right: 12, bottom: 12, padding: '3px 9px',
                borderRadius: 999, background: 'rgba(10,10,12,0.72)', color: '#F5F1E8',
                fontSize: 11, letterSpacing: '0.06em',
              }}
            >
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === index}
              style={{
                flex: '0 0 84px', width: 84, height: 64, padding: 0, overflow: 'hidden',
                borderRadius: 8, cursor: 'pointer', background: 'var(--bg-2)',
                border: `1px solid ${i === index ? GOLD : 'var(--line)'}`,
                opacity: i === index ? 1 : 0.72,
              }}
            >
              <img
                src={`/api/cars/image/${img.id}`}
                alt=""
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photo ${index + 1}`}
          onClick={() => setZoom(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(6,6,8,0.94)',
            display: 'grid', placeItems: 'center', padding: 16,
          }}
        >
          <img
            src={`/api/cars/image/${current.id}`}
            alt={`${title} — photo ${index + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '96vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 10 }}
          />
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Close"
            style={{
              position: 'absolute', top: 14, right: 14, width: 38, height: 38, borderRadius: '50%',
              border: 'none', background: 'rgba(255,255,255,0.14)', color: '#fff',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}
          >
            <Icons.X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

const arrowStyle = (side) => ({
  position: 'absolute',
  top: '50%',
  [side]: 10,
  transform: 'translateY(-50%)',
  width: 38,
  height: 38,
  borderRadius: '50%',
  border: '1px solid rgba(245,241,232,0.25)',
  background: 'rgba(10,10,12,0.6)',
  color: '#F5F1E8',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
});
