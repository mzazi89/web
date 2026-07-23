'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState({ subject: '', message: '' });
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSent, setChatSent] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { checkAuthStatus(); }, [pathname]);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setIsLoggedIn(true);
        setUser(data.user);
        fetchWalletBalance();
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch { setIsLoggedIn(false); }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await fetch('/api/wallet/balance');
      if (res.ok) { const d = await res.json(); setWalletBalance(d.balance); }
    } catch {}
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false); setUser(null); setWalletBalance(null);
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

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Panels' },
    { href: '/whatsapp-bot', label: 'WhatsApp Bot' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <nav style={{ backgroundColor: '#0a0a0f', borderBottom: '1px solid #1e2d4a' }} className="sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold" style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MZAZI TECH
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{ color: pathname === link.href ? '#3b82f6' : '#94a3b8', backgroundColor: pathname === link.href ? 'rgba(37,99,235,0.1)' : 'transparent' }}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Area */}
            <div className="hidden md:flex items-center space-x-3">
              {isLoggedIn ? (
                <>
                  <Link href="/wallet" className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', color: '#60a5fa' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>KSH {walletBalance !== null ? parseFloat(walletBalance).toLocaleString() : '...'}</span>
                  </Link>
                  <Link href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: 'rgba(37,99,235,0.08)', color: '#94a3b8', border: '1px solid #1e2d4a' }}>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', backgroundColor: 'rgba(248,113,113,0.05)' }}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: '#94a3b8' }}>Login</Link>
                  <Link href="/signup" className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 0 20px rgba(37,99,235,0.3)' }}>
                    Get Started
                  </Link>
                </>
              )}

              {/* Admin Button */}
              <Link href="/admin/login"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Admin</span>
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg" style={{ color: '#94a3b8' }}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 pt-2 border-t" style={{ borderColor: '#1e2d4a' }}>
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className="block py-2.5 px-3 rounded-lg text-sm font-medium mb-1"
                  style={{ color: pathname === link.href ? '#3b82f6' : '#94a3b8' }}
                  onClick={() => setIsMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 pt-3 border-t" style={{ borderColor: '#1e2d4a' }}>
                {isLoggedIn ? (
                  <>
                    <Link href="/wallet" className="block py-2.5 px-3 rounded-lg text-sm font-medium mb-1" style={{ color: '#60a5fa' }} onClick={() => setIsMenuOpen(false)}>
                      💳 Wallet: KSH {walletBalance !== null ? parseFloat(walletBalance).toLocaleString() : '...'}
                    </Link>
                    <Link href="/dashboard" className="block py-2.5 px-3 rounded-lg text-sm font-medium mb-1" style={{ color: '#94a3b8' }} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                    <button onClick={handleLogout} className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium" style={{ color: '#f87171' }}>Logout</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block py-2.5 px-3 rounded-lg text-sm font-medium mb-2" style={{ color: '#94a3b8' }} onClick={() => setIsMenuOpen(false)}>Login</Link>
                    <Link href="/signup" className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-center" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', borderRadius: '8px' }} onClick={() => setIsMenuOpen(false)}>Get Started</Link>
                  </>
                )}
                <Link href="/admin/login" className="flex items-center space-x-2 mt-2 py-2.5 px-3 rounded-lg text-sm font-semibold" style={{ color: '#f87171', backgroundColor: 'rgba(239,68,68,0.08)' }} onClick={() => setIsMenuOpen(false)}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Admin Panel</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Floating Chat Button (visible to logged-in users only) ── */}
      {isLoggedIn && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
          {chatOpen && (
            <div className="rounded-2xl p-5 shadow-2xl w-80" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>Message Admin</span>
                </div>
                <button onClick={() => { setChatOpen(false); setChatSent(false); }} style={{ color: '#64748b' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {chatSent ? (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>Message Sent!</p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>Admin will get back to you soon.</p>
                  <button onClick={() => setChatSent(false)} className="mt-4 text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#1e2d4a', color: '#94a3b8' }}>
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleChatSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#64748b' }}>Subject</label>
                    <input type="text" required value={chatMsg.subject}
                      onChange={e => setChatMsg(m => ({ ...m, subject: e.target.value }))}
                      placeholder="e.g. Payment issue, Panel help..."
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#64748b' }}>Message</label>
                    <textarea required rows={3} value={chatMsg.message}
                      onChange={e => setChatMsg(m => ({ ...m, message: e.target.value }))}
                      placeholder="Describe your issue or question..."
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                      style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }} />
                  </div>
                  <button type="submit" disabled={chatLoading}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: chatLoading ? '#1e2d4a' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', cursor: chatLoading ? 'not-allowed' : 'pointer' }}>
                    {chatLoading ? 'Sending...' : 'Send to Admin'}
                  </button>
                </form>
              )}
            </div>
          )}
          <button
            onClick={() => { setChatOpen(o => !o); setChatSent(false); }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 0 30px rgba(37,99,235,0.5)' }}
            title="Message Admin">
            {chatOpen
              ? <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              : <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            }
          </button>
        </div>
      )}
    </>
  );
}
