'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/ui';
import { DOCK } from '@/lib/nav';

// MZAZI TECH — the phone rail. One component, every page.
//
// Previously the marketing site and the dashboard each had their own five-item
// bar, so the same screen position led somewhere different depending on where
// you were. This is a single rail, in a single order (Home first, Settings
// last), on every page — the position of a tab is a memory, and a memory that
// moves is worse than no tab at all.
//
// Behaviour, in the order it matters:
//   * swipe for the rest, chips snap to centre
//   * the current chip scrolls itself into view on arrival, but only if it is
//     actually off-screen — no gratuitous motion
//   * a soft fade appears at whichever end has more content, so the rail never
//     looks cut off, and disappears at the ends
//   * tapping the chip you are already on scrolls back to the start

const ICONS = {
  home: Icons.Home,
  bot: Icons.Bot,
  server: Icons.Server,
  cloud: Icons.Cloud,
  wallet: Icons.Wallet,
  receipt: Icons.Receipt,
  ticket: Icons.Ticket,
  dashboard: Icons.Dashboard,
  monitor: Icons.Monitor,
  users: Icons.Users,
  code: Icons.Code,
  phone: Icons.Phone,
  play: Icons.Play,
  info: Icons.Info,
  settings: Icons.Settings,
};

// A sign-in form is one decision; a nav bar under it invites people to leave.
const HIDDEN = ['/login', '/signup', '/forgot-password'];

// Dashboard screens have their own URLs, but the rail has one Dashboard chip;
// map them so the wallet tab lights up on /dashboard/wallet rather than the
// generic one. Longest match wins, so /dashboard/settings beats /dashboard.
const ALIASES = {
  '/wallet': ['/dashboard/wallet'],
  '/api': ['/dashboard/api'],
  '/payments': ['/dashboard/payments'],
  '/dashboard': ['/dashboard/services', '/dashboard/marketplace', '/dashboard/referral', '/dashboard/notifications'],
};

function matches(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Returns the one href that should look selected: the most specific match.
function activeHref(pathname) {
  let best = null;
  let bestLen = -1;
  for (const { href } of DOCK) {
    for (const candidate of [href, ...(ALIASES[href] || [])]) {
      if (matches(pathname, candidate) && candidate.length > bestLen) {
        best = href;
        bestLen = candidate.length;
      }
    }
  }
  return best;
}

export default function BottomNav() {
  const pathname = usePathname();
  const railRef = useRef(null);
  const activeRef = useRef(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const hidden = HIDDEN.includes(pathname);
  const current = activeHref(pathname);

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setEdges({ start: rail.scrollLeft > 4, end: max > 4 && rail.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    if (hidden) return;
    const rail = railRef.current;
    const chip = activeRef.current;
    if (rail && chip) {
      const r = rail.getBoundingClientRect();
      const c = chip.getBoundingClientRect();
      if (c.left < r.left + 8 || c.right > r.right - 8) {
        rail.scrollTo({ left: Math.max(0, chip.offsetLeft - rail.clientWidth / 2 + chip.clientWidth / 2), behavior: 'smooth' });
      }
    }
    measure();
  }, [pathname, hidden, measure]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    rail.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      rail.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure, hidden]);

  if (hidden) return null;

  const cls = ['dock', 'no-print', edges.start ? 'fade-start' : '', edges.end ? 'fade-end' : ''].filter(Boolean).join(' ');

  return (
    <nav ref={railRef} className={cls} aria-label="Quick navigation">
      {DOCK.map(({ href, label, icon }) => {
        const Icon = ICONS[icon] || Icons.ChevronRight;
        const active = href === current;
        return (
          <Link
            key={href}
            href={href}
            ref={active ? activeRef : undefined}
            className={`dock-item ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              if (active) railRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
