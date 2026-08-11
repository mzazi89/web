'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const PwaContext = createContext(null);

export function usePwa() {
  return useContext(PwaContext);
}

// PWA provider: captures the install prompt, registers the service worker,
// and exposes requestInstall() so any button can trigger installation.
// Shows the floating install card when not installed.
export default function PwaProvider({ children }) {
  const [deferred, setDeferred] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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

    // Auto-show the prompt card after a moment (unless already dismissed)
    if (!ios) {
      const t = setTimeout(() => {
        setShowCard(prev => {
          const show = prev; // keep any earlier manual state
          return show;
        });
        // only auto-show if nothing dismissed and event available or may still come
        if (!dismissed) setShowCard(true);
      }, 3000);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onPrompt);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }
    // iOS: hint card after a delay
    const t = setTimeout(() => { if (!dismissed) setShowCard(true); }, 2500);
    return () => {
      clearTimeout(t);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [dismissed]);

  const requestInstall = useCallback(async () => {
    if (deferred) {
      try {
        deferred.prompt();
        const choice = await deferred.userChoice.catch(() => null);
        if (choice && choice.outcome === 'accepted') {
          setDeferred(null);
          setShowCard(false);
        }
        return;
      } catch {
        // prompt already used — fall through to showing guidance
      }
      setDeferred(null);
    }
    // iOS or no native prompt: show the hint card
    setShowCard(true);
  }, [deferred]);

  const value = { canInstall: Boolean(deferred), isIOS, isStandalone, requestInstall, openCard: () => setShowCard(true) };

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
                <button onClick={requestInstall}
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
      )}
    </PwaContext.Provider>
  );
}
