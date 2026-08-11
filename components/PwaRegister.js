'use client';
import { useEffect, useState } from 'react';

// PWA: registers the service worker and shows an install prompt
// ONLY when the app is not already installed.
export default function PwaRegister() {
  const [deferred, setDeferred] = useState(null); // beforeinstallprompt event
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // already running as an installed app (standalone / fullscreen)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true; // iOS Safari
    if (isStandalone) return;

    // iOS Safari: no beforeinstallprompt — show a hint instead
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };

    const onInstalled = () => {
      setShow(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    // if supported but the event already fired before we mounted
    if (window.matchMedia('(display-mode: browser)').matches) {
      // nothing to do — event will fire on its own
    }

    // Register the service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // iOS fallback: show hint after a short delay if still in browser mode
    if (ios) {
      const t = setTimeout(() => setShow(true), 2500);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onPrompt);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!show || dismissed) return null;

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      const choice = await deferred.userChoice.catch(() => null);
      if (choice && choice.outcome === 'accepted') setShow(false);
      setDeferred(null);
    }
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md">
      <div className="p-4 rounded-2xl shadow-2xl animate-fade-in"
        style={{ backgroundColor: '#0f1629', border: '1px solid rgba(37,99,235,0.4)' }}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="MZAZI TECH" width={44} height={44}
              className="rounded-xl" style={{ display: 'block' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: '#f0f4ff' }}>Install MZAZI TECH App</p>
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
              {isIOS
                ? 'Tap the Share button, then "Add to Home Screen" to install.'
                : 'Add MZAZI to your home screen for faster access — no app store needed.'}
            </p>
          </div>
          <button onClick={() => setDismissed(true)} aria-label="Dismiss"
            className="text-sm flex-shrink-0" style={{ color: '#475569', cursor: 'pointer', background: 'none', border: 'none' }}>
            ✕
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {!isIOS && (
            <button onClick={install}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: 'pointer' }}>
              Install App
            </button>
          )}
          <button onClick={() => setDismissed(true)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ color: '#94a3b8', border: '1px solid #1e2d4a', cursor: 'pointer' }}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
