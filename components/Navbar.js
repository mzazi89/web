'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setIsLoggedIn(true);
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">MZAZI TECH INC</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="hover:text-blue-200 transition">Home</Link>
            <Link href="/products" className="hover:text-blue-200 transition">Products</Link>
            <Link href="/about" className="hover:text-blue-200 transition">About Us</Link>
            <Link href="/contact" className="hover:text-blue-200 transition">Contact</Link>
            
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="hover:text-blue-200 transition">
                  Dashboard
                </Link>
                <span className="text-blue-200">{user?.fullname}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded transition"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <Link href="/" className="block py-2 hover:text-blue-200">Home</Link>
            <Link href="/products" className="block py-2 hover:text-blue-200">Products</Link>
            <Link href="/about" className="block py-2 hover:text-blue-200">About Us</Link>
            <Link href="/contact" className="block py-2 hover:text-blue-200">Contact</Link>
            
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="block py-2 hover:text-blue-200">Dashboard</Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-red-300 hover:text-red-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-y-2 mt-2">
                <Link
                  href="/login"
                  className="block text-center bg-white text-blue-600 px-4 py-2 rounded"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block text-center bg-green-500 px-4 py-2 rounded"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
