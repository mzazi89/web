'use client';
import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1 = email, 2 = question, 3 = done
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const findAccount = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/forgot?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      setQuestion(data.question);
      setStep(2);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answer, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return; }
      setStep(3);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center py-12 px-5">
      <div className="container-site grid lg:grid-cols-2 gap-12 items-center w-full">

        {/* Form side */}
        <div className="max-w-md w-full">
          <p className="eyebrow">Password recovery</p>
          <h1 className="headline mt-4" style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.4rem)' }}>
            {step === 1 && 'Forgot your password?'}
            {step === 2 && 'Answer the security question'}
            {step === 3 && 'Password reset'}
          </h1>
          <p className="text-sm mt-2 mb-8" style={{ color: '#79818A' }}>
            {step === 1 && 'Enter your account email to recover your password.'}
            {step === 2 && `Account: ${email}`}
            {step === 3 && 'You can now sign in with your new password.'}
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 text-sm" style={{ background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.3)', color: '#E5484D' }}>
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={findAccount}>
              <label className="label">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input mb-6" />
              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? 'Checking…' : 'Continue'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={resetPassword}>
              <div className="px-4 py-3 mb-5" style={{ background: 'rgba(242,169,59,0.05)', border: '1px solid rgba(242,169,59,0.25)' }}>
                <p className="mono text-[10px] uppercase tracking-[0.14em] mb-1" style={{ color: '#F2A93B' }}>Security question</p>
                <p className="text-sm" style={{ color: '#E9E7E2' }}>{question}</p>
              </div>

              <label className="label">Your answer</label>
              <input type="text" required value={answer} onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer"
                className="input mb-4" />

              <label className="label">New password</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="input mb-4" />

              <label className="label">Confirm new password</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="input mb-6" />

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="mono w-full text-center text-[10px] uppercase tracking-[0.12em] mt-3"
                style={{ color: '#4C535B', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Use a different email
              </button>
            </form>
          )}

          {step === 3 && (
            <div>
              <div className="card p-6 mb-6 text-center">
                <Logo size={40} />
                <p className="display font-bold mt-4" style={{ color: '#3ECF8E' }}>All set.</p>
                <p className="text-sm mt-1 mb-6" style={{ color: '#79818A' }}>
                  Sign in with your new password.
                </p>
                <Link href="/login" className="btn btn-primary w-full">Go to login</Link>
              </div>
            </div>
          )}

          <p className="mt-8 text-sm" style={{ color: '#79818A' }}>
            Remembered it?{' '}
            <Link href="/login" className="link">Sign in</Link>
          </p>
        </div>

        {/* Editorial rail */}
        <div className="hidden lg:block">
          <div className="card p-10" style={{ background: 'linear-gradient(160deg, #14181D 0%, #0F1215 100%)' }}>
            <p className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#F2A93B' }}>Need a hand?</p>
            <p className="display text-2xl font-bold leading-snug mt-6" style={{ color: '#E9E7E2' }}>
              Support answers within two hours<span className="accent">.</span>
            </p>
            <p className="text-sm leading-relaxed mt-4 mb-8" style={{ color: '#79818A' }}>
              Stuck on something else? Reach us on Telegram or WhatsApp — a human, not a ticket queue.
            </p>
            <div className="space-y-3">
              {[
                { label: 'Telegram', href: 'https://t.me/mzazitech' },
                { label: 'WhatsApp', href: 'https://wa.me/254108595201' },
                { label: 'Email', href: 'mailto:mzazitechinc@gmail.com' },
              ].map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between py-3 px-4"
                  style={{ border: '1px solid #262C33', color: '#AEB5BD', textDecoration: 'none' }}>
                  <span className="mono text-[11px] uppercase tracking-[0.12em]">{l.label}</span>
                  <span className="mono text-[10px]" style={{ color: '#F2A93B' }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
