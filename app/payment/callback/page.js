'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// Loading component while Suspense resolves
function LoadingState() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center" style={{ background: '#0B0D0F' }}>
      <div className="text-center">
        <div className="spinner mx-auto mb-5" />
        <h2 className="display font-bold text-lg" style={{ color: '#E9E7E2' }}>Loading payment details…</h2>
        <p className="mono text-[11px] uppercase tracking-[0.14em] mt-2" style={{ color: '#4C535B' }}>Please wait</p>
      </div>
    </div>
  );
}

function CheckGlyph() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3ECF8E' }}>
      <circle cx="12" cy="12" r="10" />
      <path d="m8.5 12.5 2.5 2.5 5-6" />
    </svg>
  );
}

function CrossGlyph() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#E5484D' }}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

// Main component with useSearchParams
function PaymentCallbackContent() {
  const [status, setStatus] = useState('verifying');
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  useEffect(() => {
    if (reference) {
      verifyPayment();
    }
  }, [reference]);

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/payment/verify?reference=${reference}`);
      const data = await response.json();

      if (data.status) {
        setStatus('success');
        setCredentials(data.credentials);
      } else {
        setStatus('failed');
        setError(data.message || 'Payment verification failed');
      }
    } catch (error) {
      setStatus('error');
      setError('An error occurred while verifying payment');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center" style={{ background: '#0B0D0F' }}>
        <div className="text-center">
          <div className="spinner mx-auto mb-5" />
          <h2 className="display font-bold text-lg" style={{ color: '#E9E7E2' }}>Verifying payment…</h2>
          <p className="mono text-[11px] uppercase tracking-[0.14em] mt-2" style={{ color: '#4C535B' }}>Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  if (status === 'success' && credentials) {
    const copy = async (text) => {
      try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
    };
    return (
      <div style={{ background: 'rgba(15,18,21,0.35)', minHeight: '80vh', padding: '64px 0 110px' }}>
        <div className="container-site max-w-2xl">
          <div className="card card-pad" style={{ borderColor: 'rgba(62,207,142,0.4)' }}>
            <div className="text-center mb-10">
              <CheckGlyph />
              <h1 className="headline mt-5" style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.4rem)' }}>
                Payment successful<span className="accent">.</span>
              </h1>
              <p className="text-sm mt-3" style={{ color: '#79818A' }}>
                Your Pterodactyl panel has been provisioned
              </p>
            </div>

            <div className="card overflow-hidden mb-8" style={{ background: '#0F1215' }}>
              <p className="mono text-[10px] uppercase tracking-[0.18em] px-5 py-3" style={{ color: '#F2A93B', borderBottom: '1px solid #1B2026' }}>
                Your panel credentials
              </p>
              <div>
                {[
                  { label: 'Panel link', value: credentials.panel_link, copyable: true },
                  { label: 'Username', value: credentials.username, copyable: true },
                  { label: 'Password', value: credentials.password, copyable: true },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid #1B2026' }}>
                    <div className="min-w-0">
                      <p className="mono text-[9px] uppercase tracking-[0.14em] mb-1" style={{ color: '#4C535B' }}>{r.label}</p>
                      <p className="mono text-sm break-all" style={{ color: '#4C7DFC' }}>{r.value}</p>
                    </div>
                    {r.copyable && (
                      <button
                        onClick={() => copy(r.value)}
                        className="mono text-[10px] uppercase tracking-[0.1em] px-2.5 py-1.5 flex-shrink-0"
                        style={{ color: '#F2A93B', border: '1px solid rgba(242,169,59,0.35)', background: 'transparent', cursor: 'pointer' }}>
                        Copy
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 text-xs mb-8 flex items-start gap-3"
              style={{ background: 'rgba(229,72,77,0.06)', border: '1px solid rgba(229,72,77,0.25)' }}>
              <span className="mono flex-shrink-0" style={{ color: '#E5484D' }}>SAVE</span>
              <span style={{ color: '#AEB5BD' }}>
                Please save these credentials securely. For security reasons, the password will not be displayed again.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => window.open(credentials.panel_link, '_blank')}
                className="btn btn-primary flex-1" style={{ cursor: 'pointer' }}>
                Go to panel
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="btn btn-ghost flex-1" style={{ cursor: 'pointer' }}>
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed' || status === 'error') {
    return (
      <div style={{ background: 'rgba(15,18,21,0.35)', minHeight: '80vh', padding: '64px 0 110px' }}>
        <div className="container-site max-w-2xl">
          <div className="card card-pad text-center" style={{ borderColor: 'rgba(229,72,77,0.35)' }}>
            <CrossGlyph />
            <h1 className="headline mt-5 mb-4" style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.4rem)' }}>
              Payment failed<span className="accent">.</span>
            </h1>
            <p className="text-sm mb-8" style={{ color: '#AEB5BD' }}>{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/products'}
                className="btn btn-primary" style={{ cursor: 'pointer' }}>
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/contact'}
                className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                Contact support
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Main export wrapped in Suspense
export default function PaymentCallback() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
