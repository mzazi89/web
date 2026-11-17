'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/community/ChatList.jsx — the left rail: who you can talk to.
//
// Search filters by chat name, member name and the last message, because on a
// phone that is how people find a conversation they cannot see. Unread counts are
// computed by the server per membership row, so the badge is right even after a
// reload with no client-side state.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { Icons } from '@/components/ui';
import { Avatar, IconButton, listTime } from './parts';

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
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) =>
      `${c.title} ${c.preview || ''}`.toLowerCase().includes(q)
    );
  }, [chats, query]);

  const unreadAll = chats.reduce((n, c) => n + (c.unread || 0), 0);

  return (
    <div className="flex h-full min-h-0 flex-col border-line md:border-r" style={{ background: 'var(--surface)' }}>
      {/* ── me ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--line-soft)' }}>
        <Avatar avatar={me?.avatar} photo={me?.photo} label={me?.name} size={38} online />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold" style={{ color: 'var(--ink)' }}>
            {me?.name || 'Community'}
          </p>
          <p className="truncate text-[11px] font-semibold" style={{ color: 'var(--dim)' }}>
            {unreadAll > 0 ? `${unreadAll} unread` : 'All caught up'}
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
      <div className="px-3 pb-2 pt-3">
        <label className="flex items-center gap-2 rounded-full px-3" style={{ background: 'var(--bg-2)', border: '1px solid var(--line-soft)' }}>
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

      {/* ── conversations ──────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {loading && !chats.length && (
          <div className="space-y-2 px-3 py-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2">
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--surface-3)' }} />
                <div className="flex-1 space-y-2">
                  <div style={{ width: '55%', height: 9, borderRadius: 4, background: 'var(--surface-3)' }} />
                  <div style={{ width: '80%', height: 8, borderRadius: 4, background: 'var(--surface-3)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !filtered.length && (
          <div className="px-6 py-10 text-center">
            <p className="text-[12.5px] font-bold" style={{ color: 'var(--ink)' }}>
              {query ? 'Nothing matches that' : 'No conversations yet'}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: 'var(--dim)' }}>
              {query ? 'Try a different name.' : 'Start a chat with anyone in the community.'}
            </p>
            {!query && (
              <button
                type="button"
                onClick={onNewChat}
                className="mt-3 rounded-full px-4 py-1.5 text-[12px] font-bold"
                style={{ background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer' }}
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
              style={{
                background: active ? 'var(--brand-a10)' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${active ? 'var(--brand)' : 'transparent'}`,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--brand-a04)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Avatar avatar={c.avatar} photo={c.photo} label={c.title} online={c.online} ring={!!c.isMain} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-[13px] font-extrabold" style={{ color: 'var(--ink)' }}>
                    {c.title}
                  </span>
                  {c.kind === 'group' && !c.isMain && (
                    <span className="shrink-0 text-[10px] font-semibold" style={{ color: 'var(--dim)' }}>
                      {c.memberCount}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-[10.5px] font-semibold" style={{ color: c.unread ? 'var(--brand)' : 'var(--dim)' }}>
                    {listTime(c.lastAt)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className="truncate text-[11.5px]"
                    style={{ color: c.unread ? 'var(--ink-2)' : 'var(--dim)', fontWeight: c.unread ? 600 : 400 }}
                  >
                    {c.preview || 'Say hello 👋'}
                  </span>
                  {c.unread > 0 && (
                    <span
                      className="ml-auto shrink-0 rounded-full px-1.5 text-[10.5px] font-extrabold"
                      style={{ background: 'var(--brand)', color: '#fff', minWidth: 18, textAlign: 'center', lineHeight: '17px' }}
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

      <p className="px-4 py-2 text-[10.5px]" style={{ color: 'var(--dim)', borderTop: '1px solid var(--line-soft)' }}>
        Messages are private to the people in the chat.
      </p>
    </div>
  );
}
