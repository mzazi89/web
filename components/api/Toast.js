'use client';
import { createContext, useContext, useState, useCallback } from 'react';

// Lightweight toast notification system
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2" style={{ maxWidth: 340 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className="px-4 py-3 text-sm font-medium shadow-2xl"
            style={{
              backgroundColor: '#14181D',
              border: `1px solid ${t.type === 'error' ? 'rgba(229,72,77,0.45)' : 'rgba(62,207,142,0.45)'}`,
              color: t.type === 'error' ? '#E5484D' : '#3ECF8E',
              borderRadius: 4,
              boxShadow: '0 18px 44px rgba(0,0,0,0.5)',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
