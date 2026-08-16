'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

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

  // Already logged in? No sign-up needed — go to the dashboard.
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => { if (r.ok) router.replace('/dashboard'); })
      .catch(() => {});
  }, []);

  // Read ?ref=CODE from the referral link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get('ref') || '').trim();
    if (ref) setReferralCode(ref);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
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
      const data = await response.json();
      if (response.ok) {
        setSuccess('Account created! Redirecting...');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        setError(data.error || 'Signup failed. Try again.' + (data.detail ? `: ${data.detail}` : ''));
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'email', label: 'Email address', type: 'email', placeholder: 'you@example.com', half: false },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters', half: false },
    { name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Repeat password', half: false },
  ];

  return (
    <div className="min-h-[80vh] flex items-center py-12 px-5">
      <div className="container-site grid lg:grid-cols-2 gap-12 items-start w-full">

        {/* Form side */}
        <div className="max-w-lg w-full">
          <p className="eyebrow">Create account</p>
          <h1 className="headline mt-4" style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.4rem)' }}>
            Join Mzazi Tech<span className="accent">.</span>
          </h1>
          <p className="text-sm mt-2 mb-8" style={{ color: '#79818A' }}>
            Free to join — panels, bots and API keys all in one account.
          </p>

          {referralCode && (
            <div className="mb-6 px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(62,207,142,0.06)', border: '1px solid rgba(62,207,142,0.3)' }}>
              <span className="mono text-[11px] uppercase tracking-[0.12em]" style={{ color: '#3ECF8E' }}>Referral code applied</span>
              <span className="mono text-[11px] font-semibold" style={{ color: '#E9E7E2' }}>{referralCode}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 px-4 py-3 text-sm" style={{ background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.3)', color: '#E5484D' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 px-4 py-3 text-sm" style={{ background: 'rgba(62,207,142,0.08)', border: '1px solid rgba(62,207,142,0.3)', color: '#3ECF8E' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="label">First name</label>
                <input type="text" name="firstname" required value={formData.firstname} onChange={handleChange}
                  className="input" placeholder="John" />
              </div>
              <div>
                <label className="label">Last name</label>
                <input type="text" name="lastname" required value={formData.lastname} onChange={handleChange}
                  className="input" placeholder="Doe" />
              </div>
            </div>

            <div className="space-y-5 mb-6">
              {fields.map(f => (
                <div key={f.name}>
                  <label className="label">{f.label}</label>
                  <input type={f.type} name={f.name} required value={formData[f.name]} onChange={handleChange}
                    className="input" placeholder={f.placeholder} />
                </div>
              ))}
            </div>

            {/* Security question — used to recover a forgotten password */}
            <div className="mb-6 p-5" style={{ background: 'rgba(76,125,252,0.04)', border: '1px solid rgba(76,125,252,0.2)' }}>
              <label className="label">Security question</label>
              <select name="securityQuestion" required value={formData.securityQuestion} onChange={handleChange}
                className="input mb-3">
                <option value="" disabled style={{ color: '#4C535B' }}>Choose a question…</option>
                {[
                  "What is your mother's maiden name?",
                  'What was the name of your first pet?',
                  'What city were you born in?',
                  'What was the name of your primary school?',
                  'What is your favourite food?',
                ].map((q) => (
                  <option key={q} value={q} style={{ color: '#E9E7E2' }}>{q}</option>
                ))}
              </select>
              <input type="text" name="securityAnswer" required value={formData.securityAnswer} onChange={handleChange}
                className="input" placeholder="Your answer" />
              <p className="text-[11px] mt-2" style={{ color: '#4C535B' }}>
                You&apos;ll answer this question to reset your password if you ever forget it.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-8 text-sm" style={{ color: '#79818A' }}>
            Already have an account?{' '}
            <Link href="/login" className="link">Sign in</Link>
          </p>
        </div>

        {/* Editorial rail */}
        <div className="hidden lg:block lg:sticky lg:top-32">
          <div className="card p-10 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #14181D 0%, #0F1215 100%)' }}>
            <div aria-hidden="true" className="absolute -bottom-24 -left-24 w-80 h-80 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(76,125,252,0.10) 0%, transparent 65%)' }} />
            <p className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#F2A93B' }}>Why join?</p>
            <p className="display text-2xl font-bold leading-snug mt-6" style={{ color: '#E9E7E2' }}>
              Everything, one wallet<span className="accent">.</span>
            </p>
            <p className="text-sm leading-relaxed mt-4 mb-10" style={{ color: '#79818A' }}>
              No tickets, no waiting. Top up once and spend on panels, bots and API credits — with
              a referral commission on every friend you bring in.
            </p>
            <div style={{ borderTop: '1px solid #1B2026' }}>
              {[
                { k: '02 min', v: 'To your first panel' },
                { k: 'KES', v: 'Local wallet, Paystack top-ups' },
                { k: 'KES 20', v: 'Referral reward per purchase' },
                { k: '24/7', v: 'Support that replies' },
              ].map(r => (
                <div key={r.k} className="flex items-baseline justify-between gap-6 py-3.5" style={{ borderBottom: '1px solid #1B2026' }}>
                  <span className="mono text-[11px] font-semibold" style={{ color: '#F2A93B' }}>{r.k}</span>
                  <span className="text-[13px] text-right" style={{ color: '#AEB5BD' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
