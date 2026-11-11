// The marketplace page is a client component (cart, filters, modals), so its
// metadata lives here — Next only reads `metadata` from server modules.

export const metadata = {
  title: 'Premium Panels — Pterodactyl & hosting panels',
  description:
    'Managed Pterodactyl and hosting control panels from MZAZI TECH INC. Instant provisioning, full root access, wallet billing and 24/7 support from Nairobi.',
  alternates: { canonical: 'https://www.mzazi.shop/products' },
  openGraph: {
    title: 'Premium Panels · MZAZI TECH INC',
    description:
      'Powerful hosting management solutions — Pterodactyl and hosting panels, provisioned in minutes.',
    url: 'https://www.mzazi.shop/products',
    siteName: 'MZAZI TECH INC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Premium Panels · MZAZI TECH INC',
    description: 'Powerful hosting management solutions, provisioned in minutes.',
  },
};

export default function ProductsLayout({ children }) {
  return children;
}
