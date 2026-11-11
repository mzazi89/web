// The marketplace page is a client component (cart, filters, modals), so its
// metadata lives here — Next only reads `metadata` from server modules.

export const metadata = {
  title: 'Catalogue — panels, VPS, WhatsApp bots & API',
  description:
    'Everything MZAZI TECH INC sells: managed Pterodactyl panels, VPS hosting, WhatsApp bot plans and the developer API. Wallet billing, instant provisioning, support from Nairobi.',
  alternates: { canonical: 'https://www.mzazi.shop/products' },
  openGraph: {
    title: 'The catalogue · MZAZI TECH INC',
    description:
      'Panels, VPS, WhatsApp bots and the API — sold from one account.',
    url: 'https://www.mzazi.shop/products',
    siteName: 'MZAZI TECH INC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The catalogue · MZAZI TECH INC',
    description: 'Panels, VPS, WhatsApp bots and the API — sold from one account.',
  },
};

export default function ProductsLayout({ children }) {
  return children;
}
