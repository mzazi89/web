'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StarRating from '@/components/StarRating';
import { Avatar, Icons, humaniseError } from '@/components/ui';

function Stars({ value, size = 18 }) {
  return (
    <span className="mono" style={{ color: 'var(--brand)', fontSize: size, letterSpacing: '3px' }}>
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  );
}

function TestimonialCard({ t, signedIn }) {
  const [likes, setLikes] = useState(t.likes || 0);
  const [dislikes, setDislikes] = useState(t.dislikes || 0);
  const [mine, setMine] = useState(t.my_reaction || null);
  const [count, setCount] = useState(t.comment_count || 0);
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [shared, setShared] = useState('');

  async function react(kind) {
    if (signedIn === false) { window.location.assign('/login?next=/testimonials'); return; }
    if (busy) return;
    setBusy(true);
    setNote('');
    try {
      const res = await fetch(`/api/testimonials/${t.id}/react`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      const data = await res.json();
      if (res.status === 401) { setNote('Sign in to react.'); return; }
      if (!res.ok) { setNote(humaniseError(data?.error || res.status)); return; }
      setLikes(data.likes);
      setDislikes(data.dislikes);
      setMine(data.mine);
    } catch {
      setNote('Network error — try again');
    } finally {
      setBusy(false);
    }
  }

  async function loadThread() {
    try {
      const res = await fetch(`/api/testimonials/${t.id}/comments`);
      const data = await res.json();
      setThread(data.comments || []);
    } catch {
      setThread([]);
    }
  }

  function toggleThread() {
    const next = !open;
    setOpen(next);
    if (next && thread === null) loadThread();
  }

  async function postComment(e) {
    e.preventDefault();
    if (busy) return;
    const body = draft.trim();
    if (body.length < 2) return;
    setBusy(true);
    setNote('');
    try {
      const res = await fetch(`/api/testimonials/${t.id}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (res.status === 401) { setNote('Sign in to comment — your session has ended.'); return; }
      if (!res.ok) { setNote(humaniseError(data?.error || res.status)); return; }
      setDraft('');
      setThread((prev) => [...(prev || []), data.comment]);
      setCount((n) => n + 1);
    } catch {
      setNote('Network error — try again');
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}/testimonials#t-${t.id}`;
    const text = `${t.name} on MZAZI TECH: “${t.message.slice(0, 120)}…”`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'MZAZI TECH review', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShared('Link copied');
      setTimeout(() => setShared(''), 2000);
    } catch {
      setShared('Could not share');
      setTimeout(() => setShared(''), 2000);
    }
  }

  return (
    <div id={`t-${t.id}`} className="card card-pad flex flex-col" style={{ padding: '17px 16px', background: 'var(--surface)' }}>
      <div className="flex items-center gap-3 mb-5">
        <Avatar src={t.avatar_url || `/api/avatar/generated?seed=${encodeURIComponent(t.name)}`} name={t.name} size={40} />
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--ink)' }}>{t.name}</p>
          <Stars value={t.rating} size={13} />
        </div>
      </div>

      <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--ink-2)' }}>“{t.message}”</p>

      <div className="t-actions">
        <button type="button" className={`t-act ${mine === 'like' ? 'is-on' : ''}`} onClick={() => react('like')} aria-pressed={mine === 'like'} aria-label="Like this review">
          <Icons.ThumbUp size={13} /> {likes > 0 ? likes : ''}
        </button>
        <button type="button" className={`t-act ${mine === 'dislike' ? 'is-on' : ''}`} onClick={() => react('dislike')} aria-pressed={mine === 'dislike'} aria-label="Dislike this review">
          <Icons.ThumbDown size={13} /> {dislikes > 0 ? dislikes : ''}
        </button>
        <button type="button" className={`t-act ${open ? 'is-on' : ''}`} onClick={toggleThread} aria-expanded={open}>
          <Icons.Chat size={13} /> {count > 0 ? count : 'Comment'}
        </button>
        <button type="button" className="t-act" onClick={share}>
          <Icons.Share size={13} /> {shared || 'Share'}
        </button>
      </div>

      {note && <p className="t-note">{note}</p>}

      {open && (
        <div className="t-thread">
          {thread === null && <p className="t-note">Loading comments…</p>}
          {thread && thread.length === 0 && <p className="t-note">No comments yet — say the first thing.</p>}
          {thread && thread.map((c) => (
            <div className="t-comment" key={c.id}>
              <Avatar src={c.avatar_url || `/api/avatar/generated?seed=${encodeURIComponent(c.name)}`} name={c.name} size={26} />
              <div>
                <span className="t-comment-name">{c.name}</span>
                <p className="t-comment-body">{c.body}</p>
              </div>
            </div>
          ))}
          {signedIn === false && (
            <p className="t-signin">
              <Link href="/login?next=/testimonials">Sign in</Link> to join the conversation.
            </p>
          )}
          {signedIn !== false && (
          <form className="t-form" onSubmit={postComment}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              placeholder="Add a comment…"
              aria-label="Add a comment"
            />
            <button type="submit" disabled={busy || draft.trim().length < 2}>
              {busy ? 'Sending' : 'Send'}
            </button>
          </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestimonialsPage() {
  const [items, setItems] = useState([]);
  // null = still asking. The comment box and the reaction buttons depend on this,
  // and guessing either way is worse than waiting half a second.
  const [signedIn, setSignedIn] = useState(null);
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
      // Live as soon as it is written, so show it: reload the first page and bring
      // the visitor to their own review instead of leaving it off-screen.
      await load(0);
      if (typeof document !== 'undefined') {
        document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: humaniseError(err, 'We could not submit your review. Please try again.') });
    }
    setSubmitting(false);
  };

  return (
    <div style={{ backgroundColor: 'var(--page-tint)' }}>
      {/* Hero + rating summary */}
      <section className="relative overflow-hidden">
        <div className="container-site relative py-6 sm:py-6">
          <div className="max-w-3xl">
            <Link href="/" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--muted)', textDecoration: 'none' }}>← Back to home</Link>
            <p className="eyebrow mt-5">Customer voices</p>
            <h1 className="headline mt-4" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.2rem)' }}>
              What customers say<span className="accent">.</span>
            </h1>
            <p className="lede mt-5 max-w-xl">
              Real reviews from real customers. Have you used MZAZI TECH? Leave your own review below.
            </p>
          </div>

          <div className="card card-pad mt-4 inline-flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center gap-3">
              <span className="stat-num" style={{ color: 'var(--brand)' }}>{avg !== null ? avg : '—'}</span>
              <div>
                <Stars value={avg ? Math.round(avg) : 0} size={15} />
                <p className="mono text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: 'var(--dim)' }}>
                  {total} review{total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <span className="hidden sm:block w-px h-10" style={{ background: 'var(--line)' }} />
            <div>
              <p className="text-sm" style={{ color: 'var(--ink-2)' }}>Rated by real customers worldwide</p>
              <p className="mono text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: 'var(--dim)' }}>Published as soon as it is submitted</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews grid */}
      <span id="reviews" />
      <section className="section" style={{ paddingTop: 17 }}>
        <div className="container-site max-w-5xl">
          {loading ? (
            <p className="text-center text-sm py-6" style={{ color: 'var(--muted)' }}>Loading reviews…</p>
          ) : items.length === 0 ? (
            <div className="card card-pad text-center py-6">
              <p className="text-sm" style={{ color: 'var(--ink-2)' }}>No reviews yet — be the first to review us!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(t => <TestimonialCard key={t.id} t={t} signedIn={signedIn} />)}
              </div>
              {offset + 6 < total && (
                <div className="text-center mt-4">
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
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="container-site max-w-xl">
          <div className="card card-pad" style={{ borderColor: 'var(--brand-a35)' }}>
            <p className="eyebrow">Share yours</p>
            <h2 className="section-title text-lg mt-3 mb-2" style={{ color: 'var(--ink)' }}>Leave a review</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              Tell others about your experience. Your review is published the moment you submit it.
            </p>

            {feedback && (
              <p className="text-sm mb-4" style={{ color: feedback.type === 'success' ? 'var(--good)' : 'var(--bad)' }}>
                {feedback.text}
              </p>
            )}

            <form onSubmit={submit} className="space-y-3">
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
              <p className="mono text-[10px] text-center uppercase tracking-[0.12em]" style={{ color: 'var(--dim)' }}>
                Reviews must be 10–1000 characters and go live immediately — no waiting for approval.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
