'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/community/Thread.jsx — one conversation.
//
// The behaviour that makes a chat window feel finished, rather than merely work:
//   * consecutive messages from the same person are grouped, so a burst reads as
//     one turn instead of ten separate bubbles
//   * a day divider whenever the date changes
//   * new messages only yank the viewport when you were already at the bottom;
//     otherwise the position is kept and a "new messages" pill appears
//   * quoting shows what is being answered, and the delete affordance appears on
//     the bubble itself rather than in a settings screen
//   * optimistic sends render immediately with a clock, then settle into ticks
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icons } from '@/components/ui';
import { Avatar, EmojiTray, IconButton, Ticks, TypingDots, clock, dayKey, dayLabel } from './parts';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🙏'];

function PendingClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-label="Sending" role="img">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Thread({
  chat,
  me,
  messages = [],
  typing = [],
  hasMore,
  loadingOlder,
  sending,
  reply,
  onReply,
  onCancelReply,
  onSend,
  onDelete,
  onBack,
  onInfo,
  onLoadOlder,
  onTyping,
  hidden = false,
}) {
  const [draft, setDraft] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [picked, setPicked] = useState(null);      // message id with actions shown (touch)
  const [newBelow, setNewBelow] = useState(0);

  const scrollRef = useRef(null);
  const endRef = useRef(null);
  const areaRef = useRef(null);
  const atBottomRef = useRef(true);
  const lastCountRef = useRef(0);
  const lastHeightRef = useRef(0);
  const firstIdRef = useRef(0);
  const typingSentRef = useRef(0);

  const canModerate = chat?.myRole === 'owner' || chat?.myRole === 'admin';
  const isGroup = chat?.kind === 'group';

  // ── scrolling ──────────────────────────────────────────────────────────────
  const scrollToEnd = (behavior = 'smooth') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    atBottomRef.current = true;
    setNewBelow(0);
  };

  useLayoutEffect(() => {
    if (hidden) return;
    const el = scrollRef.current;
    if (!el) return;

    const firstId = messages[0]?.id ?? 0;
    const prevFirst = firstIdRef.current;
    firstIdRef.current = firstId;

    // A chat switch clears the list, so `0 → n` is a fresh conversation and the
    // view starts at the newest message rather than wherever the last one was.
    if (messages.length && lastCountRef.current === 0) {
      lastCountRef.current = messages.length;
      scrollToEnd('auto');
      lastHeightRef.current = el.scrollHeight;
      return;
    }

    // Older messages inserted above the viewport must not move what is being
    // read: add exactly the height that appeared, so the same bubble stays put.
    const prepended = prevFirst > 0 && firstId > 0 && firstId < prevFirst;
    if (prepended) {
      el.scrollTop += el.scrollHeight - lastHeightRef.current;
    } else if (messages.length > lastCountRef.current) {
      if (atBottomRef.current) scrollToEnd('smooth');
      else setNewBelow((n) => n + 1);
    }

    lastCountRef.current = messages.length;
    lastHeightRef.current = el.scrollHeight;
  }, [messages, hidden]);

  // Switching chats resets the viewport instead of inheriting it.
  useEffect(() => {
    atBottomRef.current = true;
    setNewBelow(0);
    setDraft('');
    setPicked(null);
  }, [chat?.id]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    atBottomRef.current = near;
    if (near) setNewBelow(0);
  };

  // ── typing ─────────────────────────────────────────────────────────────────
  const noteTyping = () => {
    const now = Date.now();
    if (now - typingSentRef.current < 3200) return;
    typingSentRef.current = now;
    onTyping?.(true);
  };

  const submit = () => {
    const text = draft.trim();
    if (!text || sending) return;
    onSend(text, reply?.id || null);
    setDraft('');
    setEmojiOpen(false);
    onCancelReply?.();
    onTyping?.(false);
    typingSentRef.current = 0;
    atBottomRef.current = true;
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape' && reply) onCancelReply?.();
  };

  // auto-grow the composer, capped so it never eats the conversation
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [draft]);

  const subtitle = isGroup
    ? `${chat?.members?.length || 0} member${(chat?.members?.length || 0) === 1 ? '' : 's'}${chat?.isMain ? ' · everyone welcome' : ''}`
    : chat?.peer?.online
      ? 'online'
      : 'tap for contact info';

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: 'var(--bg)' }}>
      {/* ── header ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line-soft)', zIndex: 5 }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to chats"
          className="md:hidden"
          style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4, display: 'grid', placeItems: 'center' }}
        >
          <Icons.ChevronLeft size={22} />
        </button>

        <button
          type="button"
          onClick={onInfo}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <Avatar avatar={chat?.avatar} label={chat?.title} size={40} online={!isGroup && chat?.peer?.online} ring={!!chat?.isMain} />
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-extrabold" style={{ color: 'var(--ink)' }}>
              {chat?.title || 'Conversation'}
            </p>
            <p className="truncate text-[11px] font-semibold" style={{ color: typing.length ? 'var(--brand)' : 'var(--dim)' }}>
              {typing.length ? (
                <span className="inline-flex items-center gap-1.5">
                  <TypingDots />
                  {typing.length === 1 ? `${typing[0].split(' ')[0]} is typing…` : `${typing.length} people are typing…`}
                </span>
              ) : subtitle}
            </p>
          </div>
        </button>

        <IconButton label="Conversation info" onClick={onInfo}>
          <Icons.MoreVertical size={18} />
        </IconButton>
      </div>

      {/* ── messages ───────────────────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-full overflow-y-auto px-3 pb-3 md:px-6"
          style={{
            backgroundImage: 'radial-gradient(var(--brand-a08) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        >
          {hasMore && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={onLoadOlder}
                disabled={loadingOlder}
                className="rounded-full px-3 py-1 text-[11px] font-bold"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)', cursor: 'pointer' }}
              >
                {loadingOlder ? 'Loading…' : 'Load earlier messages'}
              </button>
            </div>
          )}

          {!messages.length && (
            <div className="grid h-full place-items-center px-6">
              <div className="max-w-[320px] text-center">
                <div className="mx-auto mb-3" style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--brand-tint)', color: 'var(--brand)', display: 'grid', placeItems: 'center' }}>
                  {isGroup ? <Icons.Users size={26} /> : <Icons.Chat size={26} />}
                </div>
                <p className="text-[13px] font-extrabold" style={{ color: 'var(--ink)' }}>
                  {isGroup ? `Welcome to ${chat?.title}` : `Say hello to ${chat?.title}`}
                </p>
                <p className="mt-1 text-[11.5px]" style={{ color: 'var(--dim)' }}>
                  {isGroup
                    ? 'This is the start of the group. Messages are visible to its members only.'
                    : 'This is the start of your private conversation. Only the two of you can read it.'}
                </p>
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const divider = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
            const grouped = !divider && prev.senderId === m.senderId && prev.kind !== 'system' && m.kind !== 'system'
              && (new Date(m.createdAt) - new Date(prev.createdAt)) < 5 * 60 * 1000;

            if (m.kind === 'system') {
              return (
                <div key={m.id} className="my-2 flex justify-center">
                  <span
                    className="rounded-full px-3 py-1 text-[10.5px] font-semibold"
                    style={{ background: 'var(--surface-2)', color: 'var(--dim)', border: '1px solid var(--line-soft)' }}
                  >
                    {m.body}
                  </span>
                </div>
              );
            }

            const mine = m.mine;
            const showActions = picked === m.id;

            return (
              <div key={m.id}>
                {divider && (
                  <div className="my-3 flex justify-center">
                    <span
                      className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide"
                      style={{ background: 'var(--surface)', border: '1px solid var(--line-soft)', color: 'var(--dim)' }}
                    >
                      {dayLabel(m.createdAt)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  style={{ marginTop: grouped ? 2 : 8 }}
                >
                  {!mine && (
                    <div style={{ width: 30, flex: '0 0 30px', marginRight: 8, alignSelf: 'flex-end' }}>
                      {!grouped && (
                        <Avatar avatar={m.senderAvatar} label={m.senderName} size={30} />
                      )}
                    </div>
                  )}

                  <div className="relative" style={{ maxWidth: 'min(78%, 520px)' }}>
                    <div
                      onClick={() => setPicked(showActions ? null : m.id)}
                      style={{
                        background: mine ? 'var(--brand)' : 'var(--surface)',
                        color: mine ? '#fff' : 'var(--ink)',
                        border: mine ? '1px solid transparent' : '1px solid var(--line-soft)',
                        borderRadius: 14,
                        borderTopRightRadius: mine ? (grouped ? 6 : 4) : 14,
                        borderTopLeftRadius: !mine ? (grouped ? 6 : 4) : 14,
                        padding: '7px 10px 6px',
                        boxShadow: 'var(--shadow-xs)',
                        cursor: 'pointer',
                        opacity: m.pending ? 0.72 : 1,
                      }}
                    >
                      {isGroup && !mine && !grouped && (
                        <p className="mb-0.5 text-[11px] font-extrabold" style={{ color: m.senderAvatar?.ink || 'var(--brand)' }}>
                          {m.senderName}
                        </p>
                      )}

                      {m.reply && (
                        <div
                          className="mb-1.5 rounded-md px-2 py-1"
                          style={{
                            background: mine ? 'rgba(255,255,255,0.16)' : 'var(--brand-a06)',
                            borderLeft: `3px solid ${mine ? 'rgba(255,255,255,0.65)' : 'var(--brand)'}`,
                          }}
                        >
                          <p className="text-[10.5px] font-extrabold" style={{ color: mine ? 'rgba(255,255,255,0.95)' : 'var(--brand)' }}>
                            {m.reply.name}
                          </p>
                          <p className="truncate text-[11px]" style={{ color: mine ? 'rgba(255,255,255,0.85)' : 'var(--muted)' }}>
                            {m.reply.deleted ? 'Message deleted' : m.reply.body || 'Photo'}
                          </p>
                        </div>
                      )}

                      {m.deleted ? (
                        <p className="text-[12.5px] italic" style={{ opacity: 0.75 }}>
                          This message was deleted
                        </p>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-[13px]" style={{ lineHeight: 1.45 }}>
                          {m.body}
                        </p>
                      )}

                      <div className="mt-1 flex items-center justify-end gap-1" style={{ opacity: mine ? 0.85 : 0.65 }}>
                        <span className="text-[10px]" style={{ fontWeight: 600 }}>
                          {clock(m.createdAt)}
                        </span>
                        {mine && (m.pending ? <PendingClock /> : <Ticks status={m.status} />)}
                      </div>
                    </div>

                    {showActions && !m.pending && !m.deleted && (
                      <div
                        className={`absolute z-10 flex items-center gap-1 rounded-full px-1.5 py-1 ${mine ? 'right-0' : 'left-0'}`}
                        style={{
                          top: '100%',
                          marginTop: 4,
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          boxShadow: 'var(--shadow-md)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => { onReply(m); setPicked(null); }}
                          className="rounded-full px-2 py-1 text-[11px] font-bold"
                          style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                        >
                          Reply
                        </button>
                        {(mine || canModerate) && (
                          <button
                            type="button"
                            onClick={() => { onDelete(m.id); setPicked(null); }}
                            className="rounded-full px-2 py-1 text-[11px] font-bold"
                            style={{ background: 'transparent', border: 'none', color: 'var(--bad)', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        )}
                        {QUICK_REACTIONS.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => { setDraft((d) => `${d}${r}`); setPicked(null); }}
                            aria-label={`Insert ${r}`}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {typing.length > 0 && (
            <div className="mt-2 flex justify-start">
              <div className="rounded-2xl px-3 py-2" style={{ background: 'var(--surface)', border: '1px solid var(--line-soft)' }}>
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={endRef} />
          <div style={{ height: 8 }} />
        </div>

        {newBelow > 0 && (
          <button
            type="button"
            onClick={() => scrollToEnd('smooth')}
            className="absolute left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[11.5px] font-bold"
            style={{ bottom: 12, background: 'var(--brand)', color: '#fff', border: 'none', boxShadow: 'var(--shadow-md)', cursor: 'pointer' }}
          >
            {newBelow} new message{newBelow === 1 ? '' : 's'} ↓
          </button>
        )}
      </div>

      {/* ── composer ───────────────────────────────────────────────────── */}
      <div className="px-2.5 pb-2.5 pt-2 md:px-4" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line-soft)' }}>
        {reply && (
          <div
            className="mb-2 flex items-start gap-2 rounded-lg px-2.5 py-1.5"
            style={{ background: 'var(--brand-a06)', borderLeft: '3px solid var(--brand)' }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-extrabold" style={{ color: 'var(--brand)' }}>
                Replying to {reply.senderName}
              </p>
              <p className="truncate text-[11px]" style={{ color: 'var(--muted)' }}>
                {reply.deleted ? 'Message deleted' : reply.body}
              </p>
            </div>
            <button type="button" onClick={onCancelReply} aria-label="Cancel reply" style={{ background: 'transparent', border: 'none', color: 'var(--dim)', cursor: 'pointer' }}>
              <Icons.X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="relative">
            <IconButton label="Emoji" onClick={() => setEmojiOpen((v) => !v)} active={emojiOpen}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>🙂</span>
            </IconButton>
            {emojiOpen && (
              <EmojiTray
                onPick={(e) => setDraft((d) => `${d}${e}`)}
                onClose={() => setEmojiOpen(false)}
              />
            )}
          </div>

          <div
            className="flex min-w-0 flex-1 items-end"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--line-soft)', borderRadius: 20, padding: '4px 10px' }}
          >
            <textarea
              ref={areaRef}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); noteTyping(); }}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={chat ? (isGroup ? 'Message the group' : `Message ${chat.title}`) : 'Type a message'}
              aria-label="Message"
              className="w-full resize-none bg-transparent py-1.5 text-[13px] outline-none"
              style={{ color: 'var(--ink)', maxHeight: 132 }}
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || sending}
            aria-label="Send message"
            style={{
              width: 42,
              height: 42,
              flex: '0 0 42px',
              borderRadius: '50%',
              background: draft.trim() ? 'var(--brand)' : 'var(--surface-3)',
              color: draft.trim() ? '#fff' : 'var(--dim)',
              border: 'none',
              display: 'grid',
              placeItems: 'center',
              cursor: draft.trim() ? 'pointer' : 'default',
              transition: 'background 0.18s ease',
            }}
          >
            <Icons.Send size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
