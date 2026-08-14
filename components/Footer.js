import Link from 'next/link';
import Logo from './Logo';

const sections = [
  {
    title: 'Services',
    links: [
      { label: 'Pterodactyl Panels', href: '/products' },
      { label: 'WhatsApp Bot',       href: '/whatsapp-bot' },
      { label: 'Wallet Top-up',      href: '/wallet' },
      { label: 'Dashboard',          href: '/dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us',   href: '/about' },
      { label: 'Contact',    href: '/contact' },
      { label: 'Create Account', href: '/signup' },
      { label: 'Login',     href: '/login' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Telegram Support', href: 'https://t.me/mzazitech',      external: true },
      { label: 'WhatsApp',         href: 'https://wa.me/254108595201', external: true },
      { label: 'Telegram Bot',     href: 'https://t.me/mrsmzazixdbot', external: true },
      { label: 'Email Us',         href: 'mailto:mzazitechinc@gmail.com', external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'rgba(2,4,9,0.70)', borderTop: '1px solid #1e3a8a', boxShadow: '0 -1px 0 rgba(59,130,246,0.25), 0 -14px 44px rgba(37,99,235,0.07)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Top row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4" style={{ textDecoration: 'none' }}>
              <Logo size={36} withText />
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#475569' }}>
              A global provider of Pterodactyl panel hosting, WhatsApp automation bots, and tech solutions.
            </p>
            {/* Social / contact chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Telegram', href: 'https://t.me/mzazitech', icon: '✈️' },
                { label: 'WhatsApp', href: 'https://wa.me/254108595201', icon: '📱' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ backgroundColor: '#060b16', color: '#64748b', border: '1px solid #1e3a8a', textDecoration: 'none' }}>
                  {s.icon} {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {sections.map(s => (
            <div key={s.title}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#3b82f6' }}>{s.title}</p>
              <ul className="space-y-2.5">
                {s.links.map(l => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer"
                        className="text-sm transition-colors hover:text-blue-400"
                        style={{ color: '#64748b', textDecoration: 'none' }}>
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href}
                        className="text-sm transition-colors hover:text-blue-400"
                        style={{ color: '#64748b', textDecoration: 'none' }}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Warranty notice */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl mb-8"
          style={{ backgroundColor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
          <span className="text-lg flex-shrink-0">🛡️</span>
          <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
            <span className="font-semibold" style={{ color: '#60a5fa' }}>Panel Warranty: </span>
            Pterodactyl panel replacement warranty is valid for <strong style={{ color: '#93c5fd' }}>2 weeks</strong> from purchase. Contact support within this period for a free replacement.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8"
          style={{ borderTop: '1px solid #1e3a8a' }}>
          <p className="text-xs text-center sm:text-left" style={{ color: '#374151' }}>
            © {new Date().getFullYear()} Mzazi Tech Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms',   href: '/terms' },
              { label: 'Support', href: '/contact' },
            ].map(l => (
              <Link key={l.label} href={l.href}
                className="text-xs transition-colors hover:text-blue-400"
                style={{ color: '#374151', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
            <a href="https://admin.mzazi.shop"
              className="text-xs transition-colors hover:text-red-400"
              style={{ color: '#1f2937', textDecoration: 'none' }}>
              Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
