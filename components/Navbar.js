'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Logo from './Logo';
import { fmtKes } from '@/lib/currency';

const NAV_LINKS = [
  { href: '/',             label: 'Home' },
  { href: '/products',     label: 'Panels' },
  { href: '/whatsapp-bot', label: 'WhatsApp' },
  { href: '/api',          label: 'API' },
  { href: '/temp-number',  label: 'Temp Number' },
  { href: '/ludo',         label: 'Ludo' },
  { href: '/testimonials', label: 'Reviews' },
  { href: '/about',        label: 'About' },
  { href: '/contact',      label: 'Contact' },
];

export default function Navbar() {
  const [user, setUser]               = useState(null);
  const [walletBalance, setWallet]    = useState(null);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);
  const [chatMsg, setChatMsg]         = useState({ subject: '', message: '' });
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSent, setChatSent]       = useState(false);
  const router   = useRouter();
  const pathname = usePathname();
  const chatRef  = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Scroll state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auth check on every route change
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) {
          setUser(d.user);
          fetch('/api/wallet/balance')
            .then(r => r.ok ? r.json() : null)
            .then(wd => { if (wd) setWallet(wd.balance); });
        } else {
          setUser(null);
          setWallet(null);
        }
      })
      .catch(() => { setUser(null); setWallet(null); });
  }, [pathname]);

  // Close chat dropdown on outside click
  useEffect(() => {
    const handler = e => { if (chatRef.current && !chatRef.current.contains(e.target)) setChatOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null); setWallet(null); setMenuOpen(false);
    router.push('/');
  };

  const handleChatSubmit = async e => {
    e.preventDefault();
    setChatLoading(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatMsg),
      });
      if (res.ok) { setChatSent(true); setChatMsg({ subject: '', message: '' }); }
    } catch {}
    setChatLoading(false);
  };

  const isActive = href => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* ── Utility strip (desktop) ── */}
      <div
        className="hidden md:block"
        style={{ background: '#0F1215', borderBottom: '1px solid #1B2026', position: 'sticky', top: 0, zIndex: 49 }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-8">
          <span className="mono text-[10px] tracking-[0.18em] uppercase" style={{ color: '#4C535B' }}>
            Mzazi Tech Inc — Nairobi, Kenya
          </span>
          <div className="flex items-center gap-5">
            <span className="mono text-[10px] tracking-[0.14em] uppercase flex items-center gap-2" style={{ color: '#79818A' }}>
              <span className="dot anim-pulse" style={{ color: '#3ECF8E' }} />
              All systems operational
            </span>
            <a
              href="https://t.me/mzazitech"
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-[10px] tracking-[0.14em] uppercase"
              style={{ color: '#AEB5BD', textDecoration: 'none' }}
            >
              t.me/mzazitech →
            </a>
          </div>
        </div>
      </div>

      {/* ── Main bar ── */}
      <nav
        className="sticky top-0 md:top-8 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(11,13,15,0.92)' : 'rgba(11,13,15,0.72)',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: '1px solid #1B2026',
          boxShadow: scrolled ? '0 12px 32px rgba(0,0,0,0.45)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo (left) */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0" style={{ textDecoration: 'none' }}>
              <Logo size={34} withText />
            </Link>

            {/* Desktop nav links — mono, numbered */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="mono px-3 py-2 text-[11px] font-medium tracking-[0.08em] uppercase transition-colors"
                  style={{
                    color: isActive(l.href) ? '#F2A93B' : '#79818A',
                    textDecoration: 'none',
                    borderBottom: isActive(l.href) ? '2px solid #F2A93B' : '2px solid transparent',
                  }}
                >
                  {String(i + 1).padStart(2, '0')} {l.label}
                </Link>
              ))}
            </div>

            {/* Desktop right side */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Quick inquiry */}
              {user && (
                <div className="relative" ref={chatRef}>
                  <button
                    onClick={() => { setChatOpen(o => !o); setChatSent(false); }}
                    className="mono px-3 py-2 text-[11px] font-medium tracking-[0.08em] uppercase"
                    style={{ color: '#AEB5BD', border: '1px solid #262C33', borderRadius: 2, background: 'transparent', cursor: 'pointer' }}
                  >
                    Support
                  </button>
                  {chatOpen && (
                    <div className="absolute right-0 top-11 w-80 overflow-hidden"
                      style={{ backgroundColor: '#14181D', border: '1px solid #262C33', borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,0.55)', zIndex: 60 }}>
                      <div className="px-5 py-4 border-b" style={{ borderColor: '#1B2026' }}>
                        <p className="display text-sm font-bold" style={{ color: '#E9E7E2' }}>Quick inquiry</p>
                        <p className="mono text-[10px] uppercase tracking-[0.14em] mt-1" style={{ color: '#4C535B' }}>Reply within 2 hours</p>
                      </div>
                      {chatSent ? (
                        <div className="p-6 text-center">
                          <p className="display font-bold text-sm" style={{ color: '#3ECF8E' }}>Message sent.</p>
                          <p className="text-xs mt-1" style={{ color: '#79818A' }}>We&apos;ll get back to you soon.</p>
                          <button onClick={() => setChatSent(false)} className="mono text-[10px] uppercase tracking-[0.12em] mt-3" style={{ color: '#4C535B', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Send another
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleChatSubmit} className="p-5 space-y-3">
                          <input value={chatMsg.subject} onChange={e => setChatMsg(m => ({ ...m, subject: e.target.value }))}
                            placeholder="Subject" required
                            className="input"
                            style={{ padding: '10px 12px', fontSize: 14 }} />
                          <textarea value={chatMsg.message} onChange={e => setChatMsg(m => ({ ...m, message: e.target.value }))}
                            placeholder="Your message…" required rows={3}
                            className="input resize-none"
                            style={{ padding: '10px 12px', fontSize: 14 }} />
                          <button type="submit" disabled={chatLoading} className="btn btn-primary w-full" style={{ padding: '11px 20px' }}>
                            {chatLoading ? 'Sending…' : 'Send inquiry'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Wallet */}
              {user && walletBalance !== null && (
                <Link href="/wallet"
                  className="mono flex items-center gap-2 px-3 py-2 text-[11px] font-semibold tracking-[0.06em]"
                  style={{ backgroundColor: 'rgba(242,169,59,0.07)', color: '#F2A93B', border: '1px solid rgba(242,169,59,0.3)', borderRadius: 2, textDecoration: 'none' }}>
                  {fmtKes(walletBalance)}
                </Link>
              )}

              {/* Auth */}
              {user ? (
                <>
                  <Link href="/dashboard"
                    className="mono flex items-center gap-2 px-3 py-2 text-[11px] font-medium tracking-[0.06em] uppercase"
                    style={{ color: '#AEB5BD', border: '1px solid #262C33', borderRadius: 2, textDecoration: 'none' }}>
                    <span
                      className="flex items-center justify-center text-[10px] font-bold"
                      style={{ width: 20, height: 20, borderRadius: '50%', background: '#F2A93B', color: '#14100A' }}
                    >
                      {(user.firstname || user.email || 'U')[0].toUpperCase()}
                    </span>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout}
                    className="mono px-3 py-2 text-[11px] font-medium tracking-[0.06em] uppercase"
                    style={{ color: '#E5484D', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login"
                    className="mono px-4 py-2 text-[11px] font-medium tracking-[0.06em] uppercase"
                    style={{ color: '#AEB5BD', textDecoration: 'none' }}>
                    Login
                  </Link>
                  <Link href="/signup"
                    className="btn btn-primary"
                    style={{ padding: '10px 18px', fontSize: 11 }}>
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile controls */}
            <div className="flex lg:hidden items-center gap-2">
              {user && walletBalance !== null && (
                <Link href="/wallet"
                  className="mono px-2.5 py-1.5 text-[11px] font-semibold"
                  style={{ backgroundColor: 'rgba(242,169,59,0.07)', color: '#F2A93B', border: '1px solid rgba(242,169,59,0.3)', borderRadius: 2, textDecoration: 'none' }}>
                  {fmtKes(walletBalance)}
                </Link>
              )}
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="w-10 h-10 flex flex-col items-center justify-center gap-1.5"
                style={{ border: '1px solid #262C33', borderRadius: 2, backgroundColor: 'transparent' }}
                aria-label="Menu"
                aria-expanded={menuOpen}
              >
                <span className="block w-5 h-0.5 transition-all duration-300"
                  style={{ backgroundColor: '#AEB5BD', transform: menuOpen ? 'translateY(6px) rotate(45deg)' : 'none' }} />
                <span className="block w-5 h-0.5 transition-all duration-300"
                  style={{ backgroundColor: '#AEB5BD', opacity: menuOpen ? 0 : 1 }} />
                <span className="block w-5 h-0.5 transition-all duration-300"
                  style={{ backgroundColor: '#AEB5BD', transform: menuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="lg:hidden" style={{ background: '#0F1215', borderTop: '1px solid #1B2026' }}>
            <div className="px-5 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
              {NAV_LINKS.map((l, i) => (
                <Link key={l.href} href={l.href}
                  className="mono flex items-center gap-3 px-3 py-2.5 text-[12px] font-medium tracking-[0.08em] uppercase"
                  style={{
                    color: isActive(l.href) ? '#F2A93B' : '#AEB5BD',
                    backgroundColor: isActive(l.href) ? 'rgba(242,169,59,0.06)' : 'transparent',
                    textDecoration: 'none',
                  }}>
                  <span style={{ color: '#4C535B' }}>{String(i + 1).padStart(2, '0')}</span>
                  {l.label}
                </Link>
              ))}

              <div className="pt-3 mt-2" style={{ borderTop: '1px solid #1B2026' }}>
                {user ? (
                  <div className="space-y-1.5">
                    <div className="px-3 py-2.5" style={{ background: '#14181D', border: '1px solid #262C33', borderRadius: 2 }}>
                      <p className="text-sm font-semibold truncate" style={{ color: '#E9E7E2' }}>
                        {user.firstname ? `${user.firstname} ${user.lastname || ''}`.trim() : user.email}
                      </p>
                      <p className="mono text-[11px] truncate mt-0.5" style={{ color: '#4C535B' }}>{user.email}</p>
                    </div>
                    <Link href="/dashboard" className="mono block px-3 py-2.5 text-[12px] font-medium uppercase tracking-[0.08em]" style={{ color: '#AEB5BD', textDecoration: 'none' }}>
                      Dashboard
                    </Link>
                    <Link href="/wallet" className="mono block px-3 py-2.5 text-[12px] font-medium uppercase tracking-[0.08em]" style={{ color: '#F2A93B', textDecoration: 'none' }}>
                      Wallet — {walletBalance !== null ? fmtKes(walletBalance) : '—'}
                    </Link>
                    <button onClick={handleLogout}
                      className="mono w-full text-left px-3 py-2.5 text-[12px] font-medium uppercase tracking-[0.08em]"
                      style={{ color: '#E5484D', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link href="/login" className="btn btn-ghost flex-1" style={{ padding: '11px 0', fontSize: 11 }}>
                      Login
                    </Link>
                    <Link href="/signup" className="btn btn-primary flex-1" style={{ padding: '11px 0', fontSize: 11 }}>
                      Get started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile menu backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenuOpen(false)}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      )}
    </>
  );
}
