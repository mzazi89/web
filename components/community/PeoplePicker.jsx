'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/community/PeoplePicker.jsx — the member directory.
//
// One component for both jobs: tapping a person to open a DM, and ticking several
// people to build a group. The list comes from the server (so it is the real
// account list, not whoever happens to be in one chat), and any existing DM is
// marked, which stops the same conversation being created twice from the UI side.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import { Icons } from '@/components/ui';
import { Avatar } from './parts';

export default function PeoplePicker({
  mode = 'dm',
  selected = [],
  exclude = [],
  onPick,
  onToggle,
  autoFocus = true,
  emptyHint = 'No one matches that name.',
}) {
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (autoFocus) setTimeout(() => inputRef.current?.focus(), 60);
  }, [autoFocus]);

  useEffect(() => {
    let alive = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/community/people?q=${encodeURIComponent(query.trim())}`, { cache: 'no-store' });
        const d = await r.json();
        if (alive) setPeople(Array.isArray(d.people) ? d.people : []);
      } catch {
        if (alive) setPeople([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 220);
    return () => { alive = false; clearTimeout(timerRef.current); };
  }, [query]);

  const visible = useMemo(
    () => people.filter((p) => !exclude.includes(p.id)),
    [people, exclude]
  );

  const isChosen = (id) => selected.includes(id);

  return (
    <div>
      <label
        className="mb-3 flex items-center gap-2 rounded-full px-3"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--line-soft)' }}
      >
        <Icons.Search size={15} style={{ color: 'var(--dim)' }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          aria-label="Search people"
          className="w-full bg-transparent py-2 text-[13px] outline-none"
          style={{ color: 'var(--ink)' }}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Clear" style={{ background: 'transparent', border: 'none', color: 'var(--dim)', cursor: 'pointer' }}>
            <Icons.X size={14} />
          </button>
        )}
      </label>

      <div className="max-h-[46vh] min-h-[120px] overflow-y-auto pr-1" role="listbox" aria-multiselectable={mode === 'multi'}>
        {loading && (
          <p className="px-2 py-6 text-center text-[12px]" style={{ color: 'var(--dim)' }}>Loading members…</p>
        )}

        {!loading && !visible.length && (
          <p className="px-2 py-6 text-center text-[12px]" style={{ color: 'var(--dim)' }}>{emptyHint}</p>
        )}

        {visible.map((p) => {
          const chosen = isChosen(p.id);
          return (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={chosen}
              onClick={() => (mode === 'multi' ? onToggle?.(p) : onPick?.(p))}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left"
              style={{ background: chosen ? 'var(--brand-a10)' : 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { if (!chosen) e.currentTarget.style.background = 'var(--brand-a04)'; }}
              onMouseLeave={(e) => { if (!chosen) e.currentTarget.style.background = 'transparent'; }}
            >
              <Avatar avatar={p.avatar} photo={p.photo} label={p.name} size={38} online={p.online} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold" style={{ color: 'var(--ink)' }}>{p.name}</p>
                <p className="text-[11px]" style={{ color: 'var(--dim)' }}>
                  {p.online ? 'Online now' : p.dmId ? 'Chat already started' : 'Community member'}
                </p>
              </div>
              {mode === 'multi' ? (
                <span
                  aria-hidden="true"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `1.5px solid ${chosen ? 'var(--brand)' : 'var(--line)'}`,
                    background: chosen ? 'var(--brand)' : 'transparent',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    flex: '0 0 20px',
                  }}
                >
                  {chosen && <Icons.Check size={12} />}
                </span>
              ) : (
                <Icons.ChevronRight size={16} style={{ color: 'var(--dim)' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
