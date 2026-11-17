'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/community/ChatInfo.jsx — the full-screen info sheet.
//
// Group: a hero, four action circles, then Members / Media / Settings. Direct
// message: the same hero, then the facts you actually want (how many groups you
// share, when they joined) and the three actions that apply.
//
// It fetches /info when it opens instead of living off the poll: members, shared
// groups and the media count are not worth computing every 2.6 seconds, and a
// sheet that opens instantly from cached chat data then fills in is better than
// one that blocks.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import { Icons } from '@/components/ui';
import { Avatar, WA } from './parts';
import PeoplePicker from './PeoplePicker';

const GROUP_TABS = ['Members', 'Media', 'Settings'];
const DM_TABS = ['Details', 'Media'];

function Action({ label, onClick, disabled, children, accent = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5"
      style={{ background: 'transparent', border: 'none', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 }}
    >
      <span
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: accent ? WA.accentSoft : 'var(--surface-2)',
          color: accent ? WA.accent : 'var(--muted)',
          border: `1px solid ${accent ? WA.accentLine : 'var(--line-soft)'}`,
        }}
      >
        {children}
      </span>
      <span className="text-[10.5px] font-bold" style={{ color: 'var(--muted)' }}>{label}</span>
    </button>
  );
}

function memberSince(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString([], { month: 'short', year: 'numeric' });
}

