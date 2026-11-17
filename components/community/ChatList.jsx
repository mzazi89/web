'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/community/ChatList.jsx — the left rail, in the shape people already
// know: title row, search, filter chips, then conversations.
//
// Filters are client-side on purpose. The list is at most a few dozen rows, so a
// round trip per chip would be slower and a second source of truth; the counts on
// the chips come from the same array the rows do, which means they can never
// disagree with what is on screen.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { Icons } from '@/components/ui';
import { Avatar, IconButton, listTime, Ticks, WA } from './parts';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'groups', label: 'Groups' },
];

export default function ChatList({
  chats = [],
  activeId,
  me,
  query,
  onQuery,
  onPick,
  onNewChat,
  onNewGroup,
  soundOn,
  onToggleSound,
  loading,
}) {
  const [filter, setFilter] = useState('all');

  const counts = useMemo(() => ({
    all: chats.length,
    unread: chats.filter((c) => c.unread > 0).length,
    groups: chats.filter((c) => c.kind === 'group').length,
  }), [chats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chats.filter((c) => {
      if (filter === 'unread' && !c.unread) return false;
      if (filter === 'groups' && c.kind !== 'group') return false;
      if (!q) return true;
      return `${c.title} ${c.preview || ''}`.toLowerCase().includes(q);
    });
  }, [chats, filter, query]);

  return (
    <div className="relative flex h-full min-h-0 flex-col border-line md:border-r" style={{ background: 'var(--surface)' }}>
      {/* ── title ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 pb-1 pt-3">
        <Avatar avatar={me?.avatar} photo={me?.photo} label={me?.name} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[19px] font-extrabold leading-tight" style={{ color: 'var(--ink)' }}>
            Community
          </p>
          <p className="truncate text-[10.5px] font-semibold" style={{ color: 'var(--dim)' }}>
            {counts.unread ? `${counts.unread} chat${counts.unread === 1 ? '' : 's'} with new messages` : 'All caught up'}
          </p>
        </div>
        <IconButton label={soundOn ? 'Mute message sound' : 'Unmute message sound'} onClick={onToggleSound} active={soundOn}>
          <Icons.Bell size={17} />
        </IconButton>
        <IconButton label="New group" onClick={onNewGroup}>
          <Icons.Users size={17} />
        </IconButton>
        <IconButton label="New chat" onClick={onNewChat}>
          <Icons.Plus size={18} />
        </IconButton>
      </div>

      {/* ── search ─────────────────────────────────────────────────────── */}
      <div className="px-3 pb-1 pt-2">
        <label
          className="flex items-center gap-2 rounded-full px-3.5"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--line-soft)' }}
        >
          <Icons.Search size={15} style={{ color: 'var(--dim)', flex: '0 0 auto' }} />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="w-full bg-transparent py-2 text-[12.5px] outline-none"
            style={{ color: 'var(--ink)' }}
          />
          {query && (
            <button type="button" onClick={() => onQuery('')} aria-label="Clear search" style={{ background: 'transparent', border: 'none', color: 'var(--dim)', cursor: 'pointer', padding: 0 }}>
              <Icons.X size={14} />
            </button>
          )}
        </label>
      </div>

      {/* ── filters ────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto px-3 py-2" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count = counts[f.id];
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className="shrink-0 rounded-full px-3 py-1 text-[11.5px] font-bold transition-colors"
              style={{
                background: active ? WA.accentSoft : 'transparent',
                border: `1px solid ${active ? WA.accentLine : 'var(--line)'}`,
                color: active ? WA.accent : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              {f.label}
              {count > 0 && f.id !== 'all' ? ` ${count}` : ''}
            </button>
          );
        })}
      </div>

      {/* ── conversations ──────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-20">
        {loading && !chats.length && (
          <div className="space-y-1 px-3 py-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-1 py-2.5">
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface-3)' }} />
                <div className="flex-1 space-y-2">
                  <div style={{ width: '50%', height: 9, borderRadius: 4, background: 'var(--surface-3)' }} />
                  <div style={{ width: '78%', height: 8, borderRadius: 4, background: 'var(--surface-3)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !filtered.length && (
          <div className="px-6 py-10 text-center">
            <p className="text-[12.5px] font-bold" style={{ color: 'var(--ink)' }}>
              {query ? 'Nothing matches that' : filter === 'unread' ? 'No unread chats' : 'No conversations yet'}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: 'var(--dim)' }}>
              {query ? 'Try a different name.' : 'Start a chat with anyone in the community.'}
            </p>
            {!query && filter === 'all' && (
              <button
                type="button"
                onClick={onNewChat}
                className="mt-3 rounded-full px-4 py-1.5 text-[12px] font-bold"
                style={{ background: WA.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                New chat
              </button>
            )}
          </div>
        )}

        {filtered.map((c) => {
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.id)}
              aria-current={active ? 'true' : undefined}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
              style={{ background: active ? WA.accentSoft : 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--brand-a04)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ borderRadius: '50%', boxShadow: c.unread ? `0 0 0 2px ${WA.accent}` : 'none' }}>
                <Avatar avatar={c.avatar} photo={c.photo} label={c.title} online={c.online} size={48} ring={!!c.isMain} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-[13.5px] font-extrabold" style={{ color: 'var(--ink)' }}>
                    {c.title}
                  </span>
                  {c.pinned && (
                    <span aria-label="Pinned" style={{ color: 'var(--dim)', display: 'inline-flex', flex: '0 0 auto' }}>
                      <Icons.Pin size={12} />
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-[10.5px] font-semibold" style={{ color: c.unread ? WA.accent : 'var(--dim)' }}>
                    {listTime(c.lastAt)}
                  </span>
                </div>

                <div className="mt-0.5 flex items-center gap-1.5">
                  {c.previewMine && (
                    <span style={{ color: c.lastRead ? WA.tick : 'var(--dim)', display: 'inline-flex', flex: '0 0 auto' }}>
                      <Ticks status={c.lastRead ? 'read' : 'sent'} size={14} />
                    </span>
                  )}
                  <span
                    className="truncate text-[11.5px]"
                    style={{ color: c.unread ? 'var(--ink-2)' : 'var(--dim)', fontWeight: c.unread ? 600 : 400 }}
                  >
                    {c.preview || 'Say hello 👋'}
                  </span>
                  {c.unread > 0 && (
                    <span
                      className="ml-auto shrink-0 rounded-full px-1.5 text-[10.5px] font-extrabold"
                      style={{ background: WA.badge, color: '#fff', minWidth: 18, textAlign: 'center', lineHeight: '17px' }}
                    >
                      {c.unread > 99 ? '99+' : c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── floating compose ───────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onNewChat}
        aria-label="Start a new chat"
        className="md:hidden"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 34,
          width: 52,
          height: 52,
          borderRadius: 16,
          border: 'none',
          background: WA.accent,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 10px 24px -8px rgba(0,168,132,0.7)',
          cursor: 'pointer',
          zIndex: 5,
        }}
      >
        <Icons.Plus size={24} />
      </button>

      <p className="px-4 py-1.5 text-[10.5px]" style={{ color: 'var(--dim)', borderTop: '1px solid var(--line-soft)' }}>
        Messages are private to the people in the chat.
      </p>
    </div>
  );
}
