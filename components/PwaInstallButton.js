'use client';
import { useEffect, useState } from 'react';
import { usePwa } from './PwaProvider';

// "Download App" button — only visible when the PWA is installable
// (native install available, or iOS where it shows the Add-to-Home-Screen hint).
export default function PwaInstallButton({ className = '' }) {
  const { canInstall, isIOS, isStandalone, requestInstall } = usePwa();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || isStandalone) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <button onClick={requestInstall}
      className={`btn btn-ghost inline-flex items-center gap-2 ${className}`}
      style={{ cursor: 'pointer' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {isIOS ? 'Get the App' : 'Download App'}
    </button>
  );
}
