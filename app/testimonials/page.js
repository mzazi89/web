'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StarRating from '@/components/StarRating';

function Stars({ value, size = 18 }) {
  return (
    <span style={{ color: '#facc15', fontSize: size, letterSpacing: '3px' }}>
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  );
}

function TestimonialCard({ t }) {
  const initials = t.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="p-6 rounded-2xl flex flex-col" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: '#f0f4ff' }}>{t.name}</p>
          <Stars value={t.rating} size={14} />
        </div>
      </div>
      <p className="text-sm leading-relaxed flex-1" style={{ color: '#94a3b8' }}>“{t.message}”</p>
    </div>
  );
}

export default function TestimonialsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [avg, setAvg] = useState(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', rating: 0, message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async (off, append = false) => {
    try {
      const res = await fetch(`/api/testimonials?offset=${off}&limit=6`, { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();
      setItems(prev => append ? [...prev, ...d.testimonials] : d.testimonials);
      setTotal(d.total);
      setAvg(d.avg_rating);
      setOffset(off);
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(0); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Submission failed');
      setFeedback({ type: 'success', text: d.message });
      setForm({ name: '', rating: 0, message: '' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
    setSubmitting(false);
  };

  return (
    <div style={{ backgroundColor: '#0a0a0f' }}>
      {/* Hero + rating summary */}
      <section className="py-16" style={{ background: 'linear-gradient(180deg,#0a0a0f 0%,#071428 60%,#0a0a0f 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Link href="/" className="text-xs font-semibold" style={{ color: '#475569', textDecoration: 'none' }}>← Back to Home</Link>
          <h1 className="text-3xl sm:text-5xl font-extrabold mt-3 mb-4" style={{ color: '#f0f4ff' }}>
            What Our Customers <span className="gradient-text">Say</span>
          </h1>
          <p className="text-sm sm:text-base mb-8" style={{ color: '#94a3b8' }}>
            Real reviews from real customers. Have you used MZAZI TECH? Leave your own review below.
          </p>

          <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-4 rounded-2xl"
            style={{ backgroundColor: 'rgba(15,22,41,0.8)', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold" style={{ color: '#facc15' }}>{avg !== null ? avg : '—'}</span>
              <div>
                <Stars value={avg ? Math.round(avg) : 0} size={16} />
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{total} review{total !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <span className="hidden sm:block w-px h-8" style={{ backgroundColor: '#1e2d4a' }} />
            <p className="text-xs" style={{ color: '#64748b' }}>
              ⭐★★★★★ rated · powered by real customers worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Reviews grid */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          {loading ? (
            <p className="text-center text-sm py-10" style={{ color: '#64748b' }}>Loading reviews…</p>
          ) : items.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm mb-2" style={{ color: '#94a3b8' }}>No reviews yet — be the first to review us!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(t => <TestimonialCard key={t.id} t={t} />)}
              </div>
              {offset + 6 < total && (
                <div className="text-center mt-8">
                  <button onClick={() => load(offset + 6, true)}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: 'pointer' }}>
                    Load more reviews
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Submit form */}
      <section className="pb-20">
        <div className="max-w-xl mx-auto px-4">
          <div className="p-6 sm:p-8 rounded-2xl" style={{ backgroundColor: '#0f1629', border: '1px solid rgba(37,99,235,0.35)' }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#f0f4ff' }}>Leave a Review</h2>
            <p className="text-xs mb-5" style={{ color: '#64748b' }}>
              Tell others about your experience. Reviews appear after a quick approval.
            </p>

            {feedback && (
              <p className="text-sm mb-4" style={{ color: feedback.type === 'success' ? '#4ade80' : '#f87171' }}>
                {feedback.text}
              </p>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#64748b' }}>Your Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#64748b' }}>Your Rating</label>
                <StarRating value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#64748b' }}>Your Review</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="How was your experience with MZAZI TECH?"
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                />
              </div>
              <button type="submit" disabled={submitting || !form.rating || form.name.trim().length < 2 || form.message.trim().length < 10}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
              <p className="text-[10px] text-center" style={{ color: '#475569' }}>
                Reviews must be 10–1000 characters. We approve reviews before they go live to keep things real.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
