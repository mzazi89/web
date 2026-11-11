'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { AppBackground } from '@/components/ui';

// MZAZI TECH — chrome shared by /login, /signup and the recovery screens.
//
// Extracted so the auth pages cannot drift apart: same background, same logo
// lockup, same vertical rhythm, same theme toggle. Each page supplies only its
// headline, its card and its footer links.

export default function AuthShell({
  title,
  subtitle,
  maxWidth = 400,
  children,
  footer = null,
}) {
  return (
    <AppBackground
      variant="auth"
      style={{ minHeight: 'calc(100vh - var(--nav-h))', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 20px 24px' }}>
        <div style={{ width: '100%', maxWidth }} className="anim-fade-up">
          <div style={{ textAlign: 'center', marginBottom: 19 }}>
            <Link href="/" aria-label="MZAZI TECH home" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <Logo size={44} />
            </Link>
            <h1 className="headline" style={{ fontSize: 'clamp(1.6rem, 5vw, 2rem)', marginTop: 20, marginBottom: 0 }}>
              {title}
            </h1>
            {subtitle ? (
              <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>{subtitle}</p>
            ) : null}
          </div>

          {children}

          {footer}
        </div>
      </div>
    </AppBackground>
  );
}
