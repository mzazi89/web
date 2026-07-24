'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/',             label: 'Home' },
  { href: '/products',     label: 'Panels' },
  { href: '/whatsapp-bot', label: 'WhatsApp Bot' },
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

  // Scroll shadow
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
      {/* ── Nav bar ── */}
      <nav
        className="sticky top-0 z-50 transition-shadow duration-300"
        style={{
          backgroundColor: '#0a0a0f',
          borderBottom: '1px solid #1e2d4a',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0" style={{ textDecoration: 'none' }}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight"
                style={{ background: 'linear-gradient(135deg,#60a5fa,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MZAZI TECH
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(l => (
                <Link key={l.href} href={l.href}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    color: isActive(l.href) ? '#3b82f6' : '#94a3b8',
                    backgroundColor: isActive(l.href) ? 'rgba(37,99,235,0.1)' : 'transparent',
                  }}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Desktop right side */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Quick inquiry button */}
              {user && (
                <div className="relative" ref={chatRef}>
                  <button
                    onClick={() => { setChatOpen(o => !o); setChatSent(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ color: '#94a3b8', border: '1px solid #1e2d4a' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Support
                  </button>
                  {chatOpen && (
                    <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl overflow-hidden"
                      style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a', zIndex: 60 }}>
                      <div className="p-4 border-b" style={{ borderColor: '#1e2d4a' }}>
                        <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Quick Inquiry</p>
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>We reply within 2 hours</p>
                      </div>
                      {chatSent ? (
                        <div className="p-6 text-center">
                          <div className="text-3xl mb-2">✅</div>
                          <p className="font-semibold text-sm" style={{ color: '#4ade80' }}>Sent! We'll reply soon.</p>
                          <button onClick={() => setChatSent(false)} className="mt-3 text-xs" style={{ color: '#475569' }}>Send another</button>
                        </div>
                      ) : (
                        <form onSubmit={handleChatSubmit} className="p-4 space-y-3">
                          <input value={chatMsg.subject} onChange={e => setChatMsg(m => ({ ...m, subject: e.target.value }))}
                            placeholder="Subject" required
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }} />
                          <textarea value={chatMsg.message} onChange={e => setChatMsg(m => ({ ...m, message: e.target.value }))}
                            placeholder="Your message..." required rows={3}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                            style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }} />
                          <button type="submit" disabled={chatLoading}
                            className="w-full py-2 rounded-lg text-sm font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', opacity: chatLoading ? 0.7 : 1 }}>
                            {chatLoading ? 'Sending…' : 'Send Inquiry'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Wallet balance */}
              {user && walletBalance !== null && (
                <Link href="/wallet"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)', textDecoration: 'none' }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  KSH {parseFloat(walletBalance).toLocaleString()}
                </Link>
              )}

              {/* Auth buttons */}
              {user ? (
                <>
                  <Link href="/dashboard"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{ color: '#94a3b8', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }}>
                      {(user.firstname || user.email || 'U')[0].toUpperCase()}
                    </div>
                    {user.firstname || 'Account'}
                  </Link>
                  <button onClick={handleLogout}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ color: '#94a3b8', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
                    Login
                  </Link>
                  <Link href="/signup"
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile right: wallet + hamburger */}
            <div className="flex lg:hidden items-center gap-2">
              {user && walletBalance !== null && (
                <Link href="/wallet"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)', textDecoration: 'none' }}>
                  💳 KSH {parseFloat(walletBalance).toLocaleString()}
                </Link>
              )}
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg"
                style={{ border: '1px solid #1e2d4a' }}
                aria-label="Toggle menu"
              >
                <span className="block w-5 h-0.5 transition-all duration-300"
                  style={{ backgroundColor: '#94a3b8', transform: menuOpen ? 'translateY(6px) rotate(45deg)' : 'none' }} />
                <span className="block w-5 h-0.5 transition-all duration-300"
                  style={{ backgroundColor: '#94a3b8', opacity: menuOpen ? 0 : 1 }} />
                <span className="block w-5 h-0.5 transition-all duration-300"
                  style={{ backgroundColor: '#94a3b8', transform: menuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none' }} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile menu dropdown ── */}
        <div
          className="lg:hidden overflow-hidden transition-all duration-300"
          style={{
            maxHeight: menuOpen ? '600px' : '0',
            borderTop: menuOpen ? '1px solid #1e2d4a' : 'none',
          }}
        >
          <div className="px-4 py-4 space-y-1" style={{ backgroundColor: '#0a0a0f' }}>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  color: isActive(l.href) ? '#3b82f6' : '#94a3b8',
                  backgroundColor: isActive(l.href) ? 'rgba(37,99,235,0.1)' : 'transparent',
                }}>
                {l.label}
              </Link>
            ))}

            <div className="pt-3 border-t" style={{ borderColor: '#1e2d4a' }}>
              {user ? (
                <div className="space-y-2">
                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }}>
                      {(user.firstname || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>
                        {user.firstname ? `${user.firstname} ${user.lastname || ''}`.trim() : user.email}
                      </p>
                      <p className="text-xs" style={{ color: '#475569' }}>{user.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard"
                    className="flex items-center px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ color: '#94a3b8', backgroundColor: '#0f1629', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
                    📊 Dashboard
                  </Link>
                  <Link href="/wallet"
                    className="flex items-center px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ color: '#60a5fa', backgroundColor: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', textDecoration: 'none' }}>
                    💳 Wallet · KSH {walletBalance !== null ? parseFloat(walletBalance).toLocaleString() : '—'}
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ color: '#f87171', backgroundColor: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                    🚪 Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login"
                    className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold"
                    style={{ color: '#94a3b8', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
                    Log In
                  </Link>
                  <Link href="/signup"
                    className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
                    Get Started — Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenuOpen(false)}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      )}
    </>
  );
}
