'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/ui';

// MZAZI TECH — thumb-reach navigation for phones.
//
// Every app, not five. The bar is a horizontal rail: the first screens sit in
// thumb reach, and the rest are one swipe away to the left. Order is by how
// often a customer actually wants each one, not alphabetically — the rail is the
// product's front door, and Home at the end is deliberate, because the logo in
// the header already goes home.
//
// Layout reserves the height in globals.css (body padding-bottom) so the rail
// never covers the last card on a page.

const ITEMS = [
  { href: '/whatsapp-bot', label: 'Bots', Icon: Icons.Bot },
  { href: '/products', label: 'Hosting', Icon: Icons.Server },
  { href: '/wallet', label: 'Wallet', Icon: Icons.Wallet },
  { href: '/payments', label: 'Payments', Icon: Icons.Receipt },
  { href: '/dashboard', label: 'Account', Icon: Icons.Dashboard },
  { href: '/vps', label: 'VPS', Icon: Icons.Cloud },
  { href: '/subscription', label: 'Plans', Icon: Icons.Ticket },
  { href: '/devices', label: 'Devices', Icon: Icons.Monitor },
  { href: '/community', label: 'Community', Icon: Icons.Users },
  { href: '/api', label: 'API', Icon: Icons.Code },
  { href: '/temp-number', label: 'Numbers', Icon: Icons.Phone },
  { href: '/ludo', label: 'Ludo', Icon: Icons.Play },
  { href: '/about', label: 'About', Icon: Icons.Info },
  { href: '/', label: 'Home', Icon: Icons.Home },
];

// Auth screens are a single decision — a nav bar under a sign-in form invites
// people to leave the flow they just started.
const HIDDEN = ['/login', '/signup', '/forgot-password'];

export default function MobileDock() {
  const pathname = usePathname();
  const railRef = useRef(null);
  const activeRef = useRef(null);

  const hidden = HIDDEN.includes(pathname) || pathname.startsWith('/dashboard');

  // Bring the current page into view without yanking the whole document: the
  // rail scrolls itself, and only when the active chip is actually off-screen.
  useEffect(() => {
    if (hidden) return;
    const rail = railRef.current;
    const chip = activeRef.current;
    if (!rail || !chip) return;
    const r = rail.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    if (c.left < r.left + 8 || c.right > r.right - 8) {
      rail.scrollTo({ left: Math.max(0, chip.offsetLeft - rail.clientWidth / 2 + chip.clientWidth / 2), behavior: 'smooth' });
    }
  }, [pathname, hidden]);

  if (hidden) return null;

  return (
    <nav ref={railRef} className="dock no-print" aria-label="Quick navigation">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            ref={active ? activeRef : undefined}
            className={`dock-item ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => { if (active) railRef.current?.scrollTo({ left: 0, behavior: 'smooth' }); }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
