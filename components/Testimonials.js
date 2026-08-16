'use client';
import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import Link from 'next/link';


function TestimonialCard({ testimonial }) {
  const date = new Date(testimonial.created_at).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const initials = testimonial.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      className="card card-pad flex flex-col"
      style={{
        background: '#14181D',
        border: '1px solid #262C33',
        borderRadius: 6,
        padding: '26px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(242,169,59,0.45)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.35)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#262C33'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div className="mono text-2xl" style={{ color: '#F2A93B', lineHeight: 1, opacity: 0.6 }}>"</div>
      <p className="text-sm leading-relaxed flex-1" style={{ color: '#AEB5BD' }}>{testimonial.message}</p>
      <StarRating value={testimonial.rating} readonly />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px', borderTop: '1px solid #1B2026' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'rgba(242,169,59,0.1)', border: '1px solid rgba(242,169,59,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '14px', color: '#F2A93B', flexShrink: 0,
          fontFamily: 'var(--font-display)',
        }}>{initials}</div>
        <div>
          <div style={{ color: '#E9E7E2', fontWeight: 600, fontSize: '14px' }}>{testimonial.name}</div>
          <div style={{ color: '#4C535B', fontSize: '12px' }}>{date}</div>
        </div>
      </div>
    </div>
  );
}

function TestimonialForm({ onSubmitted }) {
  const [form, setForm] = useState({ name: '', rating: 0, message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.rating) { setError('Please select a star rating.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      setSuccess(true);
      setForm({ name: '', rating: 0, message: '' });
      if (onSubmitted) onSubmitted(data.testimonial);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="card card-pad text-center" style={{ borderColor: 'rgba(62,207,142,0.4)' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3ECF8E', margin: '0 auto' }}>
          <circle cx="12" cy="12" r="10" /><path d="m8.5 12.5 2.5 2.5 5-6" />
        </svg>
        <h3 className="display font-bold text-xl mt-4 mb-2" style={{ color: '#E9E7E2' }}>Thank you!</h3>
        <p className="text-sm" style={{ color: '#79818A' }}>Your testimonial has been submitted successfully. It will appear after a quick approval.</p>
        <button onClick={() => setSuccess(false)} className="btn btn-ghost mt-6" style={{ cursor: 'pointer' }}>
          Add another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card card-pad" style={{ background: '#14181D' }}>
      <p className="eyebrow">Your voice</p>
      <h3 className="section-title text-xl mt-3 mb-6" style={{ color: '#E9E7E2' }}>Share your experience</h3>

      {error && (
        <div className="px-4 py-3 text-sm mb-5" style={{ background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.3)', color: '#E5484D' }}>
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="label">Your name *</label>
          <input type="text" placeholder="e.g. John Kamau" value={form.name} required
            onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
        </div>

        <div>
          <label className="label">Your rating *</label>
          <StarRating value={form.rating} onChange={r => setForm({ ...form, rating: r })} />
        </div>

        <div>
          <label className="label">Your testimonial *</label>
          <textarea placeholder="Tell others about your experience with MZAZI TECH..." value={form.message} required rows={5}
            onChange={e => setForm({ ...form, message: e.target.value })}
            className="input resize-none" />
          <div className="mono text-[10px] mt-2 text-right" style={{ color: '#4C535B' }}>{form.message.length} / 1000</div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Submitting…' : 'Submit testimonial'}
        </button>
      </div>
    </form>
  );
}

const INITIAL_LIMIT = 6;
const MORE_LIMIT = 10;

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = async (offset, limit) => {
    const res = await fetch(`/api/testimonials?offset=${offset}&limit=${limit}`);
    const data = await res.json();
    return data;
  };

  useEffect(() => {
    fetchPage(0, INITIAL_LIMIT)
      .then(data => {
        setTestimonials(data.testimonials || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchPage(testimonials.length, MORE_LIMIT);
      setTestimonials(prev => [...prev, ...(data.testimonials || [])]);
      setTotal(data.total || total);
    } catch {}
    finally { setLoadingMore(false); }
  };

  const handleNewTestimonial = (t) => {
    setTestimonials(prev => [t, ...prev]);
    setTotal(prev => prev + 1);
  };

  const avgRating = testimonials.length
    ? (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1)
    : null;

  const hasMore = testimonials.length < total;

  return (
    <section className="section" style={{ position: 'relative' }}>
      <div className="container-site max-w-5xl">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="tag tag-amber mb-6">
            ★ {avgRating ? `${avgRating} avg rating · ` : ''}{total} {total === 1 ? 'review' : 'reviews'}
          </span>
          <h2 className="section-title text-3xl sm:text-4xl mt-4" style={{ color: '#E9E7E2' }}>
            What our clients say<span className="bar" style={{ margin: '14px auto 0' }} />
          </h2>
          <p className="text-sm mt-5 max-w-md mx-auto" style={{ color: '#79818A' }}>
            Real experiences from real customers worldwide.
          </p>
          <div className="mt-4">
            <Link href="/testimonials" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#F2A93B', textDecoration: 'none' }}>
              View all reviews →
            </Link>
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#79818A', padding: '40px 0' }}>Loading testimonials…</div>
        ) : testimonials.length === 0 ? (
          <div className="card card-pad text-center mb-10" style={{ color: '#79818A' }}>
            <p className="text-sm">No testimonials yet — be the first to share your experience!</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {testimonials.map(t => <TestimonialCard key={t.id} testimonial={t} />)}
            </div>

            {/* See More */}
            {hasMore && (
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn btn-ghost"
                  style={{ cursor: loadingMore ? 'not-allowed' : 'pointer' }}
                >
                  {loadingMore ? 'Loading…' : `See more (${total - testimonials.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}

        {/* Submit form */}
        <div style={{ maxWidth: '600px', margin: '32px auto 0' }}>
          <TestimonialForm onSubmitted={handleNewTestimonial} />
        </div>
      </div>
    </section>
  );
}
