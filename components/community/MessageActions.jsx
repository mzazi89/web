'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/community/MessageActions.jsx — the long-press sheet.
//
// Long-press is the gesture people expect in a chat, and it needs a real sheet
// rather than the hover bar: a thumb cannot hover. Every action states what it
// will do, and the destructive two are numbered in a way nobody can confuse —
// "Delete for everyone" leaves a tombstone for the whole chat, "Delete for me"
// hides it from this device and leaves everyone else untouched.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { Icons } from '@/components/ui';
import { Avatar, clock } from './parts';

const GOLD = '#C9A227';

function Row({ icon, label, hint, onClick, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%',
        padding: '11px 4px', background: 'transparent', border: 'none',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.42 : 1,
        textAlign: 'left',
      }}
    >
      <span
        style={{
          width: 34, height: 34, borderRadius: 10, flex: '0 0 34px',
          display: 'grid', placeItems: 'center',
          background: danger ? 'var(--bad-a08)' : 'var(--surface-2)',
          color: danger ? 'var(--bad)' : 'var(--muted)',
        }}
      >
        {icon}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: danger ? 'var(--bad)' : 'var(--ink)' }}>
          {label}
        </span>
        {hint && <span style={{ display: 'block', fontSize: 11, color: 'var(--dim)', marginTop: 1 }}>{hint}</span>}
      </span>
    </button>
  );
}

export default function MessageActions({
  message,
  mine = false,
  canModerate = false,
  onClose,
  onReply,
  onEdit,
  onDeleteEveryone,
  onDeleteMe,
  onCopy,
  onReport,
}) {
  useEffect(() => {
    if (!message) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [message, onClose]);

  if (!message) return null;

  const isText = message.kind === 'text' && !message.deleted;
  const canEdit = mine && isText;
  const canDeleteEveryone = (mine || canModerate) && !message.deleted;
  const canReport = !mine && !message.deleted;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Message actions"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(4,6,10,0.62)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520, background: 'var(--surface)',
          borderTopLeftRadius: 18, borderTopRightRadius: 18,
          padding: '10px 16px calc(14px + env(safe-area-inset-bottom))',
          boxShadow: '0 -18px 50px rgba(0,0,0,0.45)',
          animation: 'comSheet .18s ease-out',
        }}
      >
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--line)', margin: '0 auto 12px' }} />

        {/* what you are acting on */}
        <div style={{ display: 'flex', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--line-soft)' }}>
          <Avatar avatar={message.senderAvatar} photo={message.senderPhoto} label={message.senderName} size={34} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink)' }}>
              {mine ? 'You' : message.senderName} <span style={{ color: 'var(--dim)', fontWeight: 500 }}>· {clock(message.createdAt)}</span>
            </p>
            <p style={{
              fontSize: 12, color: 'var(--dim)', marginTop: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {message.deleted ? 'This message was deleted' : (message.body || (message.media?.kind === 'image' ? '📷 Photo' : '🎙 Voice note'))}
            </p>
          </div>
        </div>

        <div style={{ paddingTop: 4 }}>
          <Row icon={<Icons.Chat size={16} />} label="Reply" onClick={() => onReply?.(message)} />
          <Row
            icon={<Icons.Pencil size={16} />}
            label="Edit"
            hint={canEdit ? null : mine ? 'Only text messages can be edited' : 'You can only edit your own messages'}
            onClick={() => onEdit?.(message)}
            disabled={!canEdit}
          />
          <Row
            icon={<Icons.Copy size={16} />}
            label="Copy"
            hint={message.deleted ? 'Nothing to copy' : null}
            onClick={() => onCopy?.(message)}
            disabled={message.deleted}
          />
          <Row
            icon={<Icons.Shield size={16} />}
            label="Report to MZAZI"
            hint={canReport ? 'Sent privately to support — they will not see it in the chat' : 'You cannot report your own message'}
            onClick={() => onReport?.(message)}
            disabled={!canReport}
          />
          <Row
            icon={<Icons.Trash size={16} />}
            label="Delete for everyone"
            hint={canDeleteEveryone ? 'Leaves “This message was deleted” for the whole chat' : 'Not available for this message'}
            onClick={() => onDeleteEveryone?.(message)}
            danger
            disabled={!canDeleteEveryone}
          />
          <Row
            icon={<Icons.EyeOff size={16} />}
            label="Delete for me"
            hint="Hides it here. Everyone else keeps their copy."
            onClick={() => onDeleteMe?.(message)}
            danger
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 8, width: '100%', padding: '11px', borderRadius: 12,
            border: `1px solid ${GOLD}44`, background: 'transparent', color: GOLD,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes comSheet { from { transform: translateY(16px); opacity: .7 } to { transform: none; opacity: 1 } }
      `}</style>
    </div>
  );
}
