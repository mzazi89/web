import Link from 'next/link';
import Logo from './Logo';
import { Icons } from './ui';

// MZAZI TECH — site footer.
// Every v1 destination is preserved; new surfaces (Devices, Subscription,
// Payments, Help) are added under the account column so the footer mirrors the
// main navigation.

const COLUMNS = [
  {
    title: 'Your account',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Connected Devices', href: '/devices' },
      { label: 'Subscription', href: '/subscription' },
      { label: 'Payments', href: '/payments' },
      { label: 'Wallet', href: '/wallet' },
      { label: 'Help & Support', href: '/help' },
    ],
  },
  {
    title: 'Products',
    links: [
      { label: 'WhatsApp Automation', href: '/whatsapp-bot' },
      { label: 'Pterodactyl Panels', href: '/products' },
      { label: 'VPS Servers', href: '/vps' },
      { label: 'Developer API', href: '/api' },
      { label: 'Temp Numbers', href: '/temp-number' },
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
      { label: 'Telegram', href: 'https://t.me/mzazitech', external: true },
      { label: 'WhatsApp', href: 'https://wa.me/254108595201', external: true },
      { label: 'Bot', href: 'https://t.me/mrsmzazixdbot', external: true },
      { label: 'Email', href: 'mailto:mzazitechinc@gmail.com', external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--line)', position: 'relative', zIndex: 1 }}>
      <div className="container-site">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10" style={{ paddingTop: 48, paddingBottom: 36 }}>
          {/* Brand */}
          <div className="col-span-2 lg:col-span-4">
            <Link href="/" style={{ textDecoration: 'none' }} aria-label="MZAZI TECH home">
              <Logo size={36} withText />
            </Link>
            <p style={{ margin: '14px 0 16px', fontSize: 14, lineHeight: 1.65, color: 'var(--muted)', maxWidth: 340 }}>
              WhatsApp automation made simple. Connect your number, choose your bot —
              QUARTZ XD or MZAZI XMD — and start automating in minutes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: 'var(--good)' }}>
                <span className="dot dot-online anim-pulse" aria-hidden="true" />
                All systems operational
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--dim)' }}>
                <Icons.Shield size={14} />
                Secure payments via Paystack
              </span>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} className="col-span-1 lg:col-span-2" aria-label={col.title}>
              <p className="side-group-label" style={{ padding: '0 0 10px', margin: 0, color: 'var(--brand)' }}>
                {col.title}
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 9 }}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 13.5, color: 'var(--muted)', textDecoration: 'none' }}
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} style={{ fontSize: 13.5, color: 'var(--muted)', textDecoration: 'none' }}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Warranty strip */}
        <div
          className="card"
          style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, padding: '14px 16px', marginBottom: 28, background: 'var(--surface)',
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--ink)' }}>Panel warranty — </strong>
            Pterodactyl panels carry a 2-week replacement warranty from purchase.
          </p>
          <Link href="/contact" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Claim within 14 days →
          </Link>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, paddingTop: 20, paddingBottom: 32, borderTop: '1px solid var(--line-soft)',
          }}
        >
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--dim)' }}>
            © {new Date().getFullYear()} Mzazi Tech Inc — Nairobi, Kenya
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Link href="/privacy" style={{ fontSize: 12.5, color: 'var(--dim)', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: 12.5, color: 'var(--dim)', textDecoration: 'none' }}>Terms</Link>
            <a href="https://admin.mzazi.shop" style={{ fontSize: 12.5, color: 'var(--dim)', textDecoration: 'none' }}>Admin</a>
          </div>
        </div>
      </div>

      {/* Oversized wordmark — purely decorative */}
      <div
        aria-hidden="true"
        className="watermark"
        style={{ fontSize: 'clamp(60px, 15vw, 220px)', whiteSpace: 'nowrap', overflow: 'hidden', marginTop: -20, lineHeight: 0.85 }}
      >
        MZAZI TECH
      </div>
    </footer>
  );
}
