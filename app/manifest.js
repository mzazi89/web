// PWA manifest — served at /manifest.webmanifest
export default function manifest() {
  return {
    name: 'MZAZI TECH — Panels, Bots & API',
    short_name: 'MZAZI',
    description: 'Pterodactyl panel hosting, WhatsApp automation, wallet and the MZAZI API platform — one account for everything.',
    id: 'mzazi-tech',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B0D0F',
    theme_color: '#0B0D0F',
    categories: ['productivity', 'utilities', 'business'],
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Deploy Panel', url: '/products', icons: [{ src: '/icon', sizes: '512x512' }] },
      { name: 'WhatsApp Bot', url: '/whatsapp-bot', icons: [{ src: '/icon', sizes: '512x512' }] },
      { name: 'Wallet', url: '/wallet', icons: [{ src: '/icon', sizes: '512x512' }] },
      { name: 'API Docs', url: '/api/docs', icons: [{ src: '/icon', sizes: '512x512' }] },
    ],
  };
}
