'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/transactions', label: 'Transactions', icon: '💸' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/packages', label: 'Packages', icon: '📦' },
  { href: '/admin/vouchers', label: 'Vouchers', icon: '🎟️' },
  { href: '/admin/testimonials', label: 'Testimonials', icon: '⭐' },
  { href: '/api/admin', label: 'API Admin', icon: '🔌' },
];

// Unified admin shell with sidebar navigation (login page stays clean)
export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';

  if (isLogin) return <>{children}</>;

  return (
    <div style={{ backgroundColor: '#0a0a0f', minHeight: '100vh' }}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-60 flex-shrink-0 sticky top-0 h-screen p-4"
          style={{ backgroundColor: '#0d1117', borderRight: '1px solid #1e2d4a' }}>
          <Link href="/" className="flex items-center gap-2 mb-6" style={{ textDecoration: 'none' }}>
            <span className="text-lg">⚡</span>
            <span className="font-extrabold" style={{ background: 'linear-gradient(135deg,#60a5fa,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MZAZI Admin
            </span>
          </Link>
          <nav className="space-y-1 flex-1">
            {LINKS.map(l => {
              const active = pathname === l.href || (l.href !== '/admin/dashboard' && pathname.startsWith(l.href));
              return (
                <Link key={l.href} href={l.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(37,99,235,0.15)' : 'transparent',
                    color: active ? '#60a5fa' : '#94a3b8',
                    border: `1px solid ${active ? 'rgba(37,99,235,0.4)' : 'transparent'}`,
                    textDecoration: 'none',
                  }}>
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>
          <Link href="/" className="text-xs" style={{ color: '#475569', textDecoration: 'none' }}>← Back to site</Link>
        </aside>

        {/* Mobile top nav */}
        <div className="md:hidden w-full">
          <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: '#0d1117', borderBottom: '1px solid #1e2d4a' }}>
            <span className="font-extrabold text-sm" style={{ color: '#f0f4ff' }}>⚡ MZAZI Admin</span>
            <details className="relative">
              <summary className="text-sm px-3 py-2 rounded-lg cursor-pointer" style={{ color: '#94a3b8', border: '1px solid #1e2d4a', listStyle: 'none' }}>
                ☰ Menu
              </summary>
              <div className="absolute right-0 top-11 w-48 p-2 rounded-xl z-50"
                style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
                {LINKS.map(l => (
                  <Link key={l.href} href={l.href}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{ color: pathname === l.href ? '#60a5fa' : '#94a3b8', textDecoration: 'none' }}>
                    {l.icon} {l.label}
                  </Link>
                ))}
              </div>
            </details>
          </div>
          <div className="p-4">{children}</div>
        </div>

        {/* Desktop content */}
        <main className="hidden md:block flex-1 p-8" style={{ minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
