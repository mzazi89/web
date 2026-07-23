'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  const handleGoogleSignup = () => {
    window.location.href = '/api/auth/google';
  };

  const fields = [
    { name: 'firstname', label: 'First Name', type: 'text', placeholder: 'John', half: true },
    { name: 'lastname', label: 'Last Name', type: 'text', placeholder: 'Doe', half: true },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', half: false },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters', half: false },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password', half: false },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold" style={{ color: '#f0f4ff' }}>Create Account</h2>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Join MZAZI TECH — it's free</p>
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

          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center space-x-3 py-3 rounded-xl font-semibold text-sm mb-6 transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Sign up with Google</span>
          </button>

          <div className="flex items-center mb-6">
            <div className="flex-1 h-px" style={{ backgroundColor: '#1e2d4a' }} />
            <span className="px-4 text-xs" style={{ color: '#475569' }}>or register with email</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#1e2d4a' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>First Name</label>
                <input type="text" name="firstname" required value={formData.firstname} onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder="John"
                  style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e2d4a'} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Last Name</label>
                <input type="text" name="lastname" required value={formData.lastname} onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder="Doe"
                  style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e2d4a'} />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {[
                { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
                { name: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters' },
                { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>{f.label}</label>
                  <input type={f.type} name={f.name} required value={formData[f.name]} onChange={handleChange}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder={f.placeholder}
                    style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e2d4a'} />
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
              style={{ background: loading ? '#1e2d4a' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', cursor: loading ? 'not-allowed' : 'pointer' }}>
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
