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
import ChatInfo from '@/components/community/ChatInfo';
import MessageActions from '@/components/community/MessageActions';
import ReportDialog from '@/components/community/ReportDialog';
import { Avatar, clock } from '@/components/community/parts';

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
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupPeople, setGroupPeople] = useState([]);
  const [creating, setCreating] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [joinInvite, setJoinInvite] = useState(null);
  const [joining, setJoining] = useState(false);
  const [origin, setOrigin] = useState('');
  const [sheetMessage, setSheetMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [reportMessage, setReportMessage] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [editingBusy, setEditingBusy] = useState(false);

  const chatIdRef = useRef(0);
  const cacheRef = useRef(new Map());
  const shellRef = useRef(null);
  const inviteCheckedRef = useRef(false);
  const hydratedRef = useRef(false);
  const [shellH, setShellH] = useState(0);
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

  // Esc closes the photo viewer, which is otherwise only dismissible by tap.
  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

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
        // Merge instead of replace. A fresh open returns the newest 80 messages;
        // replacing would silently drop any older pages already loaded and, if a
        // poll raced the switch, make messages appear to disappear. Both sides
        // are keyed by id so the server's copy always wins.
        setMessages((prev) => {
          const keep = (chatIdRef.current === data.chat.id ? prev : []).filter((m) => !m.pending);
          const map = new Map(keep.map((m) => [m.id, m]));
          for (const m of incoming) map.set(m.id, m);
          const merged = [...map.values()].sort((a, b) => a.id - b.id);
          return merged.slice(-400);
        });
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

  // Whatever is on screen is what a chat switch should show next time: no empty
  // flash, and no loss if the network drops mid-switch.
  useEffect(() => {
    const id = chatIdRef.current;
    if (id && messages.length) cacheRef.current.set(id, messages);
  }, [messages]);

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
    setMessages(cacheRef.current.get(id) || []);
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

  const sendMedia = useCallback(async (payload, replyTo) => {
    const id = chatIdRef.current;
    if (!id) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/community/chats/${id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, replyTo: replyTo || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send that attachment');

      setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
      lastIdRef.current = Math.max(lastIdRef.current, data.message.id);
      readRef.current = Math.max(readRef.current, data.message.id);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }, [toast]);

  // Optimistic: the chip flips immediately, then the server's tally replaces it.
  // If the request fails the poll puts the list back the way it was.
  const react = useCallback(async (messageId, emoji) => {
    const apply = (list = []) => {
      const next = list.map((r) => ({ ...r }));
      const hit = next.find((r) => r.emoji === emoji);
      if (hit?.mine) {
        hit.count -= 1;
        hit.mine = false;
      } else if (hit) {
        // a different emoji replaces this person's old reaction, like WhatsApp
        next.forEach((r) => { if (r.mine && r.emoji !== emoji) { r.count -= 1; r.mine = false; } });
        hit.count += 1;
        hit.mine = true;
      } else {
        next.forEach((r) => { if (r.mine) { r.count -= 1; r.mine = false; } });
        next.push({ emoji, count: 1, mine: true });
      }
      return next.filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
    };

    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: apply(m.reactions) } : m)));
    setLightbox((l) => (l && l.id === messageId ? { ...l, reactions: apply(l.reactions) } : l));

    try {
      const res = await fetch(`/api/community/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that reaction');
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: data.reactions } : m)));
      setLightbox((l) => (l && l.id === messageId ? { ...l, reactions: data.reactions } : l));
    } catch (e) {
      toast.error(e.message);
      pull();
    }
  }, [pull, toast]);

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

  // ── invite links ───────────────────────────────────────────────────────────
  const loadInvite = useCallback(async (chatIdValue) => {
    if (!chatIdValue) return;
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/community/chats/${chatIdValue}/invite`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setInviteCode(data.code || '');
    } catch {
      /* the card simply stays empty and the group still works */
    } finally {
      setInviteLoading(false);
    }
  }, []);

  const resetInviteLink = useCallback(async () => {
    const id = chatIdRef.current;
    if (!id) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/community/chats/${id}/invite`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not reset the link');
      setInviteCode(data.code || '');
      toast.success('New link created — the old one stopped working');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setWorking(false);
    }
  }, [toast]);

  const copyInvite = useCallback(async () => {
    if (!inviteCode) return;
    const url = `${window.location.origin}/community?invite=${inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Invite link copied');
    } catch {
      // Clipboard API needs HTTPS and a user gesture; a prompt is the fallback
      // that always works rather than silently doing nothing.
      window.prompt('Copy this invite link', url);
    }
  }, [inviteCode, toast]);

  const shareInvite = useCallback(async () => {
    if (!inviteCode) return;
    const url = `${window.location.origin}/community?invite=${inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: chat?.title || 'Join my group', text: `Join “${chat?.title || 'our group'}” on MZAZI`, url });
        return;
      } catch { /* the user dismissed the sheet — fall through to copy */ }
    }
    copyInvite();
  }, [chat?.title, copyInvite, inviteCode]);

  const changeRole = useCallback(async (member, role) => {
    const ok = await patchChat({ setRole: { userId: member.id, role } });
    if (ok) {
      toast.success(role === 'admin' ? `${member.name} is now an admin` : `${member.name} is no longer an admin`);
    }
  }, [patchChat, toast]);

  // ── joining from a link ────────────────────────────────────────────────────
  useEffect(() => {
    if (needAuth) return;
    if (inviteCheckedRef.current) return;
    const code = new URLSearchParams(window.location.search).get('invite');
    if (!code) return;
    inviteCheckedRef.current = true;

    (async () => {
      try {
        const res = await fetch(`/api/community/invite/${encodeURIComponent(code)}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error || 'That invite link is not valid');
          return;
        }
        if (data.isMember) {
          await openChat(data.chatId);
        } else {
          setJoinInvite({ ...data, code });
        }
      } catch {
        toast.error('Could not read that invite link');
      }
    })();
  }, [needAuth, openChat, toast]);

  const joinGroup = useCallback(async () => {
    if (!joinInvite) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/community/invite/${encodeURIComponent(joinInvite.code)}`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not join that group');
      setJoinInvite(null);
      if (window.history?.replaceState) window.history.replaceState({}, '', '/community');
      await openChat(data.chatId);
      toast.success('You joined the group');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setJoining(false);
    }
  }, [joinInvite, openChat, toast]);

  // Fetch the code only when the sheet is opened for a group that can have one.
  useEffect(() => {
    if (!infoOpen) return;
    if (chat?.kind !== 'group' || chat?.isMain) {
      setInviteCode('');
      return;
    }
    loadInvite(chat.id);
  }, [infoOpen, chat?.kind, chat?.isMain, chat?.id, loadInvite]);

  // Keep the recent chats across a reload: the list is small, and an empty rail
  // while the poll answers is exactly the "where did my chats go" moment.
  useEffect(() => {
    if (!me?.id || hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = localStorage.getItem(`mzazi:community:chats:${me.id}`);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length) {
        setChats((prev) => (prev.length ? prev : saved));
      }
      const last = Number(localStorage.getItem(`mzazi:community:last:${me.id}`) || 0);
      if (last) setChatId((prev) => prev || last);
    } catch { /* a corrupt cache is not worth a broken page */ }
  }, [me?.id]);

  useEffect(() => {
    if (!me?.id || !chats.length) return;
    try {
      localStorage.setItem(`mzazi:community:chats:${me.id}`, JSON.stringify(chats.slice(0, 60)));
    } catch { /* quota — skip */ }
  }, [chats, me?.id]);

  useEffect(() => {
    if (!me?.id || !chatId) return;
    try { localStorage.setItem(`mzazi:community:last:${me.id}`, String(chatId)); } catch { /* ignore */ }
  }, [chatId, me?.id]);

  // ── shell height ───────────────────────────────────────────────────────────
  // Measured rather than computed from the --nav-h/--dock-h tokens: the header
  // is taller than its minimum on a phone, and the difference was exactly what
  // pushed the composer under the dock.
  useEffect(() => {
    setOrigin(window.location.origin);
    const measure = () => {
      const el = shellRef.current;
      if (!el) return;
      const top = Math.max(0, el.getBoundingClientRect().top);
      const dock = document.querySelector('.dock');
      const dockH = dock ? dock.getBoundingClientRect().height : 58;
      const viewH = window.visualViewport?.height || window.innerHeight;
      setShellH(Math.max(320, Math.round(viewH - top - dockH - 6)));
    };
    measure();
    const raf = requestAnimationFrame(measure);
    const settle = setTimeout(measure, 350);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    window.visualViewport?.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, []);

  // ── message actions ────────────────────────────────────────────────────────
  const copyMessage = useCallback(async (m) => {
    setSheetMessage(null);
    const text = m.body || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied');
    } catch {
      // Clipboard needs a secure context and a gesture; a prompt always works.
      window.prompt('Copy this message', text);
    }
  }, [toast]);

  const deleteForEveryone = useCallback(async (m) => {
    setSheetMessage(null);
    try {
      const res = await fetch(`/api/community/messages/${m.id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not delete that message');
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, deleted: true, body: '' } : x)));
      toast.success('Deleted for everyone');
    } catch (e) {
      toast.error(e.message);
    }
  }, [toast]);

  const deleteForMe = useCallback(async (m) => {
    setSheetMessage(null);
    try {
      const res = await fetch(`/api/community/messages/${m.id}?scope=me`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not remove that message');
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
      toast.success('Removed from your view');
    } catch (e) {
      toast.error(e.message);
    }
  }, [toast]);

  const saveEdit = useCallback(async (id, body) => {
    setEditingBusy(true);
    try {
      const res = await fetch(`/api/community/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not edit that message');
      setMessages((prev) => prev.map((x) => (x.id === id ? { ...x, ...d.message, edited: true } : x)));
      setEditingMessage(null);
      toast.success('Message edited');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEditingBusy(false);
    }
  }, [toast]);

  const submitReport = useCallback(async ({ reason, note }) => {
    if (!reportMessage) return;
    setReportBusy(true);
    try {
      const res = await fetch(`/api/community/messages/${reportMessage.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, note }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not send that report');
      toast.success(d.message || 'Reported to MZAZI support');
      setReportMessage(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setReportBusy(false);
    }
  }, [reportMessage, toast]);

  // ── derived ────────────────────────────────────────────────────────────────
  const canManage = chat?.myRole === 'owner' || chat?.myRole === 'admin';
  const memberIds = useMemo(() => (chat?.members || []).map((m) => m.id), [chat]);
  const isGroup = chat?.kind === 'group';

  return (
    <AppBackground orbs>
      <audio ref={audioRef} src={SOUND} preload="auto" />

      <div
        ref={shellRef}
        className="flex flex-col"
        style={{
          height: shellH ? `${shellH}px` : 'calc(100dvh - var(--nav-h) - var(--dock-h))',
          minHeight: 320,
        }}
      >
        <div
          className="mb-2 hidden items-end justify-between px-4 pt-3 md:flex lg:px-6"
          style={{ maxWidth: 1120, margin: '0 auto', width: '100%' }}
        >
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
          <div className="mx-auto w-full max-w-[460px] px-4 pt-6">
            <SignInGate
              title="Sign in to message the community"
              description="Conversations are private to the people in them, so we need to know who you are. Your account is free."
              next="/community"
              icon={<Icons.Chat size={26} />}
            />
          </div>
        ) : (
          <div
            className="grid min-h-0 flex-1 overflow-hidden px-0 pb-0 md:px-4 md:pb-3 lg:px-6"
            style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}
          >
          <div
            className="grid min-h-0 overflow-hidden border-line md:grid-cols-[320px_minmax(0,1fr)] md:rounded-[var(--r-xl)] md:border"
            style={{
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-sm)',
              backdropFilter: 'blur(var(--glass-blur))',
              maxWidth: 1120,
              margin: '0 auto',
              width: '100%',
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
                onSendMedia={sendMedia}
                onLongPress={(m) => setSheetMessage(m)}
                editing={editingMessage}
                editingBusy={editingBusy}
                onCancelEdit={() => setEditingMessage(null)}
                onEditSubmit={saveEdit}
                onReact={react}
                onOpenMedia={(m) => setLightbox(m)}
                uploading={uploading}
              />
            </div>
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
      <ChatInfo
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        chat={chat}
        me={me}
        inviteCode={inviteCode}
        inviteLoading={inviteLoading}
        onCopyInvite={copyInvite}
        onResetInvite={resetInviteLink}
        onAddMembers={async (ids) => {
          const ok = await patchChat({ addMembers: ids });
          if (ok) toast.success(`Added ${ids.length} ${ids.length === 1 ? 'person' : 'people'}`);
          return ok;
        }}
        onSetRole={changeRole}
        onRemove={async (member) => {
          const ok = await patchChat({ removeMember: member.id });
          if (ok) toast.success(`${member.name} removed`);
        }}
        onLeave={() => setConfirm({
          title: 'Exit this group?',
          description: chat?.myRole === 'owner'
            ? 'You are the owner, so the group passes to the longest-standing member.'
            : 'You will stop receiving its messages. You can be added back later.',
          label: 'Exit',
          run: leaveChat,
        })}
        onDelete={() => setConfirm({
          title: isGroup ? 'Delete this group?' : 'Delete this chat?',
          description: isGroup
            ? 'Every message is deleted for everyone. This cannot be undone.'
            : 'The chat disappears from your list. The other person keeps their copy.',
          label: isGroup ? 'Delete group' : 'Delete chat',
          run: deleteChat,
        })}
        onPin={async (pinned) => {
          const ok = await patchChat({ pin: pinned });
          if (ok) toast.success(pinned ? 'Chat pinned' : 'Chat unpinned');
        }}
        onSaveTitle={async (title) => {
          const ok = await patchChat({ title });
          if (ok) toast.success('Group renamed');
        }}
        onSaveAbout={async (text) => {
          const ok = await patchChat({ about: text });
          if (ok) toast.success('Description saved');
        }}
        onOpenMedia={(m) => setLightbox(m)}
        onMessageMember={(m) => openDm({ id: m.id })}
        busy={working}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm?.run) confirm.run(); }}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.label || 'Confirm'}
        loading={working}
      />
      <MessageActions
        message={sheetMessage}
        mine={!!sheetMessage?.mine}
        canModerate={canManage}
        onClose={() => setSheetMessage(null)}
        onReply={(m) => { setReply(m); setSheetMessage(null); }}
        onEdit={(m) => { setEditingMessage(m); setSheetMessage(null); }}
        onCopy={copyMessage}
        onReport={(m) => { setReportMessage(m); setSheetMessage(null); }}
        onDeleteEveryone={deleteForEveryone}
        onDeleteMe={deleteForMe}
      />

      <ReportDialog
        message={reportMessage}
        busy={reportBusy}
        onClose={() => setReportMessage(null)}
        onSubmit={submitReport}
      />

      {/* ── group invite ────────────────────────────────────────────────────── */}
      <Modal
        open={!!joinInvite}
        onClose={() => {
          setJoinInvite(null);
          if (window.history?.replaceState) window.history.replaceState({}, '', '/community');
        }}
        title="Group invite"
        size="sm"
        footer={(
          <>
            <button
              type="button"
              onClick={() => {
                setJoinInvite(null);
                if (window.history?.replaceState) window.history.replaceState({}, '', '/community');
              }}
              className="rounded-full px-4 py-2 text-[12.5px] font-bold"
              style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--muted)', cursor: 'pointer' }}
            >
              Not now
            </button>
            <button
              type="button"
              onClick={joinGroup}
              disabled={joining}
              className="rounded-full px-5 py-2 text-[12.5px] font-extrabold"
              style={{ background: 'var(--brand)', color: '#fff', border: 'none', cursor: joining ? 'default' : 'pointer' }}
            >
              {joining ? 'Joining…' : 'Join group'}
            </button>
          </>
        )}
      >
        <div className="flex flex-col items-center pb-2 text-center">
          <Avatar avatar={joinInvite?.avatar} label={joinInvite?.title} size={64} />
          <p className="mt-2 text-[15px] font-extrabold" style={{ color: 'var(--ink)' }}>{joinInvite?.title}</p>
          <p className="text-[11.5px]" style={{ color: 'var(--dim)' }}>
            {joinInvite?.members} member{joinInvite?.members === 1 ? '' : 's'}
          </p>
          {joinInvite?.names?.length ? (
            <p className="mt-1 text-[11px]" style={{ color: 'var(--muted)' }}>
              {joinInvite.names.join(', ')}
            </p>
          ) : null}
          <p className="mt-3 text-[11.5px]" style={{ color: 'var(--dim)' }}>
            You will see this group in your chats and can leave at any time.
          </p>
        </div>
      </Modal>

      {/* ── photo viewer ───────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.body || 'Photo'}
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: 'rgba(6, 8, 12, 0.93)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 'calc(12px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom))',
          }}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close photo"
            style={{
              position: 'absolute',
              top: 'calc(10px + env(safe-area-inset-top))',
              right: 12,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.14)',
              color: '#fff',
              border: 'none',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            <Icons.X size={18} />
          </button>

          <img
            src={lightbox.media?.url}
            alt={lightbox.body || 'Photo'}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 'min(94vw, 1000px)',
              maxHeight: '72dvh',
              objectFit: 'contain',
              borderRadius: 14,
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full"
            style={{ maxWidth: 'min(94vw, 1000px)', color: '#fff' }}
          >
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-extrabold">
                  {lightbox.mine ? 'You' : lightbox.senderName}
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {clock(lightbox.createdAt)}
                </p>
              </div>
              {lightbox.media?.width ? (
                <p className="shrink-0 text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {lightbox.media.width} × {lightbox.media.height}
                </p>
              ) : null}
            </div>

            {lightbox.body && (
              <p className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {lightbox.body}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => {
                const hit = (lightbox.reactions || []).find((r) => r.emoji === emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => react(lightbox.id, emoji)}
                    aria-label={`React ${emoji}`}
                    aria-pressed={!!hit?.mine}
                    className="flex items-center gap-1 rounded-full px-2 py-1"
                    style={{
                      background: hit?.mine ? 'var(--brand)' : 'rgba(255,255,255,0.12)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.18)',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    <span>{emoji}</span>
                    {hit ? <span className="text-[11px] font-bold">{hit.count}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AppBackground>
  );
}
