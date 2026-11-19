'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/cars/CarsBrowser.jsx — the showroom shelf.
//
// The page is server-rendered with every published vehicle in the first paint
// (good for a shared link and for a crawler). Filtering then happens in the
// browser against that same array: with a dealer's stock of a few dozen vehicles
// a round trip per chip would be slower, and two sources of truth would drift.
//
// Typography is deliberately classic — serif titles, letterspaced caps, a gold
// rule — because this is a dealership, not a dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/ui';

import { GOLD, GOLD_SOFT, km, priceLabel } from '@/lib/carsFormat';

const SORTS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'price_asc', label: 'Price · low to high' },
  { id: 'price_desc', label: 'Price · high to low' },
];

function Chip({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '7px 14px',
        borderRadius: 999,
        border: `1px solid ${active ? GOLD : 'var(--line)'}`,
        background: active ? GOLD_SOFT : 'transparent',
        color: active ? GOLD : 'var(--muted)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
      {count ? <span style={{ opacity: 0.65 }}> {count}</span> : null}
    </button>
  );
}

export default function CarsBrowser({ cars = [], bodies = [] }) {
  const [body, setBody] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('newest');

  const counts = useMemo(() => {
    const map = {};
    for (const c of cars) if (c.body) map[c.body] = (map[c.body] || 0) + 1;
    return map;
  }, [cars]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = cars.filter((c) => {
      if (body !== 'all' && c.body !== body) return false;
      if (!term) return true;
      return `${c.title} ${c.model || ''} ${c.body || ''} ${c.condition || ''}`.toLowerCase().includes(term);
    });

    if (sort === 'price_asc') list = [...list].sort((a, b) => (a.price_kes ?? Infinity) - (b.price_kes ?? Infinity));
    if (sort === 'price_desc') list = [...list].sort((a, b) => (b.price_kes ?? -1) - (a.price_kes ?? -1));
    return list;
  }, [cars, body, q, sort]);

  return (
    <div>
      {/* filters */}
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
          padding: '14px 0 18px', borderBottom: '1px solid var(--line)',
        }}
      >
        <Chip active={body === 'all'} onClick={() => setBody('all')} count={cars.length}>All vehicles</Chip>
        {bodies.map((b) => (
          <Chip key={b.body} active={body === b.body} onClick={() => setBody(b.body)} count={counts[b.body]}>
            {b.body}
          </Chip>
        ))}

        <div style={{ flex: 1 }} />

        <label
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
            border: '1px solid var(--line)', borderRadius: 999, minWidth: 200,
            background: 'var(--surface)',
          }}
        >
          <Icons.Search size={14} style={{ color: 'var(--dim)' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search model or body"
            aria-label="Search vehicles"
            style={{
              border: 'none', background: 'transparent', padding: '9px 0', width: '100%',
              fontSize: 12.5, color: 'var(--ink)', outline: 'none',
            }}
          />
        </label>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort vehicles"
          style={{
            padding: '9px 12px', borderRadius: 999, background: 'var(--surface)',
            border: '1px solid var(--line)', color: 'var(--ink)', fontSize: 12,
          }}
        >
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {/* grid */}
      {shown.length === 0 ? (
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <div
            style={{
              width: 56, height: 56, margin: '0 auto 14px', borderRadius: '50%',
              border: `1px solid ${GOLD}`, color: GOLD, display: 'grid', placeItems: 'center',
            }}
          >
            <Icons.Car size={24} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
            {cars.length ? 'Nothing matches that' : 'The showroom is being updated'}
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 4 }}>
            {cars.length
              ? 'Try another body type, or clear the search.'
              : 'Vehicles appear here the moment they are listed. Call the showroom to ask what has landed.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid', gap: 18, padding: '22px 0 8px',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {shown.map((car) => (
            <Link
              key={car.id}
              href={`/cars/${car.slug}`}
              style={{
                display: 'flex', flexDirection: 'column', textDecoration: 'none',
                background: 'var(--surface)', border: '1px solid var(--line)',
                borderRadius: 'var(--r-lg)', overflow: 'hidden',
                transition: 'transform .18s ease, border-color .18s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--line)'; }}
            >
              <div style={{ position: 'relative', aspectRatio: '4 / 3', background: 'var(--bg-2)' }}>
                {car.cover_id ? (
                  <img
                    src={`/api/cars/image/${car.cover_id}`}
                    alt={car.title}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--dim)' }}>
                    <Icons.Car size={34} />
                  </div>
                )}

                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                  {car.status === 'sold' && (
                    <span style={{ background: 'rgba(10,10,12,0.86)', color: '#F5F1E8', border: '1px solid rgba(245,241,232,0.35)', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em' }}>
                      SOLD
                    </span>
                  )}
                  {car.featured && car.status !== 'sold' && (
                    <span style={{ background: GOLD, color: '#141207', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em' }}>
                      FEATURED
                    </span>
                  )}
                </div>
              </div>

              <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <p style={{
                  fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 17, lineHeight: 1.25,
                  color: 'var(--ink)', letterSpacing: '-0.01em',
                }}>
                  {car.title}
                </p>

                <p style={{ fontSize: 11.5, color: 'var(--dim)', letterSpacing: '0.02em' }}>
                  {[car.year, car.body, car.fuel, km(car.mileage_km)].filter(Boolean).join(' · ')}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: GOLD, letterSpacing: '0.01em' }}>
                    {priceLabel(car.price_kes, car.currency)}
                  </span>
                  {car.negotiable && car.price_kes != null && (
                    <span style={{ fontSize: 10.5, color: 'var(--dim)' }}>negotiable</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
