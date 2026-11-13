'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/ui';
import { isActive } from './Sidebar';

// Mobile navigation for the dashboard. Same rail as the site dock — every
// section, swipeable — because hiding half the account behind a hamburger on a
// phone is how people conclude a feature does not exist.

const ITEMS = [
  { href: '/dashboard', label: 'Overview', Icon: Icons.Dashboard },
  { href: '/dashboard/services', label: 'Services', Icon: Icons.Layers },
  { href: '/dashboard/wallet', label: 'Wallet', Icon: Icons.Wallet },
  { href: '/dashboard/marketplace', label: 'Marketplace', Icon: Icons.Cart },
  { href: '/dashboard/referral', label: 'Referrals', Icon: Icons.Users },
  { href: '/dashboard/notifications', label: 'Alerts', Icon: Icons.Bell },
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
