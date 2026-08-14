import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TechBackground from '../components/TechBackground';
import PwaProvider from '../components/PwaProvider';
import ClickLoader from '../components/ClickLoader';
import './globals.css';

export const metadata = {
  title: 'MZAZI TECH INC - Technology & Automation Solutions',
  description: 'Your trusted partner for WhatsApp bots, Pterodactyl panel hosting, and automation solutions — worldwide.',
  keywords: 'pterodactyl hosting, whatsapp bot, automation, kenya, game server',
  openGraph: {
    title: 'MZAZI TECH INC - Technology & Automation Solutions',
    description: 'Game panels, WhatsApp bots, wallet and the MZAZI API platform — deploy in under 2 minutes.',
    type: 'website',
    locale: 'en_US',
    url: 'https://www.mzazi.shop',
    siteName: 'MZAZI TECH',
    images: [{ url: 'https://www.mzazi.shop/icons/icon-512.png', width: 512, height: 512, alt: 'MZAZI TECH' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MZAZI TECH INC',
    description: 'Game panels, WhatsApp bots and the MZAZI API platform.',
    images: ['https://www.mzazi.shop/icons/icon-512.png'],
  },
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
        <meta name="theme-color" content="#020409" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="flex flex-col min-h-screen" style={{ backgroundColor: 'rgba(2,4,9,0.45)', color: '#f0f4ff' }}>
        <PwaProvider>
          {/* Fixed tech background — sits behind everything */}
          <TechBackground />

          <Navbar />
          <main className="flex-grow" style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </main>
          <Footer />
        </PwaProvider>
        <ClickLoader />
      </body>
    </html>
  );
}
