'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Icons } from '@/components/ui';

// MZAZI TECH — support chat.
//
// One thread per account, straight to the admin inbox. Sending is optimistic:
// the bubble appears immediately with a pending tick and is reconciled with the
// stored row when the POST returns. While the panel is open the thread is polled
// every 2.5s from the last id seen, so a reply arrives without a refresh and
// without dragging a socket through serverless.
//
// Hidden on the auth screens and inside the admin portal, where a floating
// support button would be noise.

const HIDDEN = ['/login', '/signup', '/forgot-password'];
const POLL_MS = 2500;

const timeOf = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | unauth | error
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const lastId = useRef(0);
  const inputRef = useRef(null);

  const scrollDown = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const merge = useCallback((incoming) => {
    if (!incoming?.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.filter((m) => !m.pending).map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      if (!fresh.length) return prev;
      const next = [...prev.filter((m) => !m.pending || m.body !== fresh[fresh.length - 1].body), ...fresh];
      lastId.current = Math.max(lastId.current, ...fresh.map((m) => m.id));
      return next;
    });
  }, []);

  const load = useCallback(async (after = 0) => {
    try {
      const res = await fetch(`/api/chat/messages?after=${after}`, { cache: 'no-store' });
      if (res.status === 401) { setState('unauth'); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'offline');
      setState('idle');
      merge(data.messages || []);
    } catch {
      setState((s) => (s === 'unauth' ? s : 'error'));
    }
  }, [merge]);

  // First open: pull the thread. Then poll while the panel stays open.
  useEffect(() => {
    if (!open) return undefined;
    setState((s) => (s === 'unauth' ? s : 'loading'));
    load(0);
    const timer = setInterval(() => load(lastId.current), POLL_MS);
    return () => clearInterval(timer);
  }, [open, load]);

  useEffect(() => { if (open) scrollDown(); }, [messages, open, scrollDown]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;

    const temp = { id: `t-${Date.now()}`, sender: 'user', body, created_at: new Date().toISOString(), pending: true };
    setMessages((prev) => [...prev, temp]);
    setDraft('');
    setSending(true);
    scrollDown();

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { setState('unauth'); setMessages((p) => p.filter((m) => m.id !== temp.id)); return; }
      if (!res.ok) throw new Error(data.error || 'Message did not send');

      setMessages((prev) => prev.map((m) => (m.id === temp.id ? data.message : m)));
      lastId.current = Math.max(lastId.current, data.message.id);
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? { ...m, failed: true, pending: false } : m)));
      setState('error');
    } finally {
      setSending(false);
    }
  };

  if (HIDDEN.includes(pathname) || pathname.startsWith('/admin')) return null;

  return (
    <>
      <button
        type="button"
        className={`chat-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close support chat' : 'Chat with MZAZI'}
        aria-expanded={open}
      >
        {open ? <Icons.X size={18} /> : <Icons.Chat size={19} />}
        {!open && <span className="chat-fab-dot" aria-hidden="true" />}
      </button>

      {open && (
        <section className="chat-panel" role="dialog" aria-label="Support chat">
          <header className="chat-head">
            <span className="chat-avatar">MZ</span>
            <div style={{ minWidth: 0 }}>
              <p className="chat-title">MZAZI support</p>
              <p className="chat-sub"><span className="dot-live" /> Usually replies in a few minutes</p>
            </div>
            <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close">
              <Icons.X size={14} />
            </button>
          </header>

          <div className="chat-body" ref={listRef}>
            {state === 'unauth' ? (
              <div className="chat-empty">
                <Icons.Shield size={18} />
                <p>Sign in to open a support thread — replies land in this panel and by email.</p>
                <Link href="/login" className="btn btn-primary btn-sm">Sign in</Link>
              </div>
            ) : state === 'loading' && messages.length === 0 ? (
              <p className="chat-hint">Loading conversation…</p>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <Icons.Chat size={18} />
                <p>Ask about a panel, a payment, an API key — anything. A human on the admin side answers.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`chat-row ${m.sender === 'user' ? 'is-me' : 'is-them'}`}>
                  <div className={`chat-bubble ${m.failed ? 'is-failed' : ''}`}>
                    <p>{m.body}</p>
                    <span className="chat-meta">
                      {timeOf(m.created_at)}
                      {m.pending ? ' · sending' : m.failed ? ' · failed' : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            className="chat-compose"
            onSubmit={(e) => { e.preventDefault(); send(); }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              placeholder={state === 'unauth' ? 'Sign in to chat' : 'Write a message…'}
              disabled={state === 'unauth'}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              maxLength={1200}
            />
            <button type="submit" className="chat-send" disabled={!draft.trim() || sending || state === 'unauth'} aria-label="Send">
              <Icons.Send size={15} />
            </button>
          </form>

          {state === 'error' && <p className="chat-error">Connection problem — your message is kept above, tap it again to retry.</p>}
        </section>
      )}
    </>
  );
}
