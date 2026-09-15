'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { AppBackground, Button, Field, Input, Select, Alert, ThemeToggle, Icons } from '@/components/ui';

// MZAZI TECH — create an account.
// Same endpoint, same payload, same redirects as v1. Grouped into two clearly
// labelled blocks (your details / account recovery) so neither feels long.

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  'What was the name of your first pet?',
  'What city were you born in?',
  'What was the name of your primary school?',
  'What is your favourite food?',
];

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const router = useRouter();

  // Already signed in? No need to register.
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => { if (r.ok) router.replace('/dashboard'); })
      .catch(() => {});
  }, [router]);

  // ?ref=CODE from a referral link.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get('ref') || '').trim();
    if (ref) setReferralCode(ref);
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Those passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Your password needs to be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password,
          referral_code: referralCode || undefined,
          securityQuestion: formData.securityQuestion,
          securityAnswer: formData.securityAnswer,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setSuccess('Account created. Taking you to sign in…');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        setError(data.error || 'We could not create your account. Please try again.');
      }
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMismatch =
    formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  return (
    <AppBackground variant="auth" image="/images/auth-bg.webp" imageOpacity={0.5} scrim={0.5} style={{ minHeight: 'calc(100vh - var(--nav-h))', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 16px' }}>
        <ThemeToggle />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px 48px' }}>
        <div style={{ width: '100%', maxWidth: 440 }} className="anim-fade-up">
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <Link href="/" aria-label="MZAZI TECH home" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <Logo size={44} />
            </Link>
            <h1 className="headline" style={{ fontSize: 'clamp(1.6rem, 5vw, 2rem)', marginTop: 20, marginBottom: 0 }}>
              Create your account
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14.5, color: 'var(--muted)' }}>
              Free to start — connect your first number in about two minutes.
            </p>
          </div>

          <div className="card card-pad">
            {referralCode && (
              <Alert kind="brand" style={{ marginBottom: 16 }}>
                Referral code <strong>{referralCode}</strong> applied.
              </Alert>
            )}
            {success && <Alert kind="success" style={{ marginBottom: 16 }}>{success}</Alert>}
            {error && <Alert kind="error" style={{ marginBottom: 16 }}>{error}</Alert>}

            <form onSubmit={handleSubmit} noValidate>
              <p className="side-group-label" style={{ padding: '0 0 8px' }}>Your details</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="First name" id="su-first">
                  <Input id="su-first" name="firstname" required autoComplete="given-name"
                    value={formData.firstname} onChange={handleChange} placeholder="Jane" />
                </Field>
                <Field label="Last name" id="su-last">
                  <Input id="su-last" name="lastname" required autoComplete="family-name"
                    value={formData.lastname} onChange={handleChange} placeholder="Wanjiru" />
                </Field>
              </div>

              <Field label="Email address" id="su-email">
                <Input id="su-email" name="email" type="email" required autoComplete="email"
                  value={formData.email} onChange={handleChange} placeholder="you@example.com" />
              </Field>

              <Field label="Password" id="su-pass" hint="At least 6 characters.">
                <Input id="su-pass" name="password" type="password" required autoComplete="new-password"
                  value={formData.password} onChange={handleChange} placeholder="Create a password" />
              </Field>

              <Field
                label="Confirm password"
                id="su-pass2"
                error={passwordsMismatch ? 'Those passwords do not match.' : null}
              >
                <Input id="su-pass2" name="confirmPassword" type="password" required autoComplete="new-password"
                  value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat your password"
                  error={passwordsMismatch ? 'mismatch' : undefined} />
              </Field>

              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line-soft)' }}>
                <p className="side-group-label" style={{ padding: '0 0 8px' }}>Account recovery</p>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Used only if you forget your password. Choose something only you would know.
                </p>

                <Field label="Security question" id="su-question">
                  <Select id="su-question" name="securityQuestion" required
                    value={formData.securityQuestion} onChange={handleChange}>
                    <option value="" disabled>Choose a question…</option>
                    {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                  </Select>
                </Field>

                <Field label="Your answer" id="su-answer">
                  <Input id="su-answer" name="securityAnswer" required
                    value={formData.securityAnswer} onChange={handleChange} placeholder="Your answer" />
                </Field>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                loading={loading}
                loadingText="Creating account…"
                style={{ marginTop: 6 }}
              >
                Create account
              </Button>
            </form>
          </div>

          <p style={{ marginTop: 22, textAlign: 'center', fontSize: 14.5, color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AppBackground>
  );
}
