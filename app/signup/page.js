'use client';
import React, { useState, useEffect } from 'react';
import TypingHeading from '@/components/TypingHeading';
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
    { name: 'firstname', label: 'First Name', type: 'text', placeholder: 'John', half: true },
    { name: 'lastname', label: 'Last Name', type: 'text', placeholder: 'Doe', half: true },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', half: false },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters', half: false },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password', half: false },
  ];

  const inputStyle = {
    backgroundColor: '#02040a',
    border: '1px solid #1e3a8a',
    color: '#f0f4ff',
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: 'rgba(2,4,9,0.45)' }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#060b16', border: '1px solid #1e3a8a', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex justify-center">
              <Logo size={56} />
            </div>
            <TypingHeading as="h2" text="Create Account" speed={50} className="text-2xl font-extrabold" style={{ color: '#f0f4ff' }} />
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Join MZAZI TECH — it's free</p>
            {referralCode && (
              <span className="inline-block mt-3 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                🎁 Invited with referral code: {referralCode}
              </span>
            )}
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>First Name</label>
                <input type="text" name="firstname" required value={formData.firstname} onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder="John"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e3a8a'} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Last Name</label>
                <input type="text" name="lastname" required value={formData.lastname} onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder="Doe"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e3a8a'} />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {fields.filter(f => !f.half).map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>{f.label}</label>
                  <input type={f.type} name={f.name} required value={formData[f.name]} onChange={handleChange}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder={f.placeholder}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e3a8a'} />
                </div>
              ))}
            </div>

            {/* Security question — used to recover a forgotten password */}
            <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Security Question</label>
              <select name="securityQuestion" required value={formData.securityQuestion} onChange={handleChange}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-3"
                style={inputStyle}>
                <option value="" disabled style={{ color: '#64748b' }}>Choose a question…</option>
                {[
                  "What is your mother's maiden name?",
                  'What was the name of your first pet?',
                  'What city were you born in?',
                  'What was the name of your primary school?',
                  'What is your favourite food?',
                ].map((q) => (
                  <option key={q} value={q} style={{ color: '#f0f4ff' }}>{q}</option>
                ))}
              </select>
              <input type="text" name="securityAnswer" required value={formData.securityAnswer} onChange={handleChange}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder="Your answer"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e3a8a'} />
              <p className="text-[11px] mt-2" style={{ color: '#475569' }}>
                You'll answer this question to reset your password if you ever forget it.
              </p>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
              style={{ background: loading ? '#1e3a8a' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span>Creating account...</span>
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: '#64748b' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#3b82f6' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
