'use client';

// MZAZI TECH — dialog primitives.
//
// Behaviour that every modal in the product inherits:
//   * bottom sheet on phones, centred card from 640px
//   * Escape closes, backdrop click closes, body scroll locks
//   * focus is moved in on open and restored on close
//   * `tone="danger"` renders the destructive pattern (red confirm button)
//   * rendered into <body> — see the note above the return, it is load-bearing

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from './Icons';
import Button from './Button';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  tone = 'default',
  closeOnBackdrop = true,
  className = '',
}) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);

  // Portals can only target the DOM, so hold the render back for one frame on
  // the client. Without this, SSR would touch `document`.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);

    // Focus the first meaningful control, not the heading.
    const t = setTimeout(() => {
      const node = panelRef.current?.querySelector(
        'input, select, textarea, button:not([data-close]), [href], [tabindex]:not([tabindex="-1"])'
      );
      (node || panelRef.current)?.focus?.();
    }, 30);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      clearTimeout(t);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const maxWidth = { sm: 380, md: 460, lg: 620, xl: 800 }[size] || 460;

  /* Rendering into <body> is what lets the z-indexes below actually apply.
     `.app-content` on <main> declares `position: relative; z-index: 1` so page
     content stays above the fixed RouteBackdrop layers — and a positioned
     element with a z-index opens a stacking context. Everything inside <main>
     is therefore confined to it: this dialog's `.overlay` (90) and `.modal-host`
     (91) could not paint above a sibling of <main> no matter how high they were
     set. <Footer> is that sibling — `position: relative; z-index: 1`, and later
     in the DOM — so it painted over this dialog and cut off its bottom, which
     on the wallet's "Add money" sheet hid the payment methods.

     A portal moves the dialog out of <main>'s context, so 90/91 now compete at
     the top level against <Footer> (1) and the AI chat button (50). Theme tokens
     are unaffected: `data-theme` lives on <html>, above <body>. */
  return createPortal(
    <>
      <div className="overlay" onClick={closeOnBackdrop ? onClose : undefined} aria-hidden="true" />
      <div className="modal-host" onClick={closeOnBackdrop ? onClose : undefined}>
        <div
          ref={panelRef}
          className={`modal ${className}`}
          style={{ maxWidth }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-head">
            <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', minWidth: 0 }}>
              {tone === 'danger' && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 36, height: 36, flex: '0 0 36px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--r-md)', background: 'var(--bad-tint)', color: 'var(--bad)',
                  }}
                >
                  <AlertTriangle size={19} />
                </span>
              )}
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{title}</h2>
                {description && (
                  <p style={{ margin: '5px 0 0', fontSize: 14, color: 'var(--muted)', lineHeight: 1.55 }}>{description}</p>
                )}
              </div>
            </div>
            <button type="button" className="icon-btn" data-close onClick={onClose} aria-label="Close dialog"
              style={{ width: 34, height: 34 }}>
              <X size={16} />
            </button>
          </div>

          {children && <div className="modal-body">{children}</div>}
          {footer && <div className="modal-foot">{footer}</div>}
        </div>
      </div>
    </>,
    document.body
  );
}

/**
 * ConfirmDialog — the required pattern before anything destructive
 * (delete a device, unlink a number, revoke a coupon).
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      tone={tone}
      closeOnBackdrop={!loading}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