export default function ChatInfo({
  open,
  onClose,
  chat,
  me,
  inviteCode,
  inviteLoading,
  onCopyInvite,
  onResetInvite,
  onAddMembers,
  onSetRole,
  onRemove,
  onLeave,
  onDelete,
  onPin,
  onSaveTitle,
  onSaveAbout,
  onOpenMedia,
  onMessageMember,
  busy = false,
}) {
  const [info, setInfo] = useState(null);
  const [media, setMedia] = useState(null);
  const [tab, setTab] = useState('Members');
  const [memberQuery, setMemberQuery] = useState('');
  const [memberMenu, setMemberMenu] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [toAdd, setToAdd] = useState([]);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const scrollRef = useRef(null);

  const isGroup = chat?.kind === 'group';
  const canManage = chat?.myRole === 'owner' || chat?.myRole === 'admin';
  const canEditAbout = canManage;
  const members = info?.members || chat?.members || [];

  const loadInfo = () => {
    if (!chat?.id) return;
    fetch(`/api/community/chats/${chat.id}/info`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setInfo(d); })
      .catch(() => {});
  };

  useEffect(() => {
    if (!open || !chat?.id) return;
    setTab(chat.kind === 'group' ? 'Members' : 'Details');
    setMemberMenu(null);
    setAddOpen(false);
    setToAdd([]);
    setMemberQuery('');
    setName(chat.title || '');
    setAbout(chat.about || '');
    setInfo(null);
    setMedia(null);
    loadInfo();
  }, [open, chat?.id, chat?.title, chat?.about]);

  useEffect(() => {
    if (!open || tab !== 'Media' || !chat?.id || media) return;
    fetch(`/api/community/chats/${chat.id}/media`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setMedia(d); })
      .catch(() => setMedia({ media: [], total: 0 }));
  }, [open, tab, chat?.id, media]);

  const shownMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, memberQuery]);

  const images = (media?.media || []).filter((m) => m.kind === 'image');
  const notes = (media?.media || []).filter((m) => m.kind === 'audio');

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isGroup ? 'Group info' : 'Contact info'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 85,
        background: 'rgba(4, 8, 14, 0.72)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          height: '100%',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 0 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* ── top bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            style={{ background: 'transparent', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: 4, display: 'grid', placeItems: 'center' }}
          >
            <Icons.ChevronLeft size={24} />
          </button>
          <Avatar avatar={chat?.avatar} photo={chat?.photo} label={chat?.title} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-extrabold" style={{ color: 'var(--ink)' }}>{chat?.title}</p>
            <p className="text-[10.5px]" style={{ color: 'var(--dim)' }}>
              {isGroup ? `Group · ${members.length} members` : chat?.peer?.online ? 'online' : 'direct message'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', color: 'var(--dim)', cursor: 'pointer', padding: 4, display: 'grid', placeItems: 'center' }}
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* ── body ────────────────────────────────────────────────────────── */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pb-6">
          {/* hero */}
          <div className="flex flex-col items-center px-6 pt-6 text-center">
            <Avatar
              avatar={chat?.avatar}
              photo={chat?.photo}
              label={chat?.title}
              size={96}
              online={!isGroup && chat?.peer?.online}
            />
            <h2 className="mt-3 text-[19px] font-extrabold leading-tight" style={{ color: 'var(--ink)' }}>
              {chat?.title}
            </h2>
            <p className="mt-0.5 text-[11.5px] font-semibold" style={{ color: 'var(--dim)' }}>
              {isGroup ? `Group · ${members.length} members` : 'Direct message'}
            </p>

            {(chat?.about || (!isGroup && info?.sharedGroups >= 0)) && (
              <p className="mt-3 max-w-[360px] text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {chat?.about || `${info?.sharedGroups || 0} group${info?.sharedGroups === 1 ? '' : 's'} in common`}
              </p>
            )}
          </div>

          {/* actions */}
          <div className="mt-5 flex items-start justify-center gap-6 px-6">
            {isGroup ? (
              <>
                <Action
                  label="Invite"
                  accent
                  onClick={onCopyInvite}
                  disabled={!inviteCode}
                >
                  <Icons.Link size={20} />
                </Action>
                <Action label="Add" onClick={() => { setTab('Members'); setAddOpen(true); }} disabled={!canManage || chat?.isMain}>
                  <Icons.Users size={20} />
                </Action>
                <Action label="Media" onClick={() => setTab('Media')}>
                  <Icons.Image size={20} />
                </Action>
                <Action label={chat?.pinned ? 'Unpin' : 'Pin'} onClick={() => onPin(!chat?.pinned)} disabled={chat?.isMain}>
                  <Icons.Pin size={20} />
                </Action>
              </>
            ) : (
              <>
                <Action label="Media" onClick={() => setTab('Media')}>
                  <Icons.Image size={20} />
                </Action>
                <Action label={chat?.pinned ? 'Unpin' : 'Pin'} onClick={() => onPin(!chat?.pinned)}>
                  <Icons.Pin size={20} />
                </Action>
                <Action label="Delete" onClick={onDelete}>
                  <Icons.Trash size={20} />
                </Action>
              </>
            )}
          </div>

          {/* tabs */}
          <div className="mt-5 flex border-b" style={{ borderColor: 'var(--line-soft)' }}>
              {(isGroup ? GROUP_TABS : DM_TABS).map((t) => {
                const active = tab === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className="relative flex-1 py-2.5 text-[12px] font-extrabold"
                    style={{ background: 'transparent', border: 'none', color: active ? WA.accent : 'var(--dim)', cursor: 'pointer' }}
                  >
                    {t}
                    {active && (
                      <span style={{ position: 'absolute', left: '22%', right: '22%', bottom: 0, height: 2.5, borderRadius: 2, background: WA.accent }} />
                    )}
                  </button>
                );
              })}
          </div>

          {/* ── members ───────────────────────────────────────────────────── */}
          {(tab === 'Members' || tab === 'Details') && (
            <div className="px-4 pt-3">
              {isGroup && (
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>
                    {members.length} members
                  </p>
                  <label className="flex items-center gap-1.5 rounded-full px-2 py-1" style={{ background: 'var(--surface-2)' }}>
                    <Icons.Search size={13} style={{ color: 'var(--dim)' }} />
                    <input
                      value={memberQuery}
                      onChange={(e) => setMemberQuery(e.target.value)}
                      placeholder="Search"
                      aria-label="Search members"
                      className="w-[92px] bg-transparent text-[11px] outline-none"
                      style={{ color: 'var(--ink)' }}
                    />
                  </label>
                </div>
              )}

              {isGroup && canManage && !chat?.isMain && (
                <button
                  type="button"
                  onClick={() => setAddOpen((v) => !v)}
                  className="mb-2 flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <span style={{ width: 42, height: 42, borderRadius: '50%', background: WA.accent, color: '#fff', display: 'grid', placeItems: 'center' }}>
                    <Icons.Plus size={20} />
                  </span>
                  <span className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>Add members</span>
                </button>
              )}

              {addOpen && (
                <div className="mb-3 rounded-xl p-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                  <PeoplePicker
                    mode="multi"
                    selected={toAdd.map((p) => p.id)}
                    exclude={members.map((m) => m.id)}
                    onToggle={(p) => setToAdd((prev) => (prev.some((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]))}
                    emptyHint="Everyone already knows this group."
                    autoFocus={false}
                  />
                  <button
                    type="button"
                    disabled={!toAdd.length || busy}
                    onClick={async () => {
                      const ok = await onAddMembers(toAdd.map((p) => p.id));
                      if (ok) { setToAdd([]); setAddOpen(false); loadInfo(); }
                    }}
                    className="mt-2 w-full rounded-full py-2 text-[12px] font-extrabold"
                    style={{ background: toAdd.length ? WA.accent : 'var(--surface-3)', color: toAdd.length ? '#fff' : 'var(--dim)', border: 'none', cursor: toAdd.length ? 'pointer' : 'default' }}
                  >
                    {toAdd.length ? `Add ${toAdd.length} to the group` : 'Select people to add'}
                  </button>
                </div>
              )}

              {isGroup && shownMembers.map((m) => {
                const isMe = m.id === me?.id;
                const canPromote = canManage && m.role === 'member' && !chat?.isMain;
                const canDemote = (chat?.myRole === 'owner' || chat?.myRole === 'admin') && m.role === 'admin';
                const canRemove = canManage && m.role !== 'owner' && !isMe && !chat?.isMain;
                const menuOpen = memberMenu === m.id;

                return (
                  <div key={m.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--line-soft)' }}>
                    <div className="flex items-center gap-3 py-2">
                      <Avatar avatar={m.avatar} photo={m.photo} label={m.name} size={42} online={m.online} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold" style={{ color: 'var(--ink)' }}>
                          {m.name}{isMe ? ' (you)' : ''}
                        </p>
                        <p className="truncate text-[10.5px]" style={{ color: 'var(--dim)' }}>
                          {m.role === 'owner' ? 'Group owner' : m.role === 'admin' ? 'Admin' : m.online ? 'Online' : 'Member'}
                        </p>
                      </div>
                      {m.role !== 'member' && (
                        <span
                          className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: WA.accentSoft, color: WA.accent, border: `1px solid ${WA.accentLine}` }}
                        >
                          {m.role === 'owner' ? 'Owner' : 'Group Admin'}
                        </span>
                      )}
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => setMemberMenu(menuOpen ? null : m.id)}
                          aria-label={`Options for ${m.name}`}
                          aria-expanded={menuOpen}
                          style={{ background: 'transparent', border: 'none', color: 'var(--dim)', cursor: 'pointer', padding: 4, display: 'grid', placeItems: 'center' }}
                        >
                          <Icons.MoreVertical size={16} />
                        </button>
                      )}
                    </div>

                    {menuOpen && !isMe && (
                      <div className="mb-2 flex flex-wrap gap-1.5 pl-[54px]">
                        <button
                          type="button"
                          onClick={() => { onClose(); onMessageMember?.(m); }}
                          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{ background: WA.accentSoft, border: `1px solid ${WA.accentLine}`, color: WA.accent, cursor: 'pointer' }}
                        >
                          Message
                        </button>
                        {canPromote && (
                          <button
                            type="button"
                            onClick={async () => { await onSetRole(m, 'admin'); setMemberMenu(null); loadInfo(); }}
                            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)', cursor: 'pointer' }}
                          >
                            Make group admin
                          </button>
                        )}
                        {canDemote && (
                          <button
                            type="button"
                            onClick={async () => { await onSetRole(m, 'member'); setMemberMenu(null); loadInfo(); }}
                            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)', cursor: 'pointer' }}
                          >
                            Dismiss as admin
                          </button>
                        )}
                        {canRemove && (
                          <button
                            type="button"
                            onClick={async () => { await onRemove(m); setMemberMenu(null); loadInfo(); }}
                            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ background: 'var(--bad-a08)', border: '1px solid var(--bad-a25)', color: 'var(--bad)', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {!isGroup && (
                <div className="mt-2 space-y-0.5">
                  <div className="flex items-center gap-3 py-2.5">
                    <Icons.Users size={18} style={{ color: 'var(--dim)' }} />
                    <span className="text-[12.5px]" style={{ color: 'var(--ink)' }}>
                      {info?.sharedGroups ?? 0} group{(info?.sharedGroups ?? 0) === 1 ? '' : 's'} in common
                    </span>
                  </div>
                  <div className="flex items-center gap-3 py-2.5">
                    <Icons.Calendar size={18} style={{ color: 'var(--dim)' }} />
                    <span className="text-[12.5px]" style={{ color: 'var(--ink)' }}>
                      Joined {memberSince(info?.peer?.joinedAt || members.find((m) => m.id !== me?.id)?.joinedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 py-2.5">
                    <Icons.Lock size={18} style={{ color: 'var(--dim)' }} />
                    <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
                      Only the two of you can read this conversation.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── media ─────────────────────────────────────────────────────── */}
          {tab === 'Media' && (
            <div className="px-4 pt-3">
              {!media && <p className="py-8 text-center text-[12px]" style={{ color: 'var(--dim)' }}>Loading media…</p>}
              {media && !media.media.length && (
                <p className="py-8 text-center text-[12px]" style={{ color: 'var(--dim)' }}>No photos or voice notes yet.</p>
              )}
              {images.length > 0 && (
                <>
                  <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>
                    Photos · {images.length}
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {images.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onOpenMedia({ id: m.id, media: m, mine: m.senderId === me?.id, senderName: '', body: '', reactions: [], createdAt: m.createdAt })}
                        style={{ padding: 0, border: 'none', background: 'var(--surface-3)', borderRadius: 8, overflow: 'hidden', aspectRatio: '1 / 1', cursor: 'zoom-in' }}
                      >
                        <img src={m.url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                </>
              )}
              {notes.length > 0 && (
                <>
                  <p className="mb-1.5 mt-4 text-[10.5px] font-bold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>
                    Voice notes · {notes.length}
                  </p>
                  {notes.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 py-1.5">
                      <Icons.Play size={14} style={{ color: WA.accent }} />
                      <span className="text-[11.5px]" style={{ color: 'var(--muted)' }}>
                        {Math.round((m.durationMs || 0) / 1000)}s · {new Date(m.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── settings ──────────────────────────────────────────────────── */}
          {tab === 'Settings' && isGroup && !chat?.isMain && (
            <div className="px-4 pt-3">
              {canManage && !chat?.isMain && (
                <>
                  <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>
                    Group name
                  </label>
                  <div className="mb-3 flex gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 80))}
                      maxLength={80}
                      className="min-w-0 flex-1 rounded-lg px-3 py-2 text-[12.5px] outline-none"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    />
                    <button
                      type="button"
                      disabled={busy || name.trim().length < 2 || name.trim() === chat?.title}
                      onClick={() => onSaveTitle(name.trim())}
                      className="rounded-lg px-3 text-[12px] font-bold"
                      style={{ background: name.trim().length >= 2 && name.trim() !== chat?.title ? WA.accent : 'var(--surface-3)', color: name.trim().length >= 2 && name.trim() !== chat?.title ? '#fff' : 'var(--dim)', border: 'none', cursor: 'pointer' }}
                    >
                      Save
                    </button>
                  </div>

                  <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>
                    Description
                  </label>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value.slice(0, 255))}
                    rows={2}
                    placeholder="What is this group for?"
                    className="mb-2 w-full resize-none rounded-lg px-3 py-2 text-[12.5px] outline-none"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                  />
                  <button
                    type="button"
                    disabled={busy || about === (chat?.about || '')}
                    onClick={() => onSaveAbout(about)}
                    className="mb-4 rounded-lg px-3 py-1.5 text-[12px] font-bold"
                    style={{ background: about !== (chat?.about || '') ? WA.accent : 'var(--surface-3)', color: about !== (chat?.about || '') ? '#fff' : 'var(--dim)', border: 'none', cursor: 'pointer' }}
                  >
                    Save description
                  </button>
                </>
              )}

              {!chat?.isMain && (
                <div className="mb-4 rounded-xl p-3" style={{ background: WA.accentSoft, border: `1px solid ${WA.accentLine}` }}>
                  <div className="flex items-center justify-between">
                    <p className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: WA.accent }}>Invite via link</p>
                    {canManage && (
                      <button type="button" onClick={onResetInvite} disabled={busy} className="text-[10.5px] font-bold" style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                        Reset
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px]" style={{ color: 'var(--muted)' }}>Anyone with this link can join this group.</p>
                  <div className="mt-2 flex gap-1.5">
                    <input
                      readOnly
                      value={inviteLoading ? 'Creating link…' : inviteCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/community?invite=${inviteCode}` : ''}
                      onFocus={(e) => e.currentTarget.select()}
                      aria-label="Invite link"
                      className="min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-[11px] outline-none"
                      style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    />
                    <button
                      type="button"
                      onClick={onCopyInvite}
                      disabled={!inviteCode}
                      className="rounded-lg px-2.5 text-[11px] font-extrabold"
                      style={{ background: inviteCode ? WA.accent : 'var(--surface-3)', color: inviteCode ? '#fff' : 'var(--dim)', border: 'none', cursor: inviteCode ? 'pointer' : 'default' }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {!chat?.isMain && (
                  <button
                    type="button"
                    onClick={onLeave}
                    className="rounded-full px-4 py-2 text-[12px] font-bold"
                    style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--muted)', cursor: 'pointer' }}
                  >
                    Exit group
                  </button>
                )}
                {chat?.myRole === 'owner' && !chat?.isMain && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-full px-4 py-2 text-[12px] font-bold"
                    style={{ background: 'var(--bad-a08)', border: '1px solid var(--bad-a25)', color: 'var(--bad)', cursor: 'pointer' }}
                  >
                    Delete group
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
