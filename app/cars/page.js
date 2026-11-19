import Link from 'next/link';
import { AppBackground, Icons } from '@/components/ui';
import { listCars, bodiesInStock, ensureCars, dealerContact, DEALER } from '@/lib/cars';
import CarsBrowser from '@/components/cars/CarsBrowser';
import { GOLD } from '@/lib/carsFormat';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'FOTON vehicles — Golden Lion Motors Co. | MZAZI TECH',
  description:
    'Pickups, vans, light trucks and buses from FOTON, listed by Golden Lion Motors Co. Specs, photos and prices, updated as stock lands.',
};

// ─────────────────────────────────────────────────────────────────────────────
// /cars — the showroom.
//
// Server-rendered on purpose: a dealer page gets shared as a link and indexed by
// search engines, and both want the vehicles in the HTML rather than arriving
// after a spinner. Filtering is then client-side over that same list.
//
// Classic treatment: serif titles, gold rules, a dark plate for the marque. The
// rest of the site is a tech store; a car showroom should not look like a
// dashboard with wheels.
// ─────────────────────────────────────────────────────────────────────────────
export default async function CarsPage() {
  let cars = [];
  let bodies = [];
  let failed = false;

  try {
    await ensureCars();
    [cars, bodies] = await Promise.all([listCars({ limit: 120 }), bodiesInStock()]);
  } catch (e) {
    console.error('[cars]', e?.message || e);
    failed = true;
  }

  const inStock = cars.filter((c) => c.status === 'published').length;
  const contact = failed ? {} : await dealerContact();

  return (
    <AppBackground orbs>
      {/* ── masthead ─────────────────────────────────────────────────────── */}
      <section style={{ borderBottom: '1px solid var(--line)', background: 'linear-gradient(180deg, rgba(201,162,39,0.06), transparent 70%)' }}>
        <div className="container-site" style={{ paddingTop: 34, paddingBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ width: 26, height: 1, background: GOLD }} />
            <p style={{ fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>
              {DEALER.company}
            </p>
            <span style={{ fontSize: 10.5, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--dim)' }}>
              Authorised {DEALER.brand}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 24, marginTop: 14 }}>
            <div style={{ minWidth: 260, flex: 1 }}>
              <h1
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 'clamp(2.2rem, 6vw, 3.6rem)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                  fontWeight: 400,
                }}
              >
                {DEALER.brand} <span style={{ color: GOLD }}>Showroom</span>
              </h1>
              <p style={{ marginTop: 10, maxWidth: 520, fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>
                {DEALER.tagline} Pickups, vans, light trucks and buses — each listing carries the
                specs that matter on a site, not just a year and a mileage.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 26, paddingBottom: 6 }}>
              <div>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: 'var(--ink)' }}>{inStock}</p>
                <p style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--dim)' }}>In stock</p>
              </div>
              <div>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: 'var(--ink)' }}>{bodies.length || '—'}</p>
                <p style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--dim)' }}>Body types</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── shelf ────────────────────────────────────────────────────────── */}
      <section className="container-site" style={{ paddingTop: 6, paddingBottom: 56 }}>
        {failed ? (
          <div style={{ padding: '56px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>The showroom could not be loaded</p>
            <p style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 4 }}>
              Check your connection and <Link href="/cars" style={{ color: GOLD }}>try again</Link>.
            </p>
          </div>
        ) : (
          <>
            <CarsBrowser cars={cars} bodies={bodies} />

            {/* dealer strip */}
            <div
              style={{
                marginTop: 40, padding: '22px 24px', borderRadius: 'var(--r-lg)',
                border: '1px solid var(--line)', background: 'var(--surface)',
                display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div>
                <p style={{ fontSize: 10.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>
                  Buying, financing, servicing
                </p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: 'var(--ink)', marginTop: 4 }}>
                  Talk to {DEALER.company}
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 2 }}>
                  {[contact.address, contact.hours, 'Trade-ins considered · Delivery countrywide'].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                      borderRadius: 999, border: `1px solid ${GOLD}`, color: GOLD,
                      fontSize: 12.5, fontWeight: 700, textDecoration: 'none',
                    }}
                  >
                    <Icons.Phone size={14} /> {contact.phone}
                  </a>
                )}
                {contact.whatsapp && (
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                      borderRadius: 999, border: '1px solid var(--line)', color: 'var(--ink)',
                      fontSize: 12.5, fontWeight: 700, textDecoration: 'none',
                    }}
                  >
                    <Icons.Chat size={14} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </AppBackground>
  );
}
