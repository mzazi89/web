'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/community/Thread.jsx — one conversation.
//
// The behaviour that makes a chat window feel finished, rather than merely work:
//   * consecutive messages from the same person are grouped, so a burst reads as
//     one turn instead of ten separate bubbles
//   * a day divider whenever the date changes
//   * new messages only yank the viewport when you were already at the bottom;
//     older pages keep your place because the inserted height is added back
//   * photos open in a viewer, voice notes play in place, reactions sit on the
//     bubble, and the delete affordance lives on the message itself
//   * optimistic sends render immediately with a clock, then settle into ticks
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icons, useToast } from '@/components/ui';
import {
  Avatar, EmojiTray, IconButton, Ticks, TypingDots,
  clock, dayKey, dayLabel, fmtDuration, waveform,
  MicIcon, CameraIcon,
} from './parts';
import { prepareImage, pickAudioMime, canRecord, MAX_RECORD_MS } from './media';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function PendingClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-label="Sending" role="img">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read that recording'));
    reader.readAsDataURL(blob);
  });

// ─── one voice note ──────────────────────────────────────────────────────────

function VoiceNote({ message, mine, onBroken }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const bars = waveform(message.id);

  const toggle = (e) => {
    e.stopPropagation();
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().then(() => setPlaying(true)).catch(() => onBroken?.());
    }
  };

  const tint = mine ? 'rgba(255,255,255,0.92)' : 'var(--brand)';
  const dim = mine ? 'rgba(255,255,255,0.42)' : 'var(--line)';

  return (
    <div className="flex items-center gap-2.5" style={{ minWidth: 196 }}>
      <audio
        ref={audioRef}
        src={message.media?.url}
        preload="none"
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          const total = el.duration || (message.media?.durationMs || 1) / 1000;
          setProgress(total ? Math.min(1, el.currentTime / total) : 0);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onError={() => onBroken?.()}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
        style={{
          width: 34, height: 34, flex: '0 0 34px', borderRadius: '50%',
          display: 'grid', placeItems: 'center', cursor: 'pointer', border: 'none',
          background: mine ? 'rgba(255,255,255,0.22)' : 'var(--brand-a12)',
          color: mine ? '#fff' : 'var(--brand)',
        }}
      >
        {playing ? <Icons.Pause size={15} /> : <Icons.Play size={15} />}
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-[2px]" style={{ height: 26 }} aria-hidden="true">
          {bars.map((h, i) => (
            <span
              key={i}
              style={{
                flex: '1 1 0',
                height: `${Math.round(h * 100)}%`,
                minWidth: 2,
                borderRadius: 2,
                background: i / bars.length <= progress ? tint : dim,
              }}
            />
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between" style={{ opacity: 0.85 }}>
          <span className="text-[10px]" style={{ fontWeight: 600 }}>{fmtDuration(message.media?.durationMs)}</span>
          <span className="text-[9.5px]" style={{ fontWeight: 600 }}>voice note</span>
        </div>
      </div>
    </div>
  );
}

// ─── the thread ──────────────────────────────────────────────────────────────

export default function Thread({
  chat,
  me,
  messages = [],
  typing = [],
  hasMore,
  loadingOlder,
  sending,
  uploading,
  reply,
  onReply,
  onCancelReply,
  onSend,
  onSendMedia,
  onReact,
  onOpenMedia,
  onDelete,
  onBack,
  onInfo,
  onLoadOlder,
  onTyping,
  hidden = false,
}) {
  const toast = useToast();

  const [draft, setDraft] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const [newBelow, setNewBelow] = useState(0);

  // attachment being composed
  const [image, setImage] = useState(null);        // { data, width, height, mime }
  const [caption, setCaption] = useState('');
  const [preparing, setPreparing] = useState(false);

  // recorder
  const [rec, setRec] = useState({ active: false, ms: 0 });
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recStartRef = useRef(0);
  const recTimerRef = useRef(null);
  const recIntentRef = useRef('send');            // 'send' | 'discard'

  const scrollRef = useRef(null);
  const areaRef = useRef(null);
  const fileRef = useRef(null);
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

  // Switching chats resets the composer, not the server state.
  useEffect(() => {
    atBottomRef.current = true;
    setNewBelow(0);
    setDraft('');
    setPicked(null);
    setImage(null);
    setCaption('');
    setEmojiOpen(false);
  }, [chat?.id]);

  // Never leave the microphone hot when the pane unmounts.
  useEffect(() => () => {
    clearInterval(recTimerRef.current);
    try { recorderRef.current?.stop(); } catch {}
    try { recorderRef.current?.stream?.getTracks?.().forEach((t) => t.stop()); } catch {}
  }, []);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    atBottomRef.current = near;
    if (near) setNewBelow(0);
  };

  // ── text ───────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [draft]);

  // ── photos ─────────────────────────────────────────────────────────────────
  const pickPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPreparing(true);
    try {
      const prepared = await prepareImage(file);
      setImage(prepared);
    } catch (e) {
      toast.error(e.message || 'Could not use that photo');
    } finally {
      setPreparing(false);
    }
  };

  const sendImage = () => {
    if (!image || uploading) return;
    onSendMedia?.(
      { kind: 'image', data: image.data, width: image.width, height: image.height, caption: caption.trim() },
      reply?.id || null
    );
    setImage(null);
    setCaption('');
    onCancelReply?.();
    atBottomRef.current = true;
  };

  // ── voice notes ────────────────────────────────────────────────────────────
  const stopTimer = () => {
    clearInterval(recTimerRef.current);
    recTimerRef.current = null;
  };

  const finishRecording = async (blob, ms) => {
    if (!blob || !blob.size || recIntentRef.current === 'discard') {
      setRec({ active: false, ms: 0 });
      return;
    }
    try {
      const data = await blobToDataUrl(blob);
      onSendMedia?.(
        { kind: 'audio', data, durationMs: Math.max(800, ms), caption: caption.trim() },
        reply?.id || null
      );
      setCaption('');
      onCancelReply?.();
      atBottomRef.current = true;
    } catch (e) {
      toast.error(e.message || 'Could not send that voice note');
    } finally {
      setRec({ active: false, ms: 0 });
    }
  };

  const startRecording = async () => {
    if (rec.active) return;
    if (!canRecord()) {
      toast.error('This browser cannot record audio.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickAudioMime();
      const recorder = new MediaRecorder(stream, {
        ...(mime ? { mimeType: mime } : {}),
        audioBitsPerSecond: 32000,
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stopTimer();
        stream.getTracks().forEach((t) => t.stop());
        const ms = Date.now() - recStartRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        await finishRecording(blob, ms);
      };

      recIntentRef.current = 'send';
      recorderRef.current = recorder;
      recStartRef.current = Date.now();
      recorder.start();
      setRec({ active: true, ms: 0 });
      setEmojiOpen(false);

      recTimerRef.current = setInterval(() => {
        const ms = Date.now() - recStartRef.current;
        setRec({ active: true, ms });
        if (ms >= MAX_RECORD_MS) {
          recIntentRef.current = 'send';
          try { recorder.stop(); } catch {}
        }
      }, 200);
    } catch {
      toast.error('Microphone permission was refused.');
    }
  };

  const stopRecording = (intent) => {
    recIntentRef.current = intent;
    try { recorderRef.current?.stop(); } catch { setRec({ active: false, ms: 0 }); }
    stopTimer();
  };

  // ── render ─────────────────────────────────────────────────────────────────
  // Groups read like a person list in WhatsApp ("You, Mercy, Brian +2") rather
  // than a count, which tells you who you are talking to without opening info.
  const memberNames = (chat?.members || []).map((m) => (m.id === me?.id ? 'You' : m.name.split(' ')[0]));
  const subtitle = isGroup
    ? `${memberNames.slice(0, 3).join(', ')}${memberNames.length > 3 ? ` +${memberNames.length - 3}` : ''}`
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
          <Avatar
            avatar={chat?.avatar}
            photo={!isGroup ? chat?.peer?.photo : null}
            label={chat?.title}
            size={40}
            online={!isGroup && chat?.peer?.online}
            ring={!!chat?.isMain}
          />
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
          className="h-full overflow-y-auto px-3 pb-2 md:px-6"
          style={{
            backgroundImage: 'radial-gradient(var(--brand-a08) 1px, transparent 0)',
            backgroundSize: '22px 22px',
            overscrollBehavior: 'contain',
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
            const isImage = m.media?.kind === 'image';
            const isAudio = m.media?.kind === 'audio';
            const hasReactions = (m.reactions || []).length > 0;

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
                        <Avatar avatar={m.senderAvatar} photo={m.senderPhoto} label={m.senderName} size={30} />
                      )}
                    </div>
                  )}

                  <div className="relative" style={{ maxWidth: 'min(82%, 520px)' }}>
                    <div
                      onClick={() => setPicked(showActions ? null : m.id)}
                      style={{
                        background: mine ? 'var(--brand)' : 'var(--surface)',
                        color: mine ? '#fff' : 'var(--ink)',
                        border: mine ? '1px solid transparent' : '1px solid var(--line-soft)',
                        borderRadius: 14,
                        borderTopRightRadius: mine ? (grouped ? 6 : 4) : 14,
                        borderTopLeftRadius: !mine ? (grouped ? 6 : 4) : 14,
                        padding: isImage ? 4 : '7px 10px 6px',
                        boxShadow: 'var(--shadow-xs)',
                        cursor: 'pointer',
                        opacity: m.pending ? 0.72 : 1,
                        overflow: 'hidden',
                      }}
                    >
                      {isGroup && !mine && !grouped && (
                        <p
                          className="mb-0.5 text-[11px] font-extrabold"
                          style={{ color: m.senderAvatar?.ink || 'var(--brand)', paddingLeft: isImage ? 6 : 0, paddingTop: isImage ? 4 : 0 }}
                        >
                          {m.senderName}
                        </p>
                      )}

                      {m.reply && (
                        <div
                          className="mb-1.5 rounded-md px-2 py-1"
                          style={{
                            background: mine ? 'rgba(255,255,255,0.16)' : 'var(--brand-a06)',
                            borderLeft: `3px solid ${mine ? 'rgba(255,255,255,0.65)' : 'var(--brand)'}`,
                            margin: isImage ? 4 : 0,
                          }}
                        >
                          <p className="text-[10.5px] font-extrabold" style={{ color: mine ? 'rgba(255,255,255,0.95)' : 'var(--brand)' }}>
                            {m.reply.name}
                          </p>
                          <p className="truncate text-[11px]" style={{ color: mine ? 'rgba(255,255,255,0.85)' : 'var(--muted)' }}>
                            {m.reply.deleted ? 'Message deleted' : m.reply.body || 'Attachment'}
                          </p>
                        </div>
                      )}

                      {m.deleted ? (
                        <p className="px-1 text-[12.5px] italic" style={{ opacity: 0.75 }}>
                          This message was deleted
                        </p>
                      ) : isImage ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onOpenMedia?.(m); }}
                          aria-label="Open photo"
                          style={{ display: 'block', border: 'none', background: 'transparent', padding: 0, cursor: 'zoom-in', width: '100%' }}
                        >
                          <img
                            src={m.media.url}
                            alt={m.body || 'Photo'}
                            loading="lazy"
                            decoding="async"
                            style={{
                              display: 'block',
                              width: '100%',
                              maxWidth: 280,
                              maxHeight: 320,
                              objectFit: 'cover',
                              borderRadius: 10,
                              background: 'var(--surface-3)',
                            }}
                          />
                        </button>
                      ) : isAudio ? (
                        <VoiceNote
                          message={m}
                          mine={mine}
                          onBroken={() => toast.error('That voice note could not be played')}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-[13px]" style={{ lineHeight: 1.45 }}>
                          {m.body}
                        </p>
                      )}

                      {isImage && m.body && (
                        <p className="whitespace-pre-wrap break-words px-1.5 pt-1.5 text-[12.5px]" style={{ lineHeight: 1.4 }}>
                          {m.body}
                        </p>
                      )}

                      <div
                        className="mt-1 flex items-center justify-end gap-1"
                        style={{
                          opacity: mine ? 0.9 : 0.65,
                          padding: isImage ? '0 6px 4px' : 0,
                          textShadow: isImage ? '0 1px 3px rgba(0,0,0,0.65)' : 'none',
                          color: isImage ? '#fff' : 'inherit',
                        }}
                      >
                        <span className="text-[10px]" style={{ fontWeight: 600 }}>
                          {clock(m.createdAt)}
                        </span>
                        {mine && (m.pending ? <PendingClock /> : <Ticks status={m.status} />)}
                      </div>
                    </div>

                    {hasReactions && (
                      <div className={`absolute flex gap-1 ${mine ? 'right-1' : 'left-1'}`} style={{ bottom: -11 }}>
                        {m.reactions.map((r) => (
                          <button
                            key={r.emoji}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onReact?.(m.id, r.emoji); }}
                            aria-label={`React ${r.emoji}`}
                            aria-pressed={r.mine}
                            className="flex items-center gap-1 rounded-full px-1.5"
                            style={{
                              background: r.mine ? 'var(--brand-a15)' : 'var(--surface)',
                              border: `1px solid ${r.mine ? 'var(--brand-a35)' : 'var(--line)'}`,
                              boxShadow: 'var(--shadow-xs)',
                              fontSize: 11,
                              lineHeight: '17px',
                              cursor: 'pointer',
                            }}
                          >
                            <span style={{ fontSize: 11.5 }}>{r.emoji}</span>
                            <span style={{ color: 'var(--muted)', fontWeight: 700 }}>{r.count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {showActions && !m.pending && !m.deleted && (
                      <div
                        className={`absolute z-10 flex items-center gap-0.5 rounded-full px-1 py-0.5 ${mine ? 'right-0' : 'left-0'}`}
                        style={{
                          top: '100%',
                          marginTop: hasReactions ? 10 : 4,
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          boxShadow: 'var(--shadow-md)',
                        }}
                      >
                        {REACTIONS.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onReact?.(m.id, r); setPicked(null); }}
                            aria-label={`React ${r}`}
                            className="rounded-full"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, padding: '2px 3px' }}
                          >
                            {r}
                          </button>
                        ))}
                        <span style={{ width: 1, height: 16, background: 'var(--line)' }} />
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
      <div
        className="px-2.5 pt-2 md:px-4"
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--line-soft)',
          // The shell is measured to the top of the dock, which already carries
          // the home-indicator inset — adding it again here left a dead strip.
          paddingBottom: 8,
        }}
      >
        {reply && !rec.active && (
          <div
            className="mb-2 flex items-start gap-2 rounded-lg px-2.5 py-1.5"
            style={{ background: 'var(--brand-a06)', borderLeft: '3px solid var(--brand)' }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-extrabold" style={{ color: 'var(--brand)' }}>
                Replying to {reply.senderName}
              </p>
              <p className="truncate text-[11px]" style={{ color: 'var(--muted)' }}>
                {reply.deleted ? 'Message deleted' : reply.body || (reply.media?.kind === 'image' ? '📷 Photo' : '🎙 Voice note')}
              </p>
            </div>
            <button type="button" onClick={onCancelReply} aria-label="Cancel reply" style={{ background: 'transparent', border: 'none', color: 'var(--dim)', cursor: 'pointer' }}>
              <Icons.X size={14} />
            </button>
          </div>
        )}

        {/* photo being composed */}
        {image && !rec.active && (
          <div className="mb-2 flex items-start gap-2 rounded-xl p-2" style={{ background: 'var(--bg-2)', border: '1px solid var(--line-soft)' }}>
            <img
              src={image.data}
              alt="Attachment preview"
              style={{ width: 62, height: 62, objectFit: 'cover', borderRadius: 10, flex: '0 0 62px' }}
            />
            <div className="min-w-0 flex-1">
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 600))}
                placeholder="Add a caption…"
                aria-label="Photo caption"
                className="w-full rounded-lg px-2 py-1.5 text-[12.5px] outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendImage(); } }}
              />
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={sendImage}
                  disabled={uploading}
                  className="rounded-full px-3 py-1 text-[11.5px] font-extrabold"
                  style={{ background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  {uploading ? 'Sending…' : 'Send photo'}
                </button>
                <button
                  type="button"
                  onClick={() => { setImage(null); setCaption(''); }}
                  className="rounded-full px-3 py-1 text-[11.5px] font-bold"
                  style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--muted)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* recording */}
        {rec.active ? (
          <div className="flex items-center gap-3 rounded-full px-3 py-2" style={{ background: 'var(--bad-a08)', border: '1px solid var(--bad-a25)' }}>
            <button
              type="button"
              onClick={() => stopRecording('discard')}
              aria-label="Discard recording"
              style={{ background: 'transparent', border: 'none', color: 'var(--bad)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            >
              <Icons.Trash size={17} />
            </button>
            <span className="flex items-center gap-1.5 text-[12px] font-extrabold" style={{ color: 'var(--bad)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bad)', animation: 'comPulse 1.1s infinite ease-in-out' }} />
              {fmtDuration(rec.ms)}
            </span>
            <div className="flex flex-1 items-center gap-[3px]" aria-hidden="true" style={{ height: 22 }}>
              {waveform(Math.floor(rec.ms / 200) + 3, 32).map((h, i) => (
                <span key={i} style={{ flex: '1 1 0', height: `${Math.round(h * 100)}%`, minWidth: 2, borderRadius: 2, background: 'var(--bad)', opacity: 0.55 }} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => stopRecording('send')}
              aria-label="Send voice note"
              style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--brand)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
            >
              <Icons.Send size={17} />
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} />

            <IconButton label="Attach a photo" onClick={() => fileRef.current?.click()} active={preparing}>
              <CameraIcon size={19} />
            </IconButton>

            <div className="relative">
              <IconButton label="Emoji" onClick={() => setEmojiOpen((v) => !v)} active={emojiOpen}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>🙂</span>
              </IconButton>
              {emojiOpen && (
                <EmojiTray onPick={(e) => setDraft((d) => `${d}${e}`)} onClose={() => setEmojiOpen(false)} />
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

            {draft.trim() ? (
              <button
                type="button"
                onClick={submit}
                disabled={sending}
                aria-label="Send message"
                style={{
                  width: 42, height: 42, flex: '0 0 42px', borderRadius: '50%',
                  background: 'var(--brand)', color: '#fff', border: 'none',
                  display: 'grid', placeItems: 'center', cursor: 'pointer',
                }}
              >
                <Icons.Send size={19} />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                aria-label="Record a voice note"
                style={{
                  width: 42, height: 42, flex: '0 0 42px', borderRadius: '50%',
                  background: 'var(--brand-a12)', color: 'var(--brand)',
                  border: '1px solid var(--brand-a25)', display: 'grid', placeItems: 'center', cursor: 'pointer',
                }}
              >
                <MicIcon size={19} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
