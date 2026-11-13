'use client';

// Copy / share the referral link.
//
// Clipboard access fails silently in in-app browsers (WhatsApp, Instagram) and on
// plain-http pages, so a refused copy falls back to selecting the text and says
// what happened instead of pretending it worked.

import { useRef, useState } from 'react';
import { Icons } from '@/components/ui';

export default function ReferralShare({ code, link }) {
  const [note, setNote] = useState('');
  const inputRef = useRef(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setNote('Link copied');
    } catch {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.select();
        setNote('Press and hold the link to copy');
      } else {
        setNote(link);
      }
    }
    setTimeout(() => setNote(''), 4000);
  };

  const share = async () => {
    const text = `Join MZAZI TECH with my link and we both get rewarded: ${link}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'MZAZI TECH', text, url: link }); return; } catch { /* cancelled */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="referral-share">
      <div className="referral-code">
        <span className="kpi-label">Your code</span>
        <strong>{code}</strong>
      </div>

      <label className="field" style={{ flex: '1 1 240px', minWidth: 0 }}>
        <span className="field-label">Your link</span>
        <input ref={inputRef} className="input" value={link} readOnly onFocus={(e) => e.target.select()} />
      </label>

      <div className="referral-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={copy}>
          <Icons.Copy size={13} /> Copy
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={share}>
          <Icons.WhatsApp size={13} /> Share
        </button>
      </div>

      <p className="field-hint" role="status" aria-live="polite" style={{ flexBasis: '100%', margin: 0, minHeight: 14 }}>
        {note}
      </p>
    </div>
  );
}
