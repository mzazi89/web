import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TechBackground from '../components/TechBackground';
import PwaProvider from '../components/PwaProvider';
import ClickLoader from '../components/ClickLoader';
import AiChatWidget from '../components/AiChatWidget';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://www.mzazi.shop'),
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
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MZAZI TECH',
  },
  icons: {
    icon: [{ url: '/icon', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/apple-icon', sizes: '180x180' }],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MZAZI TECH INC',
  url: 'https://www.mzazi.shop',
  logo: 'https://www.mzazi.shop/icon',
  description: 'Kenya-born infrastructure company — Pterodactyl panel hosting, WhatsApp automation and developer APIs.',
  foundingLocation: { '@type': 'Place', name: 'Nairobi, Kenya' },
  sameAs: ['https://t.me/mzazitech', 'https://wa.me/254108595201'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0B0D0F" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="flex flex-col min-h-screen" style={{ backgroundColor: '#0B0D0F', color: '#E9E7E2' }}>
        <PwaProvider>
          {/* Accessibility: skip straight to content */}
          <a href="#main-content" className="skip-link">Skip to content</a>

          {/* Ambient background — sits behind everything */}
          <TechBackground />

          <Navbar />
          <main id="main-content" className="flex-grow" style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </main>
          <Footer />
        </PwaProvider>
        <ClickLoader />
        <AiChatWidget />
      </body>
    </html>
  );
}
