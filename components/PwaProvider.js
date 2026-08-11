'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const PwaContext = createContext(null);

export function usePwa() {
  return useContext(PwaContext);
}

// PWA provider: captures the install prompt, registers the service worker,
// and exposes requestInstall(). The install card only appears when the
// browser actually allows installation (beforeinstallprompt fired) or on iOS
// (where the hint is the only option).
export default function PwaProvider({ children }) {
  const [deferred, setDeferred] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [noPrompt, setNoPrompt] = useState(false); // install event never fired
  const dismissedRef = useRef(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setNoPrompt(false);
      // show the card only when the browser says the app is installable
      if (!dismissedRef.current) setShowCard(true);
    };

    const onInstalled = () => {
      setDeferred(null);
      setShowCard(false);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // iOS: no beforeinstallprompt exists — show the Add-to-Home-Screen hint
    if (ios) {
      const t = setTimeout(() => {
        if (!dismissedRef.current) setShowCard(true);
      }, 2500);
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

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    setDismissed(true);
    setShowCard(false);
  }, []);

  const requestInstall = useCallback(async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice.catch(() => null);
        if (choice && choice.outcome === 'accepted') {
          setDeferred(null);
          setShowCard(false);
        }
        return;
      } catch {
        // prompt() was already used or the browser rejected it
      }
      setDeferred(null);
    }
    // No native install event available: show guidance instead of doing nothing
    setNoPrompt(true);
    setShowCard(true);
  }, [deferred]);

  const value = {
    canInstall: Boolean(deferred),
    isIOS,
    isStandalone,
    requestInstall,
  };

  return (
    <PwaContext.Provider value={value}>
      {children}

      {showCard && !dismissed && !isStandalone && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md">
          <div className="p-4 rounded-2xl shadow-2xl animate-fade-in" style={{ backgroundColor: '#0f1629', border: '1px solid rgba(37,99,235,0.4)' }}>
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-192.png" alt="MZAZI TECH" width={44} height={44}
                className="rounded-xl" style={{ display: 'block' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#f0f4ff' }}>
                  {noPrompt ? 'Install MZAZI TECH' : 'Install MZAZI TECH App'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                  {noPrompt
                    ? 'Tap the browser menu (⋮) and choose "Install app" or "Add to Home screen".'
                    : isIOS
                      ? 'Tap the Share button, then "Add to Home Screen" to install.'
                      : 'Add MZAZI to your home screen for faster access — no app store needed.'}
                </p>
              </div>
              <button onClick={dismiss} aria-label="Dismiss"
                className="text-sm flex-shrink-0" style={{ color: '#475569', cursor: 'pointer', background: 'none', border: 'none' }}>
                ✕
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              {!noPrompt && !isIOS && (
                <button onClick={requestInstall}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: 'pointer' }}>
                  Install App
                </button>
              )}
              <button onClick={dismiss}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ color: '#94a3b8', border: '1px solid #1e2d4a', cursor: 'pointer' }}>
                {noPrompt ? 'Got it' : 'Not now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}
