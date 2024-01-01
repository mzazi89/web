import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#0a0a0f', borderTop: '1px solid #1e2d4a' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold" style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MZAZI TECH INC
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#64748b' }}>
              Kenya's trusted provider of game server hosting, WhatsApp automation bots, and cutting-edge technology solutions. Powering businesses 24/7.
            </p>
            <div className="flex space-x-3">
              <a href="https://t.me/mrsmzazixdbot" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#3b82f6', border: '1px solid rgba(37,99,235,0.3)' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                </svg>
              </a>
              <a href="https://wa.me/254" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#3b82f6', border: '1px solid rgba(37,99,235,0.3)' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: '#3b82f6' }}>Services</h3>
            <ul className="space-y-2">
              {[
                { href: '/products', label: 'Pterodactyl Panels' },
                { href: '/whatsapp-bot', label: 'WhatsApp Bot' },
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/wallet', label: 'Wallet' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-blue-400" style={{ color: '#64748b' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: '#3b82f6' }}>Company</h3>
            <ul className="space-y-2">
              {[
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
                { href: '/login', label: 'Login' },
                { href: '/signup', label: 'Sign Up' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-blue-400" style={{ color: '#64748b' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 flex flex-col md:flex-row justify-between items-center" style={{ borderTop: '1px solid #1e2d4a' }}>
          <p className="text-sm" style={{ color: '#475569' }}>
            © {new Date().getFullYear()} MZAZI TECH INC. All rights reserved.
          </p>
          <p className="text-sm mt-2 md:mt-0" style={{ color: '#475569' }}>
            Built with ❤️ in Kenya 🇰🇪
          </p>
        </div>
      </div>
    </footer>
  );
}
