// MZAZI TECH — site footer.
//
// Two lines, both short. The link columns that used to live here duplicated the
// main navigation, so they are gone: the navbar is the directory. What remains
// is the one thing a footer is actually obligated to carry — the legal
// documents — plus the mark.
//
// The links are not decoration. Google Play and AdMob both require the privacy
// policy to be reachable from the app and the site, and a policy nobody can
// find is treated as absent.

import Link from 'next/link';
import { LEGAL } from '@/lib/nav';

export default function Footer() {
  const year = new Date().getFullYear();

  const linkStyle = {
    color: 'var(--muted)',
    textDecoration: 'none',
    fontSize: 11.5,
  };

  return (
    <footer
      className="site-footer"
      style={{
        background: 'var(--bg-2)',
        borderTop: '1px solid var(--line)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 10,
          padding: '11px 16px 0',
        }}
      >
        {[...LEGAL, { href: '/contact', label: 'Contact' }, { href: '/help', label: 'Help' }].map((l, i, arr) => (
          <span key={l.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Link href={l.href} style={linkStyle} className="footer-link">
              {l.label}
            </Link>
            {i < arr.length - 1 && (
              <span aria-hidden="true" style={{ color: 'var(--line)', fontSize: 11 }}>·</span>
            )}
          </span>
        ))}
      </div>

      <p
        style={{
          margin: 0,
          padding: '8px 16px 13px',
          textAlign: 'center',
          fontSize: 11.5,
          letterSpacing: '0.01em',
          color: 'var(--dim)',
        }}
      >
        © {year} Mzazi Tech
      </p>
    </footer>
  );
}
