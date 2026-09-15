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
    background_color: '#FBFBFD',
    theme_color: '#7C3AED',
    categories: ['productivity', 'utilities', 'business'],
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Dashboard', url: '/dashboard', icons: [{ src: '/icon', sizes: '512x512' }] },
      { name: 'Connected Devices', url: '/devices', icons: [{ src: '/icon', sizes: '512x512' }] },
      { name: 'Subscription', url: '/subscription', icons: [{ src: '/icon', sizes: '512x512' }] },
      { name: 'Help', url: '/help', icons: [{ src: '/icon', sizes: '512x512' }] },
    ],
  };
}
