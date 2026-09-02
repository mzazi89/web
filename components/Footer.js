import Link from 'next/link';
import Logo from './Logo';

const columns = [
  {
    title: 'Products',
    links: [
      { label: 'Pterodactyl Panels', href: '/products' },
      { label: 'VPS Servers', href: '/vps' },
      { label: 'WhatsApp Automation', href: '/whatsapp-bot' },
      { label: 'Developer API', href: '/api' },
      { label: 'Temp Numbers', href: '/temp-number' },
      { label: 'Wallet', href: '/wallet' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Reviews', href: '/testimonials' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Telegram — t.me/mzazitech', href: 'https://t.me/mzazitech', external: true },
      { label: 'WhatsApp — wa.me/254108595201', href: 'https://wa.me/254108595201', external: true },
      { label: 'Bot — t.me/mrsmzazixdbot', href: 'https://t.me/mrsmzazixdbot', external: true },
      { label: 'Email — mzazitechinc@gmail.com', href: 'mailto:mzazitechinc@gmail.com', external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ background: '#0B0D0F', borderTop: '1px solid #1B2026' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        {/* Top: brand + link columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pt-14 pb-12">
          {/* Brand — spans 5 */}
          <div className="lg:col-span-5">
            <Link href="/" className="flex items-center gap-2.5 mb-5" style={{ textDecoration: 'none' }}>
              <Logo size={38} withText />
            </Link>
            <p className="text-sm leading-relaxed max-w-sm mb-6" style={{ color: '#79818A' }}>
              Kenya-born infrastructure company. Pterodactyl panels, WhatsApp automation and
              developer APIs — operated from Nairobi, trusted worldwide.
            </p>
            <div className="flex flex-col gap-1.5">
              <span className="mono text-[11px] tracking-[0.14em] uppercase flex items-center gap-2" style={{ color: '#3ECF8E' }}>
                <span className="dot anim-pulse" /> All systems operational
              </span>
              <span className="mono text-[11px] tracking-[0.14em] uppercase" style={{ color: '#4C535B' }}>
                Payments via Paystack · KES wallet
              </span>
            </div>
          </div>

          {/* Link columns — 7 split */}
          {columns.map((c, i) => (
            <div key={c.title} className={i === 0 ? 'lg:col-span-2' : 'lg:col-span-2'}>
              <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#F2A93B' }}>
                {c.title}
              </p>
              <ul className="space-y-2.5">
                {c.links.map(l => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer"
                        className="text-[13px] transition-colors"
                        style={{ color: '#79818A', textDecoration: 'none' }}>
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href}
                        className="text-[13px] transition-colors"
                        style={{ color: '#79818A', textDecoration: 'none' }}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Warranty strip */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 mb-10"
          style={{ border: '1px solid #262C33', borderRadius: 4, background: '#0F1215' }}
        >
          <p className="mono text-[11px] tracking-[0.06em]" style={{ color: '#79818A' }}>
            <span style={{ color: '#F2A93B' }}>PANEL WARRANTY — </span>
            Pterodactyl panels carry a 2-week replacement warranty from purchase.
          </p>
          <a href="/contact" className="mono text-[11px] tracking-[0.1em] uppercase flex-shrink-0" style={{ color: '#AEB5BD', textDecoration: 'none' }}>
            Claim within 14 days →
          </a>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-8" style={{ borderTop: '1px solid #1B2026', paddingTop: 24 }}>
          <p className="mono text-[11px]" style={{ color: '#4C535B' }}>
            © {new Date().getFullYear()} Mzazi Tech Inc — Nairobi, Kenya
          </p>
          <div className="flex items-center gap-5">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Admin', href: 'https://admin.mzazi.shop' },
            ].map(l => (
              <Link key={l.label} href={l.href}
                className="mono text-[11px] uppercase tracking-[0.1em] transition-colors"
                style={{ color: '#4C535B', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Giant wordmark */}
      <div aria-hidden="true" className="watermark overflow-hidden" style={{ fontSize: 'clamp(80px, 16.5vw, 260px)', whiteSpace: 'nowrap', marginTop: -30 }}>
        MZAZI TECH
      </div>
    </footer>
  );
}
