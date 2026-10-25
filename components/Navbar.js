'use client';

// MZAZI TECH — main navigation.
//
// Two levels, deliberately:
//   PRIMARY — the six things a WhatsApp user actually does: Home, Dashboard,
//             Devices, Subscription, Payments, Help.
//   MORE    — everything else the platform offers (bot features, panels, VPS,
//             API, Ludo …), tucked into one dropdown so the bar never becomes
//             a menu wall.
//
// Every v1 route is preserved — only labels and grouping changed, so no existing
// link or bookmark breaks. Labels use plain words ("Devices") for what the
// backend calls sessions/numbers.

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Logo from './Logo';
import { fmtKes } from '@/lib/currency';
import { Button, ThemeToggle, Avatar, Icons } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

const PRIMARY = [
  { href: '/',             label: 'Home' },
  { href: '/dashboard',    label: 'Dashboard' },
  { href: '/devices',      label: 'Devices' },
  { href: '/about',        label: 'About' },
];

const MORE = [
  { href: '/subscription', label: 'Billing',      desc: 'Plans & payments' },
  { href: '/help',         label: 'Support',      desc: 'Help center' },
  { href: '/pair/mzazi',   label: 'Pair MZAZI XMD', desc: 'Modern WhatsApp automation' },
  { href: '/pair/quartz',  label: 'Pair QUARTZ XD', desc: 'Powerful group management' },
  { href: '/whatsapp-bot', label: 'Bot Guides',    desc: 'Features & commands' },
  { href: '/products',     label: 'Panel Hosting', desc: 'Pterodactyl hosting' },
  { href: '/vps',          label: 'VPS Servers',   desc: 'Scalable cloud infrastructure' },
  { href: '/contact',      label: 'Contact',      desc: 'Talk to a human' },
];

function isActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [ready, setReady] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const moreRef = useRef(null);
  const accountRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  // Close every panel on navigation.
  useEffect(() => {
    setDrawerOpen(false); setMoreOpen(false); setAccountOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [drawerOpen]);

  // Session + wallet balance.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = res.ok ? await res.json() : null;
        if (cancelled) return;
        if (data?.user) {
          setUser(data.user);
          const wr = await fetch('/api/wallet/balance');
          const wd = wr.ok ? await wr.json() : null;
          if (!cancelled && wd) setWallet(wd.balance);
        } else {
          setUser(null); setWallet(null);
        }
      } catch {
        if (!cancelled) { setUser(null); setWallet(null); }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  // Outside-click handling for the desktop dropdowns.
  useEffect(() => {
    const onDown = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null); setWallet(null); setDrawerOpen(false);
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Could not sign you out. Please try again.');
    }
  };

  const displayName = user
    ? (user.firstname ? `${user.firstname} ${user.lastname || ''}`.trim() : user.email)
    : '';

  return (
    <>
      <header className="app-header no-print">
        <div className="container-site">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, height: 'var(--nav-h)' }}>

            {/* ── Brand ── */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flex: '0 0 auto' }} aria-label="MZAZI TECH home">
              <Logo size={42} withText />
            </Link>

            {/* ── Desktop primary nav ── */}
            <nav aria-label="Main" className="hidden lg:flex" style={{ alignItems: 'center', gap: 2 }}>
              {PRIMARY.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`nav-link ${isActive(pathname, l.href) ? 'is-active' : ''}`}
                  aria-current={isActive(pathname, l.href) ? 'page' : undefined}
                >
                  {l.label}
                </Link>
              ))}

              <div ref={moreRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="nav-link"
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((o) => !o)}
                  style={{ background: 'none', border: 0, cursor: 'pointer' }}
                >
                  More
                  <Icons.ChevronDown size={15} />
                </button>
                {moreOpen && (
                  <div className="menu" role="menu" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: 290, zIndex: 60 }}>
                    {MORE.map((l) => (
                      <Link key={l.href} href={l.href} className="menu-item" role="menuitem" style={{ alignItems: 'flex-start' }}>
                        <span style={{ display: 'block', minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>{l.label}</span>
                          <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>{l.desc}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* ── Desktop right side ── */}
            <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
              <ThemeToggle />

              {!ready ? (
                <span className="skeleton" style={{ width: 96, height: 34, borderRadius: 'var(--r-sm)' }} aria-hidden="true" />
              ) : user ? (
                <>
                  {wallet !== null && (
                    <Link href="/wallet" style={{ textDecoration: 'none' }}>
                      <span className="tag tag-green" style={{ fontWeight: 700 }}>
                        <Icons.Wallet size={13} />
                        <span className="tnum">{fmtKes(wallet)}</span>
                      </span>
                    </Link>
                  )}

                  <div ref={accountRef} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setAccountOpen((o) => !o)}
                      aria-haspopup="menu"
                      aria-expanded={accountOpen}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 5px',
                        background: 'var(--surface)', border: '1px solid var(--line)',
                        borderRadius: 'var(--r-pill)', cursor: 'pointer', minHeight: 40,
                      }}
                    >
                      <Avatar name={displayName} size={28} />
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.firstname || 'Account'}
                      </span>
                      <Icons.ChevronDown size={14} />
                    </button>

                    {accountOpen && (
                      <div className="menu" role="menu" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 240, zIndex: 60 }}>
                        <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--line-soft)', marginBottom: 6 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayName}
                          </p>
                          <p style={{ margin: '1px 0 0', fontSize: 11.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                          </p>
                        </div>
                        <Link href="/dashboard" className="menu-item" role="menuitem"><Icons.Dashboard size={16} /> Dashboard</Link>
                        <Link href="/account" className="menu-item" role="menuitem"><Icons.User size={16} /> Account</Link>
                        <Link href="/wallet" className="menu-item" role="menuitem"><Icons.Wallet size={16} /> Wallet &amp; Payments</Link>
                        <Link href="/subscription" className="menu-item" role="menuitem"><Icons.CreditCard size={16} /> Subscription</Link>
                        <button type="button" className="menu-item danger" role="menuitem" onClick={logout}>
                          <Icons.LogOut size={16} /> Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Button href="/login" variant="ghost" size="sm">Login</Button>
                  <Button href="/signup" variant="primary" size="sm">Get Started</Button>
                </>
              )}
            </div>

            {/* ── Mobile controls ── */}
            <div className="flex lg:hidden" style={{ alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
              <ThemeToggle />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={drawerOpen}
              >
                <Icons.Menu size={19} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <>
          <div className="overlay overlay-soft" onClick={() => setDrawerOpen(false)} aria-hidden="true" style={{ zIndex: 94 }} />
          <div className="drawer" role="dialog" aria-modal="true" aria-label="Navigation">
            {/* One line carries identity, balance and the close control: the
                logo row the desktop sidebar needs would only cost height here. */}
            <div className="drawer-head">
              {ready && user ? (
                <div className="drawer-user">
                  <Avatar name={displayName} size={24} />
                  <span className="drawer-user-name">{displayName}</span>
                  {wallet !== null && (
                    <span className="tag tag-green tnum" style={{ flex: '0 0 auto' }}>{fmtKes(wallet)}</span>
                  )}
                </div>
              ) : (
                <Link href="/" style={{ textDecoration: 'none' }} onClick={() => setDrawerOpen(false)}>
                  <Logo size={26} withText />
                </Link>
              )}
              <button type="button" className="icon-btn" onClick={() => setDrawerOpen(false)} aria-label="Close navigation menu" style={{ width: 28, height: 28, flex: '0 0 auto' }}>
                <Icons.X size={15} />
              </button>
            </div>

            {/* Three columns keep all fifteen destinations inside a card about a
                quarter of the screen tall, so the menu never needs scrolling. */}
            <nav aria-label="Main" className="drawer-grid">
              {[...PRIMARY, ...MORE].map((l) => {
                const active = isActive(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`side-link drawer-link ${active ? 'is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    title={l.label}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>

            <div className="drawer-foot">
              {ready && user ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
                  <Button href="/wallet" variant="ghost" size="sm" block>Wallet</Button>
                  <Button href="/account" variant="ghost" size="sm" block>Account</Button>
                  <Button variant="danger" size="sm" block onClick={logout}>Sign out</Button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  <Button href="/signup" variant="primary" size="sm" block>Get Started</Button>
                  <Button href="/login" variant="ghost" size="sm" block>Login</Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
