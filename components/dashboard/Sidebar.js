'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, Icons } from '@/components/ui';

// MZAZI TECH — dashboard rail.
//
// Seven destinations, one level, no accordions: a hosting account has few
// enough areas that hiding them costs more than it saves. The active row is
// marked by a hairline of brand light rather than a filled block, which keeps
// the rail quiet next to the cards it sits beside.

export const NAV = [
  { href: '/dashboard', label: 'Overview', Icon: Icons.Dashboard },
  { href: '/dashboard/services', label: 'My services', Icon: Icons.Layers },
  { href: '/dashboard/marketplace', label: 'Marketplace', Icon: Icons.Box },
  { href: '/dashboard/wallet', label: 'Wallet', Icon: Icons.Wallet },
  { href: '/dashboard/api', label: 'API', Icon: Icons.Code },
  { href: '/dashboard/notifications', label: 'Notifications', Icon: Icons.Bell },
  { href: '/dashboard/settings', label: 'Settings', Icon: Icons.Settings },
];

export function isActive(pathname, href) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ user, plan, unread = 0 }) {
  const pathname = usePathname();
  const name = user?.firstname || user?.email || 'Member';
  const initials = (user?.firstname?.[0] || 'M').toUpperCase() + (user?.lastname?.[0] || '').toUpperCase();

  return (
    <aside className="dash-side">
      <div className="dash-id">
        {user?.avatar ? (
          <Avatar src={user.avatar} name={name} size={30} />
        ) : (
          <span className="dash-avatar">{initials}</span>
        )}
        <span style={{ minWidth: 0 }}>
          <span className="dash-id-name">{name}</span>
          <span className="dash-id-plan">{plan || 'FREE'} plan</span>
        </span>
      </div>

      <nav aria-label="Dashboard">
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} className={`dash-nav-item ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon size={15} />
              <span>{label}</span>
              {href === '/dashboard/notifications' && unread > 0 && <span className="dash-count">{unread}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="dash-side-foot">
        <Link href="/help" className="dash-nav-item"><Icons.Help size={15} /><span>Support</span></Link>
        <Link href="/" className="dash-nav-item"><Icons.ArrowLeft size={15} /><span>Back to site</span></Link>
      </div>
    </aside>
  );
}
