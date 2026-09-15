'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import {
  AppBackground, Button, Field, Input, Alert, ThemeToggle, WizardSteps, Icons,
} from '@/components/ui';

// MZAZI TECH — password recovery.
// Same three-step flow and endpoints as v1, presented with the shared wizard
// component so the user always knows which step they are on.
//   1. GET  /api/auth/forgot?email=  → returns the stored security question
//   2. POST /api/auth/recover        → { email, answer, newPassword }

const STEPS = ['Your email', 'Security question', 'New password'];

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const lookupAccount = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/forgot?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'We could not find an account with that email.');
        return;
      }
      setQuestion(data.question || '');
      setStep(2);
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Those passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Your password needs to be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answer, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'That answer did not match. Please try again.');
        return;
      }
      setStep(3);
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <AppBackground variant="auth" image="/images/auth-bg.webp" imageOpacity={0.5} scrim={0.5} style={{ minHeight: 'calc(100vh - var(--nav-h))', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 16px' }}>
        <ThemeToggle />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px 48px' }}>
        <div style={{ width: '100%', maxWidth: 420 }} className="anim-fade-up">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Link href="/" aria-label="MZAZI TECH home" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <Logo size={44} />
            </Link>
            <h1 className="headline" style={{ fontSize: 'clamp(1.5rem, 5vw, 1.9rem)', marginTop: 20, marginBottom: 0 }}>
              {step === 1 && 'Forgot your password?'}
              {step === 2 && 'Answer your security question'}
              {step === 3 && 'Password reset'}
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14.5, color: 'var(--muted)' }}>
              {step === 1 && 'Enter your account email and we will look it up.'}
              {step === 2 && `Account: ${email}`}
              {step === 3 && 'You can now sign in with your new password.'}
            </p>
          </div>

          <div className="card card-pad">
            <WizardSteps steps={STEPS} current={step - 1} />

            {error && <Alert kind="error" style={{ marginBottom: 16 }}>{error}</Alert>}

            {step === 1 && (
              <form onSubmit={lookupAccount} noValidate>
                <Field label="Email address" id="fp-email">
                  <Input id="fp-email" type="email" required autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </Field>
                <Button type="submit" variant="primary" size="lg" block loading={loading}
                  loadingText="Checking…" disabled={!email}>
                  Continue
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={resetPassword} noValidate>
                <Alert kind="brand" style={{ marginBottom: 16 }}>
                  <strong style={{ display: 'block', fontWeight: 700, marginBottom: 3 }}>Your security question</strong>
                  {question || 'No security question is set for this account.'}
                </Alert>

                <Field label="Your answer" id="fp-answer">
                  <Input id="fp-answer" required value={answer}
                    onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer" />
                </Field>

                <Field label="New password" id="fp-new" hint="At least 6 characters.">
                  <Input id="fp-new" type="password" required autoComplete="new-password"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
                </Field>

                <Field label="Confirm new password" id="fp-new2"
                  error={passwordsMismatch ? 'Those passwords do not match.' : null}>
                  <Input id="fp-new2" type="password" required autoComplete="new-password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password" />
                </Field>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Button type="button" variant="ghost" onClick={() => { setStep(1); setError(''); }}
                    icon={<Icons.ArrowLeft size={16} />} style={{ flex: '1 1 auto' }}>
                    Back
                  </Button>
                  <Button type="submit" variant="primary" loading={loading} loadingText="Resetting…"
                    disabled={!answer || !newPassword || passwordsMismatch} style={{ flex: '1 1 auto' }}>
                    Reset password
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div>
                <div className="empty" style={{ padding: '18px 0 22px' }}>
                  <div className="empty-icon" style={{ background: 'var(--good-tint)', color: 'var(--good)' }} aria-hidden="true">
                    <Icons.CheckCircle size={28} />
                  </div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Your password was updated</p>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
                    Sign in with your new password to continue.
                  </p>
                </div>
                <Button href="/login" variant="primary" size="lg" block>Go to sign in</Button>
              </div>
            )}
          </div>

          {step !== 3 && (
            <p style={{ marginTop: 22, textAlign: 'center', fontSize: 14.5, color: 'var(--muted)' }}>
              Remembered it?{' '}
              <Link href="/login" style={{ fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </AppBackground>
  );
}
