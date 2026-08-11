import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TechBackground from '../components/TechBackground';
import PwaRegister from '../components/PwaRegister';
import './globals.css';

export const metadata = {
  title: 'MZAZI TECH INC - Technology & Automation Solutions',
  description: 'Your trusted partner for WhatsApp bots, Pterodactyl panel hosting, and automation solutions in Kenya.',
  keywords: 'pterodactyl hosting, whatsapp bot, automation, kenya, game server',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MZAZI TECH',
  },
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="flex flex-col min-h-screen" style={{ backgroundColor: '#0a0a0f', color: '#f0f4ff' }}>
        {/* Fixed tech background — sits behind everything */}
        <TechBackground />

        <Navbar />
        <main className="flex-grow" style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>
        <Footer />

        {/* PWA install prompt (only when not installed) */}
        <PwaRegister />
      </body>
    </html>
  );
}
