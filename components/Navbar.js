'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuthStatus();
  }, [pathname]);

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
    } catch (error) {
      setIsLoggedIn(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await fetch('/api/wallet/balance');
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance);
      }
    } catch {}
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setUser(null);
    setWalletBalance(null);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Panels' },
    { href: '/whatsapp-bot', label: 'WhatsApp Bot' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
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

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: pathname === link.href ? '#3b82f6' : '#94a3b8',
                  backgroundColor: pathname === link.href ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/wallet"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37,99,235,0.3)', color: '#60a5fa' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>KSH {walletBalance !== null ? walletBalance.toLocaleString() : '...'}</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{ color: '#94a3b8' }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                    {user?.firstname ? user.firstname[0].toUpperCase() : user?.fullname?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm" style={{ color: '#f0f4ff' }}>{user?.firstname || user?.fullname?.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ color: '#94a3b8', border: '1px solid #1e2d4a' }}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg"
            style={{ color: '#94a3b8' }}
          >
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
              <Link
                key={link.href}
                href={link.href}
                className="block py-2.5 px-3 rounded-lg text-sm font-medium mb-1"
                style={{ color: pathname === link.href ? '#3b82f6' : '#94a3b8' }}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t" style={{ borderColor: '#1e2d4a' }}>
              {isLoggedIn ? (
                <>
                  <Link href="/wallet" className="block py-2.5 px-3 rounded-lg text-sm font-medium mb-1" style={{ color: '#60a5fa' }} onClick={() => setIsMenuOpen(false)}>
                    💳 Wallet: KSH {walletBalance !== null ? walletBalance.toLocaleString() : '...'}
                  </Link>
                  <Link href="/dashboard" className="block py-2.5 px-3 rounded-lg text-sm font-medium mb-1" style={{ color: '#94a3b8' }} onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium" style={{ color: '#f87171' }}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block py-2.5 px-3 rounded-lg text-sm font-medium mb-2" style={{ color: '#94a3b8' }} onClick={() => setIsMenuOpen(false)}>Login</Link>
                  <Link href="/signup" className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-center" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', borderRadius: '8px' }} onClick={() => setIsMenuOpen(false)}>Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
