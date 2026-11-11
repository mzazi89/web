'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/AuthShell';
import { Button, Field, Input, Select, Alert, Icons, VerdictOverlay } from '@/components/ui';
import { safeNext, authHref } from '@/lib/nextPath';

// MZAZI TECH — create an account.
// Same endpoint, same payload, same redirects. The change is the feedback: a
// tick when the account is created, a cross when a rule is broken (passwords
// that do not match, a password that is too short, a rejected form).

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  'What was the name of your first pet?',
  'What city were you born in?',
  'What was the name of your primary school?',
  'What is your favourite food?',
];

const STRENGTH = {
  weak: { bars: 1, label: 'Weak' },
  fair: { bars: 2, label: 'Fair' },
  strong: { bars: 3, label: 'Strong' },
};

// Cheap, honest heuristic: length first, then variety. It never blocks the
// submit — the only hard rule is still the 6-character minimum the API enforces.
function strengthOf(password) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  return 'strong';
}

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
  // Carried through from a sign-in wall so the new account lands where the
  // visitor was going. Read once, on mount, from the query string.
  const nextRef = useRef('/dashboard');
  useEffect(() => {
    nextRef.current = safeNext(new URLSearchParams(window.location.search).get('next'));
  }, []);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

  const succeeded = verdict?.status === 'success';
  const strength = strengthOf(formData.password);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fail = (message, detail) => {
    setError(detail);
    setVerdict({ id: Date.now(), status: 'error', message });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || succeeded) return;
    setError('');

    if (formData.password !== formData.confirmPassword) {
      fail('Passwords do not match', 'Those passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      fail('Password too short', 'Your password needs to be at least 6 characters.');
      return;
    }

    setVerdict(null);
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
        setVerdict({ id: Date.now(), status: 'success', message: 'Account created' });
        window.setTimeout(() => router.push(authHref(nextRef.current)), 1100);
        return;
      }

      fail('Sign-up failed', data.error || 'We could not create your account. Please try again.');
    } catch {
      fail('Connection lost', 'We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMismatch =
    formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to start — connect your first number in about two minutes."
      maxWidth={440}
      footer={(
        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13.5, color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href={authHref(nextRef.current)} style={{ fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      )}
    >
      <div className="card card-pad auth-card">
        <VerdictOverlay
          verdict={verdict}
          ttl={verdict?.status === 'error' ? 2000 : 0}
          onDone={() => setVerdict(null)}
        />

        {referralCode && (
          <Alert kind="brand" style={{ marginBottom: 16 }}>
            Referral code <strong>{referralCode}</strong> applied.
          </Alert>
        )}
        {error && <Alert kind="error" style={{ marginBottom: 16 }}>{error}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <p className="side-group-label" style={{ padding: '0 0 8px' }}>Your details</p>

          <div className="auth-grid-2">
            <Field label="First name" id="su-first">
              <Input id="su-first" name="firstname" required autoComplete="given-name"
                value={formData.firstname} onChange={handleChange} placeholder="Jane"
                disabled={loading || succeeded} />
            </Field>
            <Field label="Last name" id="su-last">
              <Input id="su-last" name="lastname" required autoComplete="family-name"
                value={formData.lastname} onChange={handleChange} placeholder="Wanjiru"
                disabled={loading || succeeded} />
            </Field>
          </div>

          <Field label="Email address" id="su-email">
            <Input id="su-email" name="email" type="email" required autoComplete="email" inputMode="email"
              value={formData.email} onChange={handleChange} placeholder="you@example.com"
              disabled={loading || succeeded} />
          </Field>

          <Field label="Password" id="su-pass" hint="At least 6 characters.">
            <div className="pw-wrap">
              <Input id="su-pass" name="password" type={showPassword ? 'text' : 'password'} required
                autoComplete="new-password" value={formData.password} onChange={handleChange}
                placeholder="Create a password" disabled={loading || succeeded} />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <Icons.EyeOff size={17} /> : <Icons.Eye size={17} />}
              </button>
            </div>
          </Field>

          {strength && (
            <div className="pw-meter" aria-live="polite">
              <div className="pw-meter-bars" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={`pw-meter-bar ${n <= STRENGTH[strength].bars ? `on-${strength}` : ''}`}
                  />
                ))}
              </div>
              <span className="pw-meter-label">{STRENGTH[strength].label}</span>
            </div>
          )}

          <Field
            label="Confirm password"
            id="su-pass2"
            error={passwordsMismatch ? 'Those passwords do not match.' : null}
          >
            <div className="pw-wrap">
              <Input id="su-pass2" name="confirmPassword" type={showConfirm ? 'text' : 'password'} required
                autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange}
                placeholder="Repeat your password" disabled={loading || succeeded}
                error={passwordsMismatch ? 'mismatch' : undefined} />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                aria-pressed={showConfirm}
              >
                {showConfirm ? <Icons.EyeOff size={17} /> : <Icons.Eye size={17} />}
              </button>
            </div>
          </Field>

          <div style={{ marginTop: 16, paddingTop: 18, borderTop: '1px solid var(--line-soft)' }}>
            <p className="side-group-label" style={{ padding: '0 0 8px' }}>Account recovery</p>
            <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
              Used only if you forget your password. Choose something only you would know.
            </p>

            <Field label="Security question" id="su-question">
              <Select id="su-question" name="securityQuestion" required
                value={formData.securityQuestion} onChange={handleChange}
                disabled={loading || succeeded}>
                <option value="" disabled>Choose a question…</option>
                {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </Select>
            </Field>

            <Field label="Your answer" id="su-answer">
              <Input id="su-answer" name="securityAnswer" required
                value={formData.securityAnswer} onChange={handleChange} placeholder="Your answer"
                disabled={loading || succeeded} />
            </Field>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            loading={loading}
            loadingText="Creating account…"
            disabled={succeeded}
            style={{ marginTop: 6 }}
          >
            Create account
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
