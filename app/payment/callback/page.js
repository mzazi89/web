'use client';

// MZAZI TECH — Payment callback.
//
// Where Paystack sends the customer back after a panel purchase. One verify
// call (unchanged: GET /api/payment/verify?reference=…) and three calm states:
// pending, success and failure — never a raw error.
//
//   GET /api/payment/verify?reference=<ref>
//     success → { status: true, credentials: { username, password, panel_link } }
//     failure → { status: false, message } | HTTP error { error }

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AppBackground, Button, Card, CardHeader, Alert, humaniseError, Icons,
} from '@/components/ui';

function PaymentCallbackContent() {
  const [status, setStatus] = useState('pending'); // pending | success | failed
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  useEffect(() => {
    if (reference) verifyPayment();
    else setStatus('pending');
  }, [reference]);

  const verifyPayment = async () => {
    setStatus('pending');
    setError('');
    try {
      const response = await fetch(`/api/payment/verify?reference=${reference}`);
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.status) {
        setCredentials(data.credentials || null);
        setStatus('success');
      } else {
        setError(humaniseError(data.message || data.error || 'We could not confirm this payment.', 'We could not confirm this payment.'));
        setStatus('failed');
      }
    } catch (e) {
      setError(humaniseError(e));
      setStatus('failed');
    }
  };

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <AppBackground variant="dashboard">
      <div className="container-site" style={{ paddingTop: 56, paddingBottom: 100, maxWidth: 640 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Card className="anim-fade-up" style={{ width: '100%' }}>
            {/* ── Pending ── */}
            {status === 'pending' && (
              <div style={{ textAlign: 'center', padding: '12px 0' }} role="status" aria-live="polite">
                <span className="spinner" style={{ margin: '0 auto 18px' }} />
                <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>
                  Confirming your payment…
                </h1>
                <p style={{ margin: '10px 0 0', color: 'var(--muted)', lineHeight: 1.7 }}>
                  {reference
                    ? 'Please wait a moment while we check with the payment provider. Don’t close this page.'
                    : 'We don’t have a payment reference to check yet. If you just paid, give it a moment and refresh.'}
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
                  {reference && <Button onClick={verifyPayment} icon={<Icons.Refresh size={16} />}>Check again</Button>}
                  <Button variant="ghost" href="/wallet">Go to wallet</Button>
                </div>
              </div>
            )}

            {/* ── Success ── */}
            {status === 'success' && (
              <div className="anim-fade-up">
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  <span style={{ display: 'inline-flex', color: 'var(--good)' }} aria-hidden="true"><Icons.CheckCircle size={54} /></span>
                  <h1 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>
                    ✓ Payment successful
                  </h1>
                  <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>Your payment was received and your order is ready.</p>
                </div>

                {credentials && (
                  <Card pad={false} style={{ background: 'var(--surface-2)', marginBottom: 18, overflow: 'hidden' }}>
                    <CardHeader
                      title="Your credentials"
                      description="Save these somewhere safe — the password is not shown again."
                      icon={<Icons.Shield size={18} />}
                      style={{ padding: '16px 16px 0' }}
                    />
                    <div style={{ padding: '0 16px 16px' }}>
                      {[
                        { label: 'Panel link', value: credentials.panel_link, key: 'link', href: credentials.panel_link },
                        { label: 'Username', value: credentials.username, key: 'user' },
                        { label: 'Password', value: credentials.password, key: 'pass' },
                      ].filter((r) => r.value).map((r) => (
                        <div
                          key={r.key}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <p className="stat-label" style={{ marginBottom: 2 }}>{r.label}</p>
                            <p className="mono" style={{ margin: 0, color: 'var(--blue)', wordBreak: 'break-all' }}>{r.value}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            {r.href && (
                              <Button size="sm" variant="dark" href={r.href}>Open</Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => copy(r.value, r.key)} icon={copied === r.key ? <Icons.Check size={14} /> : <Icons.Copy size={14} />} aria-label={`Copy ${r.label}`}>
                              {copied === r.key ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <div style={{ marginBottom: 18 }}>
                  <Alert kind="warn" title="Keep these safe">
                    For security, the password will not be displayed again. Store it in a password manager.
                  </Alert>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {credentials?.panel_link && (
                    <Button href={credentials.panel_link} icon={<Icons.ExternalLink size={16} />}>Go to panel</Button>
                  )}
                  <Button variant="ghost" href="/dashboard" icon={<Icons.Dashboard size={16} />}>Go to dashboard</Button>
                </div>
              </div>
            )}

            {/* ── Failed ── */}
            {status === 'failed' && (
              <div className="anim-fade-up" style={{ textAlign: 'center', padding: '12px 0' }} role="alert">
                <span style={{ display: 'inline-flex', color: 'var(--bad)' }} aria-hidden="true"><Icons.AlertCircle size={54} /></span>
                <h1 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>
                  ✕ Payment failed
                </h1>
                <p style={{ margin: '8px 0 0', color: 'var(--ink-2)' }}>Your payment was not completed.</p>
                <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>{error}</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
                  <Button onClick={verifyPayment} icon={<Icons.Refresh size={16} />}>Try again</Button>
                  <Button variant="ghost" href="/products">Back to products</Button>
                  <Button variant="ghost" href="/contact">Contact support</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppBackground>
  );
}

export default function PaymentCallback() {
  return (
    <Suspense fallback={
      <AppBackground variant="dashboard">
        <div className="container-site" style={{ paddingTop: 56, paddingBottom: 100, maxWidth: 640 }}>
          <Card>
            <div className="empty" role="status" aria-live="polite">
              <span className="spinner" />
              <p style={{ margin: 0, color: 'var(--muted)' }}>Loading payment details…</p>
            </div>
          </Card>
        </div>
      </AppBackground>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
