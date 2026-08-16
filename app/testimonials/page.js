'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StarRating from '@/components/StarRating';

function Stars({ value, size = 18 }) {
  return (
    <span className="mono" style={{ color: '#F2A93B', fontSize: size, letterSpacing: '3px' }}>
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  );
}

function TestimonialCard({ t }) {
  const initials = t.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="card card-pad flex flex-col" style={{ padding: '24px 22px', background: '#14181D' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: 'rgba(242,169,59,0.12)', border: '1px solid rgba(242,169,59,0.4)', color: '#F2A93B' }}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: '#E9E7E2' }}>{t.name}</p>
          <Stars value={t.rating} size={13} />
        </div>
      </div>
      <p className="text-sm leading-relaxed flex-1" style={{ color: '#AEB5BD' }}>“{t.message}”</p>
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
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)' }}>
      {/* Hero + rating summary */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none grid-bg" style={{ maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)' }} />
        <div className="container-site relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <Link href="/" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A', textDecoration: 'none' }}>← Back to home</Link>
            <p className="eyebrow mt-8">Customer voices</p>
            <h1 className="headline mt-4" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.2rem)' }}>
              What customers say<span className="accent">.</span>
            </h1>
            <p className="lede mt-5 max-w-xl">
              Real reviews from real customers. Have you used MZAZI TECH? Leave your own review below.
            </p>
          </div>

          <div className="card card-pad mt-12 inline-flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center gap-3">
              <span className="stat-num" style={{ color: '#F2A93B' }}>{avg !== null ? avg : '—'}</span>
              <div>
                <Stars value={avg ? Math.round(avg) : 0} size={15} />
                <p className="mono text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: '#4C535B' }}>
                  {total} review{total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <span className="hidden sm:block w-px h-10" style={{ background: '#262C33' }} />
            <div>
              <p className="text-sm" style={{ color: '#AEB5BD' }}>Rated by real customers worldwide</p>
              <p className="mono text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: '#4C535B' }}>Approval required before publishing</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews grid */}
      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container-site max-w-5xl">
          {loading ? (
            <p className="text-center text-sm py-10" style={{ color: '#79818A' }}>Loading reviews…</p>
          ) : items.length === 0 ? (
            <div className="card card-pad text-center py-14">
              <p className="text-sm" style={{ color: '#AEB5BD' }}>No reviews yet — be the first to review us!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(t => <TestimonialCard key={t.id} t={t} />)}
              </div>
              {offset + 6 < total && (
                <div className="text-center mt-10">
                  <button onClick={() => load(offset + 6, true)} className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                    Load more reviews
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Submit form */}
      <section className="section" style={{ paddingBottom: 110 }}>
        <div className="container-site max-w-xl">
          <div className="card card-pad" style={{ borderColor: 'rgba(242,169,59,0.35)' }}>
            <p className="eyebrow">Share yours</p>
            <h2 className="section-title text-2xl mt-3 mb-2" style={{ color: '#E9E7E2' }}>Leave a review</h2>
            <p className="text-sm mb-6" style={{ color: '#79818A' }}>
              Tell others about your experience. Reviews appear after a quick approval.
            </p>

            {feedback && (
              <p className="text-sm mb-4" style={{ color: feedback.type === 'success' ? '#3ECF8E' : '#E5484D' }}>
                {feedback.text}
              </p>
            )}

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="label">Your name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  maxLength={100}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Your rating</label>
                <StarRating value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
              </div>
              <div>
                <label className="label">Your review</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="How was your experience with MZAZI TECH?"
                  rows={4}
                  maxLength={1000}
                  className="input resize-none"
                />
              </div>
              <button type="submit" disabled={submitting || !form.rating || form.name.trim().length < 2 || form.message.trim().length < 10}
                className="btn btn-primary w-full" style={{ opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting…' : 'Submit review'}
              </button>
              <p className="mono text-[10px] text-center uppercase tracking-[0.12em]" style={{ color: '#4C535B' }}>
                Reviews must be 10–1000 characters. We approve reviews before they go live to keep things real.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
