'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';
import Logo from '@/components/Logo';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1 = email, 2 = code + new password, 3 = done
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const sendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!isLoaded) return;
    setLoading(true);
    try {
      // Start a sign-in flow for this email, then request a reset code
      await signIn.create({ identifier: email });
      await signIn.prepareFirstFactor({ strategy: 'reset_password_email_code' });
      setStep(2);
    } catch (err) {
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message;
      setError(message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });

      if (result.status === 'complete' && signIn.createdSessionId) {
        // Session created — sync the site cookie and go to the dashboard.
        await setActive({ session: signIn.createdSessionId });
        try {
          await fetch('/api/auth/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        } catch (e) { /* will retry on /api/auth/me */ }
        router.push('/dashboard');
        router.refresh();
      } else {
        setStep(3);
      }
    } catch (err) {
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message;
      setError(message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: '#0d1117',
    border: '1px solid #1e2d4a',
    color: '#f0f4ff',
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: 'rgba(10,10,15,0.72)' }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex justify-center">
              <Logo size={56} />
            </div>
            <h2 className="text-2xl font-extrabold" style={{ color: '#f0f4ff' }}>
              {step === 1 ? 'Forgot Password' : step === 2 ? 'Check Your Email' : 'Password Reset'}
            </h2>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>
              {step === 1 && 'Enter your account email and we’ll send you a reset code'}
              {step === 2 && `A 6-digit reset code was sent to ${email}`}
              {step === 3 && 'Your password has been reset'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={sendCode}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-6"
                style={inputStyle} />
              <button type="submit" disabled={loading || !isLoaded} className="w-full py-3 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Sending…' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={resetPassword}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Reset Code</label>
              <input type="text" required value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-4 text-center tracking-[0.4em]"
                style={inputStyle} />

              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>New Password</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-4"
                style={inputStyle} />

              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Confirm New Password</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-6"
                style={inputStyle} />

              <button type="submit" disabled={loading || !isLoaded} className="w-full py-3 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full py-2 mt-2 text-xs"
                style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Use a different email
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>✅</div>
              <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>
                You can now sign in with your new password.
              </p>
              <Link href="/login" className="block w-full py-3 rounded-xl font-bold text-white text-sm text-center"
                style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)', textDecoration: 'none' }}>
                Go to Login
              </Link>
            </div>
          )}

          <p className="text-center mt-6 text-sm" style={{ color: '#64748b' }}>
            Remembered it?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#3b82f6' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
