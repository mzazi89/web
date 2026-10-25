import Link from 'next/link';
import Logo from './Logo';
import { Icons } from './ui';

// MZAZI TECH — site footer.
// Every v1 destination is preserved; new surfaces (Devices, Subscription,
// Payments, Help) are added under the account column so the footer mirrors the
// main navigation.

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Devices', href: '/devices' },
      { label: 'Pair MZAZI XMD', href: '/pair/mzazi' },
      { label: 'Pair QUARTZ XD', href: '/pair/quartz' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Hosting', href: '/products' },
      { label: 'VPS Servers', href: '/vps' },
      { label: 'Developer API', href: '/api/docs' },
      { label: 'Bot Guides', href: '/whatsapp-bot' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Community', href: '/community' },
      { label: 'About Dominic', href: '/about' },
      { label: 'Contact Support', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer" style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--line)', position: 'relative', zIndex: 1 }}>
      <div className="container-site">
        <div className="grid grid-cols-2 lg:grid-cols-10 gap-6 lg:gap-8" style={{ paddingTop: 24, paddingBottom: 20 }}>
          {/* Brand */}
          <div className="col-span-2 lg:col-span-4">
            <Link href="/" style={{ textDecoration: 'none' }} aria-label="MZAZI TECH home">
              <Logo size={28} withText />
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: 'var(--good)' }}>
                <span className="dot dot-online anim-pulse" aria-hidden="true" />
                Systems Active
              </span>
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} className="col-span-1 lg:col-span-2" aria-label={col.title}>
              <p className="side-group-label" style={{ padding: '0 0 8px', margin: 0, color: 'var(--brand)', fontSize: 13, fontWeight: 700 }}>
                {col.title}
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, paddingTop: 16, paddingBottom: 24, borderTop: '1px solid var(--line-soft)',
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: 'var(--dim)' }}>
            © {new Date().getFullYear()} Mzazi Tech — Nairobi, Kenya
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/privacy" style={{ fontSize: 12, color: 'var(--dim)', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: 12, color: 'var(--dim)', textDecoration: 'none' }}>Terms</Link>
            <a href="https://admin.mzazi.shop" style={{ fontSize: 12, color: 'var(--dim)', textDecoration: 'none' }}>Admin</a>
          </div>
        </div>
      </div>

      {/* Oversized wordmark — purely decorative */}
      <div
        aria-hidden="true"
        className="watermark"
        style={{ fontSize: 'clamp(40px, 10vw, 120px)', whiteSpace: 'nowrap', overflow: 'hidden', marginTop: -10, lineHeight: 0.85, opacity: 0.05 }}
      >
        MZAZI TECH
      </div>
    </footer>
  );
}
