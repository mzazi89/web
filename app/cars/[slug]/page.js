import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppBackground, Icons } from '@/components/ui';
import CarGallery from '@/components/cars/CarGallery';
import { priceLabel, km, GOLD } from '@/lib/carsFormat';
import {
  carBySlug, listCars, spec, dealerContact, bumpViews, DEALER,
} from '@/lib/cars';

export const dynamic = 'force-dynamic';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mzazi.shop').replace(/\/$/, '');

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const car = await carBySlug(slug);
  if (!car) return { title: 'Vehicle not found — Golden Lion Motors Co.' };

  const bits = [car.year, car.body, car.fuel].filter(Boolean).join(' · ');
  return {
    title: `${car.title} — ${priceLabel(car.price_kes)} | Golden Lion Motors`,
    description: `${bits}. ${car.description || `${DEALER.brand} ${car.body || 'vehicle'} available from ${DEALER.company}.`}`.slice(0, 300),
    openGraph: {
      title: car.title,
      description: `${bits} — ${priceLabel(car.price_kes)}`,
      images: car.images[0] ? [`${SITE}/api/cars/image/${car.images[0].id}`] : [],
    },
  };
}

export default async function CarPage({ params }) {
  const { slug } = await params;
  const car = await carBySlug(slug);
  if (!car) notFound();

  bumpViews(car.id);
  const [contact, related] = await Promise.all([
    dealerContact(),
    car.body ? listCars({ body: car.body, limit: 4 }) : Promise.resolve([]),
  ]);

  const others = related.filter((r) => r.id !== car.id).slice(0, 3);
  const specs = spec(car);
  const enquire = `Hello ${DEALER.company}, I am interested in the ${car.title}${car.year ? ` (${car.year})` : ''} listed on mzazi.shop.`;

  // Structured data: a dealership listing is exactly what a search engine wants
  // to read, and it costs nothing to include.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: car.title,
    brand: { '@type': 'Brand', name: DEALER.brand },
    description: car.description || `${car.title} from ${DEALER.company}`,
    image: car.images.map((i) => `${SITE}/api/cars/image/${i.id}`),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'KES',
      price: car.price_kes || undefined,
      availability: car.status === 'sold'
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
      seller: { '@type': 'AutoDealer', name: DEALER.company },
    },
    vehicleModelDate: car.year || undefined,
    vehicleTransmission: car.transmission || undefined,
    fuelType: car.fuel || undefined,
    mileageFromOdometer: car.mileage_km != null
      ? { '@type': 'QuantitativeValue', value: car.mileage_km, unitCode: 'KMT' }
      : undefined,
  };

  return (
    <AppBackground orbs>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="container-site" style={{ paddingTop: 22, paddingBottom: 56 }}>
        {/* breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--dim)', marginBottom: 16 }}>
          <Link href="/cars" style={{ color: 'var(--dim)', textDecoration: 'none' }}>Showroom</Link>
          <span>/</span>
          {car.body && (
            <>
              <Link href="/cars" style={{ color: 'var(--dim)', textDecoration: 'none' }}>{car.body}</Link>
              <span>/</span>
            </>
          )}
          <span style={{ color: 'var(--muted)' }}>{car.model || car.title}</span>
        </nav>

        <div
          style={{
            display: 'grid', gap: 26,
            gridTemplateColumns: 'minmax(0, 1.55fr) minmax(280px, 0.9fr)',
            alignItems: 'start',
          }}
          className="car-detail-grid"
        >
          <div style={{ minWidth: 0 }}>
            <CarGallery images={car.images} title={car.title} />

            {/* specifications */}
            {specs.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <SectionTitle kicker="Specification" title="The numbers" />
                <div
                  style={{
                    display: 'grid', gap: 1, marginTop: 12,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden',
                  }}
                >
                  {specs.map((s) => (
                    <div key={s.label} style={{ background: 'var(--surface)', padding: '12px 14px' }}>
                      <p style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--dim)' }}>{s.label}</p>
                      <p style={{ fontSize: 14, color: 'var(--ink)', marginTop: 3 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {car.description && (
              <div style={{ marginTop: 28 }}>
                <SectionTitle kicker="From the yard" title="About this vehicle" />
                <p style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.75, color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>
                  {car.description}
                </p>
              </div>
            )}

            {Array.isArray(car.features) && car.features.length > 0 && (
              <div style={{ marginTop: 26 }}>
                <SectionTitle kicker="Fitted" title="Features" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {car.features.map((f) => (
                    <span
                      key={f}
                      style={{
                        padding: '6px 12px', borderRadius: 999, fontSize: 12,
                        border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--muted)',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* price panel */}
          <aside style={{ position: 'sticky', top: 76 }}>
            <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', background: 'var(--surface)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--line)' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>
                  {car.status === 'sold' ? 'Sold' : 'Available now'}
                </p>
                <h1
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400,
                    fontSize: 24, lineHeight: 1.2, color: 'var(--ink)', marginTop: 6,
                  }}
                >
                  {car.title}
                </h1>
                <p style={{ fontSize: 12, color: 'var(--dim)', marginTop: 6 }}>
                  {[car.year, car.body, car.engine].filter(Boolean).join(' · ')}
                </p>

                <p style={{ fontFamily: 'Georgia, serif', fontSize: 27, color: GOLD, marginTop: 16 }}>
                  {priceLabel(car.price_kes)}
                </p>
                <p style={{ fontSize: 11.5, color: 'var(--dim)', marginTop: 2 }}>
                  {car.price_kes != null && car.negotiable ? 'Negotiable · ' : ''}
                  {km(car.mileage_km) ? `${km(car.mileage_km)} · ` : ''}
                  {car.condition || 'Ask for details'}
                </p>
              </div>

              <div style={{ padding: 16, display: 'grid', gap: 10 }}>
                {car.status === 'sold' ? (
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center' }}>
                    This one has found a home. Ask what else is on the yard.
                  </p>
                ) : (
                  <>
                    {contact.whatsapp && (
                      <a
                        href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(enquire)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={cta(GOLD, '#141207')}
                      >
                        <Icons.Chat size={15} /> Enquire on WhatsApp
                      </a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} style={cta('transparent', 'var(--ink)', true)}>
                        <Icons.Phone size={15} /> {contact.phone}
                      </a>
                    )}
                    {!contact.phone && !contact.whatsapp && (
                      <p style={{ fontSize: 12, color: 'var(--dim)', textAlign: 'center', lineHeight: 1.6 }}>
                        Visit {DEALER.company} to view this vehicle. Ask for the {car.model || car.body || 'unit'}.
                      </p>
                    )}
                  </>
                )}
              </div>

              {(contact.address || contact.hours) && (
                <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--line)' }}>
                  {contact.address && (
                    <p style={{ fontSize: 11.5, color: 'var(--dim)', display: 'flex', gap: 7 }}>
                      <Icons.MapPin size={13} /> {contact.address}
                    </p>
                  )}
                  {contact.hours && (
                    <p style={{ fontSize: 11.5, color: 'var(--dim)', display: 'flex', gap: 7, marginTop: 4 }}>
                      <Icons.Clock size={13} /> {contact.hours}
                    </p>
                  )}
                </div>
              )}
            </div>

            <p style={{ fontSize: 10.5, color: 'var(--dim)', marginTop: 10, lineHeight: 1.6 }}>
              Listed by {DEALER.company} · {DEALER.brand} dealer. Prices in Kenyan shillings; confirm
              final price and availability with the showroom.
            </p>
          </aside>
        </div>

        {/* related */}
        {others.length > 0 && (
          <div style={{ marginTop: 46 }}>
            <SectionTitle kicker="Also on the yard" title={`More ${car.body || 'vehicles'}`} />
            <div style={{ display: 'grid', gap: 16, marginTop: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              {others.map((c) => (
                <Link
                  key={c.id}
                  href={`/cars/${c.slug}`}
                  style={{
                    textDecoration: 'none', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
                    overflow: 'hidden', background: 'var(--surface)',
                  }}
                >
                  <div style={{ aspectRatio: '16 / 10', background: 'var(--bg-2)' }}>
                    {c.cover_id
                      ? <img src={`/api/cars/image/${c.cover_id}`} alt={c.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--dim)' }}><Icons.Car size={26} /></div>}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: 'var(--ink)' }}>{c.title}</p>
                    <p style={{ fontSize: 12, color: GOLD, marginTop: 4 }}>{priceLabel(c.price_kes)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <style>{`
          @media (max-width: 900px) {
            .car-detail-grid { grid-template-columns: minmax(0, 1fr) !important; }
            .car-detail-grid aside { position: static !important; }
          }
        `}</style>
      </section>
    </AppBackground>
  );
}

function SectionTitle({ kicker, title }) {
  return (
    <div>
      <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>{kicker}</p>
      <h2 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400, fontSize: 20, color: 'var(--ink)', marginTop: 4 }}>
        {title}
      </h2>
    </div>
  );
}

const cta = (bg, color, outline = false) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '11px 16px',
  borderRadius: 999,
  background: bg,
  color,
  border: outline ? '1px solid var(--line)' : '1px solid transparent',
  fontSize: 12.5,
  fontWeight: 700,
  textDecoration: 'none',
});
