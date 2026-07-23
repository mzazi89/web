'use client';
import { usePathname } from 'next/navigation';

// Different tech/computer images per route
const PAGE_BACKGROUNDS = {
  '/': {
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=70',
    label: 'circuit board',
  },
  '/products': {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=70',
    label: 'server rack',
  },
  '/about': {
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=70',
    label: 'retro computer screens',
  },
  '/contact': {
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1920&q=70',
    label: 'mechanical keyboard',
  },
  '/whatsapp-bot': {
    url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1920&q=70',
    label: 'blue neon tech',
  },
  '/dashboard': {
    url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1920&q=70',
    label: 'data analytics dashboard',
  },
  '/wallet': {
    url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1920&q=70',
    label: 'digital payment tech',
  },
  '/login': {
    url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1920&q=70',
    label: 'code on screen',
  },
  '/signup': {
    url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1920&q=70',
    label: 'code on screen',
  },
};

const DEFAULT_BG = {
  url: 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=1920&q=70',
  label: 'dark circuit board',
};

export default function TechBackground() {
  const pathname = usePathname();

  // Match exact path first, then prefix match
  const bg =
    PAGE_BACKGROUNDS[pathname] ||
    Object.entries(PAGE_BACKGROUNDS).find(([k]) => pathname.startsWith(k) && k !== '/')?.[1] ||
    DEFAULT_BG;

  return (
    <>
      {/* Tech photo layer */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: `url('${bg.url}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.09,
          transition: 'background-image 0.6s ease',
        }}
      />

      {/* Blue grid scanline overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Vignette — darkens edges so text stays readable */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(10,10,15,0.75) 100%)',
        }}
      />
    </>
  );
}
