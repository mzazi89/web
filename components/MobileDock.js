'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/ui';

// MZAZI TECH — thumb-reach navigation for phones.
//
// Five destinations, no submenus, no labels that need explaining. The desktop
// header keeps the full map; this is the subset people actually press while
// standing in a queue. Hidden from 768px up, where the header takes over.
//
// Layout reserves the height in globals.css (body padding-bottom) so the dock
// never covers the last card on a page.

const ITEMS = [
  { href: '/', label: 'Home', Icon: Icons.Home },
  { href: '/products', label: 'Hosting', Icon: Icons.Server },
  { href: '/whatsapp-bot', label: 'Bots', Icon: Icons.Bot },
  { href: '/wallet', label: 'Wallet', Icon: Icons.Wallet },
  { href: '/dashboard', label: 'Account', Icon: Icons.Dashboard },
];

// Auth screens are a single decision — a nav bar under a sign-in form invites
// people to leave the flow they just started.
const HIDDEN = ['/login', '/signup', '/forgot-password'];

export default function MobileDock() {
  const pathname = usePathname();
  if (HIDDEN.includes(pathname)) return null;

  return (
    <nav className="dock no-print" aria-label="Quick navigation">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`dock-item ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
