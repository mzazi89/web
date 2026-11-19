'use client';

// Report a message to MZAZI support.
//
// Three taps at most: pick a reason, optionally say more, send. The person being
// reported is never told, and the report does not appear in the chat — it lands in
// the operator's queue.

import { useEffect, useState } from 'react';
import { Icons } from '@/components/ui';
import { WA } from './parts';

const REASONS = ['Spam', 'Harassment', 'Scam or fraud', 'Inappropriate content', 'Other'];

export default function ReportDialog({ message, onClose, onSubmit, busy = false }) {
  const [reason, setReason] = useState('Spam');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (message) { setReason('Spam'); setNote(''); }
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report message"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(4,6,10,0.66)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420, background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--line)', padding: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center',
            background: 'var(--bad-a08)', color: 'var(--bad)',
          }}>
            <Icons.Shield size={17} />
          </span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>Report to MZAZI</p>
            <p style={{ fontSize: 11.5, color: 'var(--dim)' }}>
              From {message.senderName}. They will not be told.
            </p>
          </div>
        </div>

        <p style={{
          marginTop: 12, padding: '9px 11px', borderRadius: 9, fontSize: 12,
          background: 'var(--bg-2)', border: '1px solid var(--line-soft)', color: 'var(--muted)',
          maxHeight: 96, overflow: 'hidden',
        }}>
          {message.deleted ? 'This message was deleted' : (message.body || 'Attachment')}
        </p>

        <p style={{ marginTop: 14, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--dim)', fontWeight: 700 }}>
          Reason
        </p>
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              aria-pressed={reason === r}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                border: `1px solid ${reason === r ? WA.accentLine : 'var(--line)'}`,
                background: reason === r ? WA.accentSoft : 'transparent',
                color: reason === r ? WA.accent : 'var(--muted)',
                fontSize: 12.5, fontWeight: 600, textAlign: 'left',
              }}
            >
              {r}
              {reason === r && <Icons.Check size={14} />}
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={2}
          placeholder="Anything else support should know (optional)"
          style={{
            marginTop: 10, width: '100%', resize: 'none', borderRadius: 9, padding: '9px 11px',
            fontSize: 12.5, background: 'var(--bg-2)', border: '1px solid var(--line)',
            color: 'var(--ink)', outline: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--line)',
              background: 'transparent', color: 'var(--muted)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit?.({ reason, note })}
            disabled={busy}
            style={{
              flex: 1.4, padding: '10px', borderRadius: 10, border: 'none',
              background: 'var(--bad)', color: '#fff', fontSize: 12.5, fontWeight: 800,
              cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Sending…' : 'Send report'}
          </button>
        </div>
      </div>
    </div>
  );
}
