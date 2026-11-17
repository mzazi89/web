'use client';

// ─────────────────────────────────────────────────────────────────────────────
// /community — messages.
//
// A WhatsApp-shaped screen over the model in lib/community.js: a rail of
// conversations on the left, one thread on the right, and on a phone one pane at
// a time. Everything the page shows comes from a single poll (/api/community/sync)
// every 2.6s while the tab is visible; there is no separate "unread" endpoint and
// no websocket to keep alive on a free plan.
//
// The page owns three kinds of state and keeps them apart on purpose:
//   * server state (chats, chat, messages, typing) — replaced by the poll
//   * view state (open chat, mobile pane, reply target, modals) — never polled
//   * optimistic state (a message being sent) — merged in and reconciled by id
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AppBackground, Icons, Modal, ConfirmDialog, useToast } from '@/components/ui';
import SignInGate from '@/components/SignInGate';
import ChatList from '@/components/community/ChatList';
import Thread from '@/components/community/Thread';
import PeoplePicker from '@/components/community/PeoplePicker';
import { Avatar } from '@/components/community/parts';

const SOUND = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';
const POLL_MS = 2600;

export default function CommunityPage() {
  const toast = useToast();

  const [needAuth, setNeedAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [chats, setChats] = useState([]);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [chatId, setChatId] = useState(0);
  const [pane, setPane] = useState('list');
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState(null);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupPeople, setGroupPeople] = useState([]);
  const [creating, setCreating] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [renameTo, setRenameTo] = useState('');
  const [addingOpen, setAddingOpen] = useState(false);
  const [toAdd, setToAdd] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);

  const chatIdRef = useRef(0);
  const lastIdRef = useRef(0);
  const readRef = useRef(0);
  const busyRef = useRef(false);
  const readTimer = useRef(null);
  const messagesRef = useRef([]);
  const soundRef = useRef(true);
  const audioRef = useRef(null);
  const mountedRef = useRef(false);

  messagesRef.current = messages;

  // ── preferences ────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mzazi:community:sound');
      if (saved !== null) setSoundOn(saved === '1');
    } catch {}
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    soundRef.current = soundOn;
    try { localStorage.setItem('mzazi:community:sound', soundOn ? '1' : '0'); } catch {}
  }, [soundOn]);

  // Unread in the tab title, restored on the way out.
  useEffect(() => {
    const base = document.title;
    document.title = unreadTotal > 0 ? `(${unreadTotal}) Community · MZAZI TECH` : 'Community · MZAZI TECH';
    return () => { document.title = base; };
  }, [unreadTotal]);

  const playPing = () => {
    const el = audioRef.current;
    if (!el) return;
    try { el.currentTime = 0; el.play().catch(() => {}); } catch {}
  };

  // ── the poll ───────────────────────────────────────────────────────────────
  const pull = useCallback(async ({ reset = false, before = 0 } = {}) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const params = new URLSearchParams();
      if (chatIdRef.current) params.set('chat', String(chatIdRef.current));
      if (before) params.set('before', String(before));
      else if (!reset && lastIdRef.current) params.set('after', String(lastIdRef.current));

      const res = await fetch(`/api/community/sync?${params.toString()}`, { cache: 'no-store' });
      if (res.status === 401) { setNeedAuth(true); return; }
      if (!res.ok) return;

      const data = await res.json();
      if (!mountedRef.current) return;

      setMe(data.me);
      setChats(Array.isArray(data.chats) ? data.chats : []);
      setUnreadTotal(data.unreadTotal || 0);
      setTyping(Array.isArray(data.typing) ? data.typing : []);
      setHasMore(!!data.more);

      if (!data.chat) return;
      const switched = data.chat.id !== chatIdRef.current;
      if (switched) {
        chatIdRef.current = data.chat.id;
        setChatId(data.chat.id);
      }
      setChat(data.chat);

      const incoming = Array.isArray(data.messages) ? data.messages : [];

      if (before) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...incoming.filter((m) => !seen.has(m.id)), ...prev];
        });
        return;
      }

      if (reset || switched) {
        setMessages(incoming);
        lastIdRef.current = incoming.reduce((n, m) => Math.max(n, m.id), 0);
        readRef.current = 0;
        return;
      }

      if (!incoming.length) return;

      // A message we just posted can arrive here before its POST response does.
      // Drop the optimistic copy by body match so the bubble does not double up.
      const realBodies = new Set(incoming.filter((m) => m.mine && !m.pending).map((m) => m.body));
      setMessages((prev) => {
        const keep = prev.filter((m) => !(m.pending && m.mine && realBodies.has(m.body)));
        const seen = new Set(keep.map((m) => m.id));
        return [...keep, ...incoming.filter((m) => !seen.has(m.id))];
      });
      lastIdRef.current = Math.max(lastIdRef.current, ...incoming.map((m) => m.id));

      if (incoming.some((m) => !m.mine) && soundRef.current) playPing();
    } catch {
      /* a dropped poll is not an error state — the next one retries */
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    pull({ reset: true });
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') pull();
    }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') pull(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(readTimer.current);
    };
  }, [pull]);

  // ── read receipts ──────────────────────────────────────────────────────────
  useEffect(() => {
    const id = chatIdRef.current;
    if (!id || needAuth) return;
    const maxId = messages.reduce((n, m) => Math.max(n, m.pending ? 0 : m.id), 0);
    if (!maxId || maxId <= readRef.current) return;
    readRef.current = maxId;
    if (document.visibilityState !== 'visible') return;

    clearTimeout(readTimer.current);
    readTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/community/chats/${id}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upTo: maxId }),
        });
        // The list badge and the sender's blue ticks both come from the server,
        // so refresh once after the mark lands.
        pull();
      } catch {}
    }, 450);
  }, [messages, needAuth, pull]);

  // ── actions ────────────────────────────────────────────────────────────────
  const openChat = useCallback(async (id) => {
    chatIdRef.current = id;
    lastIdRef.current = 0;
    readRef.current = 0;
    setChatId(id);
    setMessages([]);
    setReply(null);
    setPane('chat');
    await pull({ reset: true });
  }, [pull]);

  const send = useCallback(async (body, replyTo) => {
    const id = chatIdRef.current;
    if (!id) return;
    const target = replyTo ? messagesRef.current.find((m) => m.id === replyTo) : null;
    const tempId = -Date.now();

    setMessages((prev) => [...prev, {
      id: tempId,
      chatId: id,
      senderId: me?.id,
      senderName: me?.name || 'You',
      senderAvatar: null,
      body,
      kind: 'text',
      mine: true,
      pending: true,
      status: 'sent',
      readBy: 0,
      reply: target ? { id: target.id, name: target.senderName, body: target.body, deleted: !!target.deleted } : null,
      createdAt: new Date().toISOString(),
    }]);
    setSending(true);

    try {
      const res = await fetch(`/api/community/chats/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, replyTo: replyTo || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send that message');

      setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
      lastIdRef.current = Math.max(lastIdRef.current, data.message.id);
      readRef.current = Math.max(readRef.current, data.message.id);
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }, [me, toast]);

  const removeMessage = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/community/messages/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete that message');
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, deleted: true, body: '' } : m)));
    } catch (e) {
      toast.error(e.message);
    }
  }, [toast]);

  const noteTyping = useCallback((isTyping) => {
    const id = chatIdRef.current;
    if (!id) return;
    fetch(`/api/community/chats/${id}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ typing: isTyping }),
    }).catch(() => {});
  }, []);

  const loadOlder = useCallback(async () => {
    const id = chatIdRef.current;
    const oldest = messagesRef.current.find((m) => m.id > 0);
    if (!id || !oldest) return;
    setLoadingOlder(true);
    await pull({ before: oldest.id });
    setLoadingOlder(false);
  }, [pull]);

  const openDm = useCallback(async (person) => {
    try {
      const res = await fetch('/api/community/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'dm', peerId: person.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not open that chat');
      setNewChatOpen(false);
      await openChat(data.chatId);
    } catch (e) {
      toast.error(e.message);
    }
  }, [openChat, toast]);

  const createGroup = useCallback(async () => {
    const title = groupTitle.trim();
    if (title.length < 2) { toast.error('Give the group a name'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/community/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'group', title, memberIds: groupPeople.map((p) => p.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create the group');
      setNewGroupOpen(false);
      setGroupTitle('');
      setGroupPeople([]);
      toast.success('Group created');
      await openChat(data.chatId);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }, [groupTitle, groupPeople, openChat, toast]);

  const patchChat = useCallback(async (payload) => {
    const id = chatIdRef.current;
    if (!id) return false;
    setWorking(true);
    try {
      const res = await fetch(`/api/community/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update the conversation');
      await pull();
      return true;
    } catch (e) {
      toast.error(e.message);
      return false;
    } finally {
      setWorking(false);
    }
  }, [pull, toast]);

  const deleteChat = useCallback(async () => {
    const id = chatIdRef.current;
    if (!id) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/community/chats/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete the conversation');
      setInfoOpen(false);
      setPane('list');
      chatIdRef.current = 0;
      setChatId(0);
      setMessages([]);
      setChat(null);
      await pull({ reset: true });
      toast.success(data.cleared ? 'Chat removed from your list' : 'Group deleted');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWorking(false);
      setConfirm(null);
    }
  }, [pull, toast]);

  const leaveChat = useCallback(async () => {
    const ok = await patchChat({ leave: true });
    if (!ok) { setConfirm(null); return; }
    setInfoOpen(false);
    setPane('list');
    chatIdRef.current = 0;
    setChatId(0);
    setMessages([]);
    setChat(null);
    await pull({ reset: true });
    setConfirm(null);
  }, [patchChat, pull]);

  // ── derived ────────────────────────────────────────────────────────────────
  const canManage = chat?.myRole === 'owner' || chat?.myRole === 'admin';
  const memberIds = useMemo(() => (chat?.members || []).map((m) => m.id), [chat]);
  const isGroup = chat?.kind === 'group';

  // Keep the rename field in step with whatever the server says the name is.
  useEffect(() => {
    if (infoOpen) {
      setRenameTo(chat?.title || '');
      setAddingOpen(false);
      setToAdd([]);
    }
  }, [infoOpen, chat?.title]);

  return (
    <AppBackground orbs>
      <audio ref={audioRef} src={SOUND} preload="auto" />

      <div className="container-site" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <div className="mb-3 hidden items-end justify-between md:flex">
          <div>
            <p className="text-[10.5px] font-extrabold uppercase tracking-[0.14em]" style={{ color: 'var(--dim)' }}>
              Messages
            </p>
            <h1 className="text-2xl font-extrabold" style={{ color: 'var(--ink)' }}>Community</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[11.5px]" style={{ color: 'var(--dim)' }}>
              Talk to anyone here · create a group · everything stays in this panel
            </p>
            <Link href="/" className="text-[11.5px] font-bold" style={{ color: 'var(--brand)' }}>
              Back to site
            </Link>
          </div>
        </div>

        {needAuth ? (
          <div className="mx-auto max-w-[460px] pt-6">
            <SignInGate
              title="Sign in to message the community"
              description="Conversations are private to the people in them, so we need to know who you are. Your account is free."
              next="/community"
              icon={<Icons.Chat size={26} />}
            />
          </div>
        ) : (
          <div
            className="grid overflow-hidden md:grid-cols-[320px_minmax(0,1fr)]"
            style={{
              height: 'calc(100dvh - 148px)',
              minHeight: 520,
              maxHeight: 900,
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-xl)',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-sm)',
              backdropFilter: 'blur(var(--glass-blur))',
            }}
          >
            <div className={pane === 'chat' ? 'hidden min-h-0 md:block' : 'min-h-0'}>
              <ChatList
                chats={chats}
                activeId={chatId || chat?.id}
                me={me}
                query={query}
                onQuery={setQuery}
                onPick={openChat}
                onNewChat={() => setNewChatOpen(true)}
                onNewGroup={() => setNewGroupOpen(true)}
                soundOn={soundOn}
                onToggleSound={() => setSoundOn((v) => !v)}
                loading={loading}
              />
            </div>

            <div className={pane === 'chat' ? 'min-h-0' : 'hidden min-h-0 md:block'}>
              <Thread
                chat={chat}
                me={me}
                messages={messages}
                typing={typing}
                hasMore={hasMore}
                loadingOlder={loadingOlder}
                sending={sending}
                reply={reply}
                onReply={(m) => setReply(m)}
                onCancelReply={() => setReply(null)}
                onSend={send}
                onDelete={removeMessage}
                onBack={() => setPane('list')}
                onInfo={() => setInfoOpen(true)}
                onLoadOlder={loadOlder}
                onTyping={noteTyping}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── new chat ───────────────────────────────────────────────────────── */}
      <Modal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        title="New chat"
        description="Pick anyone with a MZAZI account. The conversation is private to the two of you."
        size="sm"
      >
        <PeoplePicker mode="dm" onPick={openDm} />
      </Modal>

      {/* ── new group ──────────────────────────────────────────────────────── */}
      <Modal
        open={newGroupOpen}
        onClose={() => setNewGroupOpen(false)}
        title="New group"
        description="Name it, add the people you want, and you are the owner."
        footer={(
          <>
            <button
              type="button"
              onClick={() => setNewGroupOpen(false)}
              className="rounded-full px-4 py-2 text-[12.5px] font-bold"
              style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--muted)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createGroup}
              disabled={creating || groupTitle.trim().length < 2}
              className="rounded-full px-5 py-2 text-[12.5px] font-extrabold"
              style={{
                background: groupTitle.trim().length >= 2 ? 'var(--brand)' : 'var(--surface-3)',
                color: groupTitle.trim().length >= 2 ? '#fff' : 'var(--dim)',
                border: 'none',
                cursor: creating || groupTitle.trim().length < 2 ? 'default' : 'pointer',
              }}
            >
              {creating ? 'Creating…' : `Create${groupPeople.length ? ` · ${groupPeople.length} member${groupPeople.length === 1 ? '' : 's'}` : ''}`}
            </button>
          </>
        )}
      >
        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-bold" style={{ color: 'var(--muted)' }}>Group name</span>
          <input
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value.slice(0, 80))}
            placeholder="e.g. Bot resellers"
            maxLength={80}
            className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--line-soft)', color: 'var(--ink)' }}
          />
        </label>

        {groupPeople.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {groupPeople.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setGroupPeople((prev) => prev.filter((x) => x.id !== p.id))}
                className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[11.5px] font-bold"
                style={{ background: 'var(--brand-a10)', border: '1px solid var(--brand-a25)', color: 'var(--brand)', cursor: 'pointer' }}
              >
                {p.name}
                <Icons.X size={11} />
              </button>
            ))}
          </div>
        )}

        <PeoplePicker
          mode="multi"
          selected={groupPeople.map((p) => p.id)}
          onToggle={(p) => setGroupPeople((prev) => (prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]))}
        />
      </Modal>

      {/* ── conversation info ──────────────────────────────────────────────── */}
      <Modal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title={isGroup ? 'Group info' : 'Contact info'}
        size="sm"
      >
        <div className="flex items-center gap-3 pb-3">
          <Avatar avatar={chat?.avatar} label={chat?.title} size={52} online={!isGroup && chat?.peer?.online} />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-extrabold" style={{ color: 'var(--ink)' }}>{chat?.title}</p>
            <p className="text-[11.5px]" style={{ color: 'var(--dim)' }}>
              {isGroup
                ? `${chat?.members?.length || 0} members${chat?.isMain ? ' · the public room' : ''}`
                : chat?.peer?.online ? 'Online now' : 'Direct message'}
            </p>
          </div>
        </div>

        {isGroup && canManage && !chat?.isMain && (
          <div className="mb-4 rounded-lg p-3" style={{ background: 'var(--bg-2)', border: '1px solid var(--line-soft)' }}>
            <p className="mb-2 text-[11px] font-bold" style={{ color: 'var(--muted)' }}>Group name</p>
            <div className="flex gap-2">
              <input
                value={renameTo}
                onChange={(e) => setRenameTo(e.target.value.slice(0, 80))}
                maxLength={80}
                className="min-w-0 flex-1 rounded-lg px-3 py-1.5 text-[12.5px] outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' }}
              />
              <button
                type="button"
                disabled={working || renameTo.trim().length < 2 || renameTo.trim() === chat?.title}
                onClick={async () => {
                  const ok = await patchChat({ title: renameTo.trim() });
                  if (ok) toast.success('Group renamed');
                }}
                className="rounded-lg px-3 py-1.5 text-[12px] font-bold"
                style={{
                  background: renameTo.trim().length >= 2 && renameTo.trim() !== chat?.title ? 'var(--brand)' : 'var(--surface-3)',
                  color: renameTo.trim().length >= 2 && renameTo.trim() !== chat?.title ? '#fff' : 'var(--dim)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {isGroup && (
          <>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>
                Members
              </p>
              {canManage && !chat?.isMain && (
                <button
                  type="button"
                  onClick={() => setAddingOpen((v) => !v)}
                  className="text-[11.5px] font-bold"
                  style={{ background: 'transparent', border: 'none', color: 'var(--brand)', cursor: 'pointer' }}
                >
                  {addingOpen ? 'Done' : '+ Add people'}
                </button>
              )}
            </div>

            {addingOpen && (
              <div className="mb-2 rounded-lg p-2" style={{ border: '1px solid var(--line)', background: 'var(--bg-2)' }}>
                <PeoplePicker
                  mode="multi"
                  selected={toAdd.map((p) => p.id)}
                  exclude={memberIds}
                  onToggle={(p) => setToAdd((prev) => (prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]))}
                  emptyHint="Everyone already knows this group."
                />
                <button
                  type="button"
                  disabled={!toAdd.length || working}
                  onClick={async () => {
                    const ok = await patchChat({ addMembers: toAdd.map((p) => p.id) });
                    if (ok) {
                      toast.success(`Added ${toAdd.length} ${toAdd.length === 1 ? 'person' : 'people'}`);
                      setToAdd([]);
                      setAddingOpen(false);
                    }
                  }}
                  className="mt-2 w-full rounded-full py-2 text-[12px] font-extrabold"
                  style={{
                    background: toAdd.length ? 'var(--brand)' : 'var(--surface-3)',
                    color: toAdd.length ? '#fff' : 'var(--dim)',
                    border: 'none',
                    cursor: toAdd.length ? 'pointer' : 'default',
                  }}
                >
                  {toAdd.length ? `Add ${toAdd.length} to the group` : 'Select people to add'}
                </button>
              </div>
            )}

            <div className="max-h-[30vh] overflow-y-auto">
              {(chat?.members || []).map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 py-1.5">
                  <Avatar avatar={m.avatar} label={m.name} size={34} online={m.online} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold" style={{ color: 'var(--ink)' }}>
                      {m.name}{m.id === me?.id ? ' (you)' : ''}
                    </p>
                    <p className="text-[10.5px]" style={{ color: m.role === 'member' ? 'var(--dim)' : 'var(--brand)' }}>
                      {m.role === 'owner' ? 'Group owner' : m.role === 'admin' ? 'Admin' : m.online ? 'Online' : 'Member'}
                    </p>
                  </div>
                  {m.id !== me?.id && (
                    <button
                      type="button"
                      onClick={() => { setInfoOpen(false); openDm({ id: m.id }); }}
                      className="text-[11px] font-bold"
                      style={{ background: 'transparent', border: 'none', color: 'var(--brand)', cursor: 'pointer' }}
                    >
                      Message
                    </button>
                  )}
                  {canManage && m.role !== 'owner' && m.id !== me?.id && !chat?.isMain && (
                    <button
                      type="button"
                      onClick={() => setConfirm({
                        title: `Remove ${m.name}?`,
                        description: 'They will stop receiving messages from this group.',
                        label: 'Remove',
                        run: async () => {
                          const ok = await patchChat({ removeMember: m.id });
                          if (ok) toast.success('Member removed');
                          setConfirm(null);
                        },
                      })}
                      className="text-[11px] font-bold"
                      style={{ background: 'transparent', border: 'none', color: 'var(--bad)', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: 'var(--line-soft)' }}>
          {isGroup && !chat?.isMain && (
            <button
              type="button"
              onClick={() => setConfirm({
                title: 'Leave this group?',
                description: chat?.myRole === 'owner'
                  ? 'You are the owner, so the group passes to the longest-standing member.'
                  : 'You will stop receiving its messages. You can be added back later.',
                label: 'Leave',
                run: leaveChat,
              })}
              className="rounded-full px-4 py-2 text-[12px] font-bold"
              style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--muted)', cursor: 'pointer' }}
            >
              Leave group
            </button>
          )}

          {(!isGroup || chat?.myRole === 'owner') && !chat?.isMain && (
            <button
              type="button"
              onClick={() => setConfirm({
                title: isGroup ? 'Delete this group?' : 'Delete this chat?',
                description: isGroup
                  ? 'Every message is deleted for everyone. This cannot be undone.'
                  : 'The chat disappears from your list. The other person keeps their copy.',
                label: isGroup ? 'Delete group' : 'Delete chat',
                run: deleteChat,
              })}
              className="rounded-full px-4 py-2 text-[12px] font-bold"
              style={{ background: 'var(--bad-a08)', border: '1px solid var(--bad-a25)', color: 'var(--bad)', cursor: 'pointer' }}
            >
              {isGroup ? 'Delete group' : 'Delete chat'}
            </button>
          )}

          {chat?.isMain && (
            <p className="text-[11.5px]" style={{ color: 'var(--dim)' }}>
              This is the public community room — every account is in it, and it cannot be left or deleted.
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm?.run) confirm.run(); }}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.label || 'Confirm'}
        loading={working}
      />
    </AppBackground>
  );
}
