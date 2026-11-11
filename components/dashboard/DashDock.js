'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/ui';
import { isActive } from './Sidebar';

// Mobile navigation for the dashboard. Same five-thumb-reach idea as the
// marketing dock, but the destinations are account areas, not the shop.

const ITEMS = [
  { href: '/dashboard', label: 'Overview', Icon: Icons.Dashboard },
  { href: '/dashboard/services', label: 'Services', Icon: Icons.Layers },
  { href: '/dashboard/wallet', label: 'Wallet', Icon: Icons.Wallet },
  { href: '/dashboard/api', label: 'API', Icon: Icons.Code },
  { href: '/dashboard/settings', label: 'Account', Icon: Icons.Settings },
];

export default function DashDock() {
  const pathname = usePathname();

  return (
    <nav className="dock dash-dock no-print" aria-label="Dashboard sections">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} className={`dock-item ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
