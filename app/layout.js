import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TechBackground from '../components/TechBackground';
import RouteBackdrop from '../components/ui/RouteBackdrop';
import PwaProvider from '../components/PwaProvider';
import ClickLoader from '../components/ClickLoader';
import AiChatWidget from '../components/AiChatWidget';
import { ThemeProvider, THEME_BOOT_SCRIPT } from '../components/ui/ThemeProvider';
import { ToastProvider } from '../components/ui/Toast';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://www.mzazi.shop'),
  title: {
    default: 'MZAZI TECH — WhatsApp automation made simple',
    template: '%s · MZAZI TECH',
  },
  description:
    'Connect your WhatsApp, choose your bot and start automating. QUARTZ XD and MZAZI XMD with instant pairing codes, device management, subscriptions and quick Paystack payments.',
  keywords:
    'whatsapp automation, whatsapp bot, QUARTZ XD, MZAZI XMD, whatsapp pairing code, mzazi tech, bot subscription',
  applicationName: 'MZAZI TECH',
  openGraph: {
    title: 'MZAZI TECH — WhatsApp automation made simple',
    description:
      'Connect your WhatsApp. Choose your bot. Start automating. QUARTZ XD and MZAZI XMD — pairing in under a minute.',
    type: 'website',
    locale: 'en_US',
    url: 'https://www.mzazi.shop',
    siteName: 'MZAZI TECH',
    images: [{ url: 'https://www.mzazi.shop/icons/icon-512.png', width: 512, height: 512, alt: 'MZAZI TECH' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MZAZI TECH — WhatsApp automation made simple',
    description: 'Connect your WhatsApp. Choose your bot. Start automating.',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MZAZI TECH',
  },
  icons: {
    icon: [{ url: '/icon', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/apple-icon', sizes: '180x180' }],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MZAZI TECH INC',
  url: 'https://www.mzazi.shop',
  logo: 'https://www.mzazi.shop/icon',
  description:
    'WhatsApp automation platform — connect your number, choose your bot (QUARTZ XD or MZAZI XMD) and start automating.',
  foundingLocation: { '@type': 'Place', name: 'Nairobi, Kenya' },
  sameAs: ['https://t.me/mzazitech', 'https://wa.me/254108595201'],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // Zoom stays enabled for accessibility; the layout is built so it is not needed.
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBFBFD' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0F' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Applies the saved theme before first paint — no flash of the wrong mode. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="flex flex-col min-h-screen">
        <ThemeProvider>
          <ToastProvider>
            <PwaProvider>
              {/* Accessibility: skip straight to content */}
              <a href="#main-content" className="skip-link">Skip to content</a>

              {/* Ambient brand background — sits behind every page */}
              <TechBackground />

              {/* Wallpaper/photo that matches the current page */}
              <RouteBackdrop />

              <Navbar />

              <main id="main-content" className="flex-grow app-content">
                {children}
              </main>

              <Footer />
            </PwaProvider>
            <ClickLoader />
            <AiChatWidget />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
