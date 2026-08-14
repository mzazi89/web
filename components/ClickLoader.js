'use client';
import { useEffect, useRef, useState } from 'react';
import Logo from './Logo';

// Custom full-screen loading animation that appears for 5 seconds after every
// click (branded: glowing logo + rotating blue rings + progress bar).
// Visual-only (pointerEvents: none) so it never blocks the app.
export default function ClickLoader() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);
  const fadeRef = useRef(null);

  useEffect(() => {
    const show = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
      setLeaving(false);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setLeaving(true);
        fadeRef.current = setTimeout(() => setVisible(false), 450);
      }, 2000);
    };

    document.addEventListener('click', show);
    return () => {
      document.removeEventListener('click', show);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        backgroundColor: 'rgba(2,4,9,0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        pointerEvents: 'none',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.45s ease',
      }}
    >
      {/* Branded loader mark */}
      <div
        style={{
          position: 'relative',
          width: 116,
          height: 116,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* rotating rings */}
        <div className="loader-ring" style={{ inset: 0, borderTopColor: '#3b82f6', borderRightColor: 'rgba(59,130,246,0.25)', borderBottomColor: 'rgba(59,130,246,0.1)', borderLeftColor: 'rgba(59,130,246,0.1)', borderWidth: 3, animationDuration: '1.1s' }} />
        <div className="loader-ring loader-ring-rev" style={{ inset: 10, borderWidth: 2, borderTopColor: '#60a5fa', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent', animationDuration: '0.9s' }} />
        <Logo size={64} />
      </div>

      {/* Title */}
      <div className="text-2xl font-extrabold tracking-tight" style={{ background: 'linear-gradient(135deg,#60a5fa,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        MZAZI TECH
      </div>
      <div className="text-sm" style={{ color: '#94a3b8', letterSpacing: '0.35em', textTransform: 'uppercase' }}>
        Loading…
      </div>

      {/* 5-second progress bar */}
      <div style={{ width: 220, height: 4, borderRadius: 2, backgroundColor: '#1e3a8a', overflow: 'hidden', marginTop: 6 }}>
        <div className="loader-bar" style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #2563eb, #60a5fa)', boxShadow: '0 0 12px rgba(59,130,246,0.8)' }} />
      </div>
    </div>
  );
}
