'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/ui';

// MZAZI TECH — proof section.
//
// Real reviews only. Live rows come from `testimonials` via /api/testimonials —
// reviews publish themselves on submit, so `approved` now means "not withdrawn"
// rather than "moderated". Until there are some, this renders the commitments
// every plan actually carries rather than invented quotes on a page that sells
// hosting. (The repo removed a
// block of fake testimonials once already — this is the guard against it coming
// back through a redesign.)

const COMMITMENTS = [
  {
    Icon: Icons.Activity,
    title: 'Provisioned in minutes',
    text: 'Panels, VPS and bot pairings are queued and fulfilled automatically. No ticket, no waiting for an operator to wake up.',
  },
  {
    Icon: Icons.Shield,
    title: 'Your number stays yours',
    text: 'We never ask for your WhatsApp password and never hold your session on a shared device. Unlink from the dashboard at any time.',
  },
  {
    Icon: Icons.Globe,
    title: 'Kenyan pricing, global routing',
    text: 'Billed in KES from a wallet you top up with M-PESA. Traffic and nodes are placed for latency, not for our convenience.',
  },
];

export default function Testimonials() {
  const [reviews, setReviews] = useState(null); // null = still loading

  useEffect(() => {
    let cancelled = false;
    fetch('/api/testimonials?limit=3', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        const list = Array.isArray(d) ? d : d?.testimonials || [];
        setReviews(list.filter((t) => t && t.message).slice(0, 3));
      })
      .catch(() => { if (!cancelled) setReviews([]); });
    return () => { cancelled = true; };
  }, []);

  const hasReviews = Array.isArray(reviews) && reviews.length > 0;

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container-site">
        <span className="eyebrow">{hasReviews ? 'Testimonials' : 'How we operate'}</span>
        <h2 className="section-title" style={{ margin: '8px 0 16px', fontSize: 'var(--text-3xl)' }}>
          {hasReviews ? 'Trusted by operators' : 'Built for operators'}
        </h2>

        <div className="quote-grid">
          {hasReviews
            ? reviews.map((t) => (
                <figure className="quote-card" key={t.id}>
                  <div className="quote-stars" aria-label={`${t.rating} out of 5`}>
                    {Array.from({ length: Math.max(1, Math.min(5, t.rating || 5)) }).map((_, i) => (
                      <Icons.Star key={i} size={11} />
                    ))}
                  </div>
                  <blockquote className="quote-text" style={{ margin: 0 }}>{t.message}</blockquote>
                  <figcaption className="quote-who">
                    <span className="quote-avatar">{(t.name || 'M').slice(0, 1).toUpperCase()}</span>
                    <span>
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 650, color: 'var(--ink)' }}>{t.name}</span>
                      <span style={{ display: 'block', fontSize: 10, color: 'var(--dim)' }}>Verified customer</span>
                    </span>
                  </figcaption>
                </figure>
              ))
            : COMMITMENTS.map(({ Icon, title, text }) => (
                <div className="quote-card" key={title}>
                  <span className="svc-ico" style={{ width: 26, height: 26 }}><Icon size={14} /></span>
                  <p className="quote-text" style={{ color: 'var(--ink)', fontWeight: 650, fontSize: 12.5 }}>{title}</p>
                  <p className="quote-text">{text}</p>
                </div>
              ))}
        </div>

        <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--dim)' }}>
          {hasReviews ? (
            <Link href="/testimonials" className="link">Read all reviews</Link>
          ) : (
            <>
              Have you used MZAZI?{' '}
              <Link href="/testimonials" className="link">Leave a review</Link>{' '}
              — it appears here the moment you post it.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
