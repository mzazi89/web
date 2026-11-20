import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import IntroSplash from '../components/IntroSplash';
import ChatWidget from '../components/ChatWidget';
import TechBackground from '../components/TechBackground';
import PwaProvider from '../components/PwaProvider';
import AdSenseScript from '../components/AdSenseScript';
import SiteFooter from '../components/SiteFooter';
import { ThemeProvider, THEME_BOOT_SCRIPT } from '../components/ui/ThemeProvider';
import { ToastProvider } from '../components/ui/Toast';
import './globals.css';

export const metadata = {
  metadataBase: new URL('https://www.mzazi.shop'),
  title: {
    default: 'MZAZI TECH INC — Innovate. Build. Grow.',
    template: '%s · MZAZI TECH INC',
  },
  description:
    'MZAZI TECH INC builds premium infrastructure for the modern internet: Pterodactyl panels, VPS hosting, WhatsApp automation and a 500-endpoint API marketplace. Innovate. Build. Grow.',
  keywords:
    'tech solutions, web development, whatsapp automation, whatsapp bot, mzazi tech, tech education, nairobi tech',
  applicationName: 'MZAZI TECH',
  // Who is behind the site, stated where Next turns it into <meta name="author">
  // and friends. The same facts are repeated visibly in the footer and in the
  // JSON-LD block below — crawlers read all three.
  authors: [{ name: 'Dominic Mokua Kerubo', url: 'https://www.mzazi.shop/about' }],
  creator: 'Dominic Mokua Kerubo',
  publisher: 'MZAZI TECH INC',
  category: 'technology',
  openGraph: {
    title: 'MZAZI TECH — Innovative Solutions & Automation',
    description:
      'Professional WhatsApp automation, custom web development, and tech education. Built for the modern digital era.',
    type: 'website',
    locale: 'en_US',
    url: 'https://www.mzazi.shop',
    siteName: 'MZAZI TECH',
    images: [{ url: 'https://www.mzazi.shop/icons/icon-512.png', width: 512, height: 512, alt: 'MZAZI TECH' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MZAZI TECH — Innovative Solutions & Automation',
    description: 'Professional automation and web development solutions.',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MZAZI TECH',
  },
  icons: {
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

// Ownership and contact details, stated in a form a machine can read.
//
// Google resolves `founder`, `owner` and `contactPoint` into the knowledge
// panel, which is why the number and the email are declared here and not only
// printed in the footer: visible text says it to a person, JSON-LD says it to a
// crawler. `@id`s are stable so the Person node can be referenced from /about
// without duplicating the facts in two places.
const FOUNDER_ID = 'https://www.mzazi.shop/#dominic-mokua-kerubo';
const ORG_ID = 'https://www.mzazi.shop/#organization';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: 'MZAZI TECH INC',
      alternateName: 'MZAZI TECH',
      url: 'https://www.mzazi.shop',
      logo: 'https://www.mzazi.shop/icon.png',
      image: 'https://www.mzazi.shop/icons/icon-512.png',
      description:
        'WhatsApp automation platform — connect your number, choose your bot (QUARTZ XD or MZAZI XMD) and start automating.',
      foundingLocation: { '@type': 'Place', name: 'Nairobi, Kenya' },
      email: 'mzazitechinc@gmail.com',
      telephone: '+254741388986',
      founder: { '@id': FOUNDER_ID },
      owner: { '@id': FOUNDER_ID },
      employee: { '@id': FOUNDER_ID },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          telephone: '+254741388986',
          email: 'mzazitechinc@gmail.com',
          url: 'https://wa.me/254741388986',
          areaServed: 'KE',
          availableLanguage: ['en', 'sw'],
        },
      ],
    },
    {
      '@type': 'Person',
      '@id': FOUNDER_ID,
      name: 'Dominic Mokua Kerubo',
      givenName: 'Dominic',
      additionalName: 'Mokua',
      familyName: 'Kerubo',
      jobTitle: 'Founder & Chief Executive Officer',
      description:
        'Founder and CEO of MZAZI TECH INC. BCOM student at the Cooperative University of Kenya, building WhatsApp automation and hosting platforms for African businesses.',
      image: 'https://www.mzazi.shop/images/dominic-mokua.webp',
      url: 'https://www.mzazi.shop/about',
      email: 'mzazitechinc@gmail.com',
      telephone: '+254741388986',
      worksFor: { '@id': ORG_ID },
      alumniOf: { '@type': 'CollegeOrUniversity', name: 'Cooperative University of Kenya' },
      knowsAbout: ['WhatsApp automation', 'Cloud hosting', 'Pterodactyl panels', 'API development'],
    },
  ],
};


export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F8FC' },
    { media: '(prefers-color-scheme: dark)', color: '#05070C' },
  ],
};

// MZAZI TECH — Perfected Layout.
// Removed unnecessary background layers and widgets for maximum performance.

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* AdSense ownership verification (in addition to /ads.txt) */}
        <meta name="google-adsense-account" content="ca-pub-6827095079937073" />
        {/* AdSense loader — auto ads are served from here site-wide. */}
        <AdSenseScript />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
        <ThemeProvider>
          <ToastProvider>
            <PwaProvider>
              <IntroSplash />
              <TechBackground />
              <a href="#main-content" className="skip-link">Skip to content</a>
              <Navbar />
              <main id="main-content" className="flex-grow app-content relative z-10">
                {children}
              </main>
              <SiteFooter />
              <BottomNav />
              <ChatWidget />
            </PwaProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
