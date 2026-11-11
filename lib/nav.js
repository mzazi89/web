// MZAZI TECH — the site's directory, defined once.
//
// The navbar, the mobile drawer and the footer all read from this file, so a
// new page is added in one place instead of three. That was the actual bug
// behind "some pages are missing from the navigation": the lists had drifted.
//
// Anything a customer can usefully land on belongs here. Deliberately absent:
// /login, /signup and /forgot-password (they are the door, not a destination),
// /payment/callback (a provider redirect), and the /dashboard/* screens, which
// have their own sidebar.

export const PRIMARY = [
  { href: '/',          label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/devices',   label: 'Devices' },
  { href: '/community', label: 'Community' },
  { href: '/about',     label: 'About' },
];

export const NAV_GROUPS = [
  {
    title: 'Your account',
    links: [
      { href: '/wallet',       label: 'Wallet',       desc: 'Balance & top-ups' },
      { href: '/payments',     label: 'Payments',     desc: 'Receipts & history' },
      { href: '/subscription', label: 'Subscription', desc: 'Plans & renewal' },
      { href: '/account',      label: 'Account',      desc: 'Profile & security' },
    ],
  },
  {
    title: 'WhatsApp bots',
    links: [
      { href: '/whatsapp-bot', label: 'Bot guides',     desc: 'Features & commands' },
      { href: '/pair/quartz',  label: 'Pair QUARTZ XD', desc: 'Everyday automation' },
      { href: '/pair/mzazi',   label: 'Pair MZAZI XMD', desc: 'Advanced workflows' },
    ],
  },
  {
    title: 'Hosting',
    links: [
      { href: '/products', label: 'Panel hosting', desc: 'Pterodactyl panels' },
      { href: '/vps',      label: 'VPS servers',   desc: 'Cloud infrastructure' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { href: '/api',           label: 'API platform', desc: 'Bots, SMS, payments' },
      { href: '/api/docs',      label: 'API docs',     desc: 'Reference & examples' },
      { href: '/api/explorer',  label: 'API explorer', desc: 'Send a live request' },
      { href: '/api/status',    label: 'API status',   desc: 'Uptime & incidents' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { href: '/temp-number', label: 'Temporary numbers', desc: 'Verification numbers' },
      { href: '/ludo',        label: 'Ludo',              desc: 'Play in WhatsApp' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/testimonials', label: 'Testimonials', desc: 'What customers say' },
      { href: '/help',         label: 'Help centre',  desc: 'Guides & answers' },
      { href: '/contact',      label: 'Contact',      desc: 'Talk to a human' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms',   label: 'Terms of service', desc: 'The agreement' },
      { href: '/privacy', label: 'Privacy policy',   desc: 'What we hold — and what we never see' },
    ],
  },
];

/** Flat list, for the drawer and for anything that just needs every link. */
export const ALL_LINKS = [...PRIMARY, ...NAV_GROUPS.flatMap((g) => g.links)];

/** The two documents that must be reachable from every page. */
export const LEGAL = [
  { href: '/terms',   label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
];

export function isActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
