'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TRACK, START, HOME_COLS, N, HOME, COLORS, COLOR_NAMES } from '@/lib/ludo/engine';

// ─────────────────────────────────────────────────────────────────────────────
// MZAZI LUDO — multiplayer client (display only)
// All game rules live server-side (lib/ludo/engine.js + /api/ludo/*). This
// page only renders server state and sends intents (create/join/roll/move).
// The polling loop can later be swapped for WebSocket events without UI
// changes.
// ─────────────────────────────────────────────────────────────────────────────

const SAFE = new Set([0, 7, 14, 21, 27, 34, 41, 48]);
const STARS = new Set([7, 21, 34, 48]);

const YARD_SLOTS = [[0.7, 0.7], [3.3, 0.7], [0.7, 3.3], [3.3, 3.3]];
const HOME_SLOTS = [[2, 2], [3, 2], [2, 3], [3, 3]];
const BASE_INNER = [{ x: 2, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 11 }, { x: 2, y: 11 }];
const BASE_POS = [{ x: 0, y: 0 }, { x: 9, y: 0 }, { x: 9, y: 9 }, { x: 0, y: 9 }];

const MEDALS = ['🥇', '🥈', '🥉', '4th'];

const DICE_DOTS = {
  1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

function Dice({ value, rolling }) {
  const dots = value ? DICE_DOTS[value] : [];
  return (
    <div
      style={{
        width: 62, height: 62, borderRadius: 10, background: '#F5F3EF', display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)',
        padding: 10, boxShadow: '0 6px 18px rgba(0,0,0,.5)',
        animation: rolling ? 'mz-dice .45s linear infinite' : 'mz-dice-in .3s ease',
      }}
    >
      {Array.from({ length: 9 }, (_, i) => {
        const has = dots.some(([a, b]) => a + b * 3 === i);
        return <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {has && <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#14161A' }} />}
        </div>;
      })}
    </div>
  );
}

// Token position from relative r (display-only — mirrors the engine)
function tokenCell(p, r) {
  if (r >= 0 && r < N) return TRACK[(START[p] + r) % N];
  if (r >= N && r < HOME) return HOME_COLS[p][r - N];
  return null;
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function LudoPage() {
  const [session, setSession] = useState(null); // { gameId, seat, token, mode, roomCode, localTokens? }
  const [state, setState] = useState(null); // redacted server state
  const [screen, setScreen] = useState('setup'); // setup | lobby | game
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState('');

  // Setup form
  const [mode, setMode] = useState('local');
  const [seats, setSeats] = useState(4);
  const [aiFill, setAiFill] = useState(true);
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const pollRef = useRef(null);

  // ── Session persistence ──
  const persistSession = (s) => {
    try {
      localStorage.setItem('mzazi_ludo', JSON.stringify(s));
    } catch { /* private mode */ }
    setSession(s);
  };
  const clearSession = () => {
    try { localStorage.removeItem('mzazi_ludo'); } catch { /* ignore */ }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setSession(null);
    setState(null);
    setError('');
    setScreen('setup');
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mzazi_ludo');
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.gameId) { setSession(s); setScreen(s.mode === 'online' ? 'lobby' : 'game'); }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Poll server state ──
  useEffect(() => {
    if (!session) return;
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch(`/api/ludo/status?gameId=${encodeURIComponent(session.gameId)}&seat=${session.seat}&token=${encodeURIComponent(session.token)}`);
        if (res.status === 404) { if (alive) clearSession(); return; }
        const data = await res.json();
        if (alive && data.state) {
          setState(data.state);
          setScreen(data.state.status === 'lobby' ? 'lobby' : 'game');
        }
      } catch { /* transient */ }
    };
    tick();
    pollRef.current = setInterval(tick, 1200);
    return () => { alive = false; if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // ── Actions ──
  const tokenFor = (seat) => {
    if (!session) return null;
    if (session.mode === 'local') return session.localTokens?.[seat] || null;
    return seat === session.seat ? session.token : null;
  };

  const post = async (path, body) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const createGame = async () => {
    setBusy(true); setError('');
    try {
      const data = await post('/api/ludo/create', { name: name || 'Player 1', seats, mode, aiFill });
      persistSession({
        gameId: data.gameId, seat: data.seat, token: data.playerToken,
        mode: data.mode, roomCode: data.roomCode, localTokens: data.localTokens || undefined,
      });
      setState(data.state);
      setScreen(data.mode === 'local' ? 'game' : 'lobby');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const joinGame = async () => {
    setBusy(true); setError('');
    try {
      const data = await post('/api/ludo/join', { roomCode: joinCode, name: name || 'Player' });
      persistSession({
        gameId: data.gameId, seat: data.seat, token: data.playerToken,
        mode: 'online', roomCode: data.roomCode,
      });
      setState(data.state);
      setScreen(data.state.status === 'lobby' ? 'lobby' : 'game');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const startGame = async () => {
    setBusy(true); setError('');
    try {
      const data = await post('/api/ludo/start', { gameId: session.gameId, seat: session.seat, playerToken: session.token });
      setState(data.state);
      setScreen('game');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const rollDice = async () => {
    if (!state || busy) return;
    const seat = state.turn;
    const token = tokenFor(seat);
    if (!token) return;
    setBusy(true); setRolling(true); setError('');
    try {
      const data = await post('/api/ludo/roll', { gameId: session.gameId, seat, playerToken: token });
      setState(data.state);
    } catch (e) { setError(e.message); } finally {
      setBusy(false);
      setTimeout(() => setRolling(false), 350);
    }
  };

  const moveToken = async (tokenIdx) => {
    if (!state || busy) return;
    const seat = state.turn;
    const token = tokenFor(seat);
    if (!token) return;
    setBusy(true); setError('');
    try {
      const data = await post('/api/ludo/move', { gameId: session.gameId, seat, playerToken: token, token: tokenIdx });
      setState(data.state);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  // ── Derived UI state ──
  const players = state?.players || [];
  const isLobby = screen === 'lobby';
  const finished = state?.status === 'finished';
  const myTurn = state && state.status === 'playing' && !!tokenFor(state.turn);
  const turnPlayer = state ? players.find((p) => p.seat === state.turn) : null;
  const aiThinking = state && state.status === 'playing' && turnPlayer?.type === 'ai';

  const message = (() => {
    if (!state) return '';
    if (finished) return `${players.find((p) => p.seat === state.winner)?.name || 'A player'} wins the game!`;
    const ev = state.lastEvent;
    const pn = (s) => players.find((p) => p.seat === s)?.name || 'Player';
    if (ev?.type === 'start') return 'Game started — RED rolls first!';
    if (ev?.type === 'three_sixes') return `${pn(ev.seat)} rolled three sixes — turn lost!`;
    if (ev?.type === 'roll') {
      if (ev.six) return `${pn(ev.seat)} rolled 6${myTurn ? ' — roll again!' : ' — extra roll!'}`;
      return `${pn(ev.seat)} rolled ${ev.dice}.`;
    }
    if (ev?.type === 'no_moves') return `${pn(ev.seat)} rolled ${ev.dice} but can't move — turn passes.`;
    if (ev?.type === 'move') {
      const captured = ev.captured ? ` — captured!` : '';
      return `${pn(ev.seat)} moved${captured}${ev.six ? ' (6 — extra roll)' : ''}`;
    }
    if (aiThinking) return `${turnPlayer.name} is thinking…`;
    if (myTurn) return state.phase === 'move' ? 'You rolled the dice — tap a glowing piece.' : 'Your turn — roll the dice.';
    return `Waiting for ${turnPlayer?.name || 'players'}…`;
  })();

  // ── Token rendering positions ──
  const tokens = [];
  if (state) {
    for (let p = 0; p < 4; p++) {
      for (let t = 0; t < 4; t++) {
        const r = state.board[p][t];
        let pos;
        if (r === -1) {
          const b = BASE_POS[p];
          const s = YARD_SLOTS[t];
          pos = { x: b.x + s[0], y: b.y + s[1] };
        } else if (r === HOME) {
          const b = BASE_POS[p];
          const s = HOME_SLOTS[t];
          pos = { x: b.x + s[0], y: b.y + s[1] };
        } else {
          const c = tokenCell(p, r);
          pos = { x: c[0], y: c[1] };
        }
        tokens.push({ p, t, r, x: pos.x, y: pos.y, color: COLORS[p], movable: myTurn && state.phase === 'move' && state.movable.includes(t) });
      }
    }
  }

  const humansInLobby = players.filter((p) => p.type === 'human').length;
  const canStart = session?.seat === 0 && isLobby && humansInLobby >= 2 && !busy;

  // ── Setup screen ──
  if (screen === 'setup') {
    return (
      <div className="py-10 sm:py-14">
        <div className="container-site max-w-3xl">
          <div className="text-center mb-10">
            <p className="eyebrow">Arcade</p>
            <h1 className="headline mt-3" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
              Ludo<span className="accent">.</span> Classic
            </h1>
            <p className="text-sm mt-3" style={{ color: '#79818A', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Classic 4-player Ludo with server-verified dice and moves. Play locally with friends or start an
              online room — roll a 6 to leave the base, capture opponents, and be first to bring all four
              pieces home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create */}
            <div className="card p-6">
              <p className="mono text-[10px] uppercase tracking-[0.18em] mb-4" style={{ color: '#4C535B' }}>New game</p>
              <label className="label">Mode</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[['local', 'This device'], ['online', 'Online room']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setMode(v)}
                    className="px-3 py-2.5 text-xs rounded transition-all"
                    style={{
                      background: mode === v ? 'rgba(242,169,59,0.12)' : '#0F1215',
                      color: mode === v ? '#F2A93B' : '#79818A',
                      border: `1px solid ${mode === v ? 'rgba(242,169,59,0.5)' : '#262C33'}`,
                      cursor: 'pointer',
                    }}>
                    {l}
                  </button>
                ))}
              </div>

              <label className="label">Players</label>
              <div className="flex gap-2 mb-4">
                {[2, 3, 4].map((n) => (
                  <button key={n} type="button" onClick={() => setSeats(n)}
                    className="px-4 py-2 text-sm rounded"
                    style={{
                      background: seats === n ? 'rgba(242,169,59,0.12)' : '#0F1215',
                      color: seats === n ? '#F2A93B' : '#79818A',
                      border: `1px solid ${seats === n ? 'rgba(242,169,59,0.5)' : '#262C33'}`,
                      cursor: 'pointer',
                    }}>
                    {n}
                  </button>
                ))}
              </div>

              {mode === 'online' && (
                <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded" style={{ background: '#0F1215', border: '1px solid #262C33' }}>
                  <span className="text-xs" style={{ color: '#AEB5BD' }}>Fill empty seats with AI bots</span>
                  <button type="button" onClick={() => setAiFill((v) => !v)}
                    style={{
                      width: 42, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', position: 'relative',
                      background: aiFill ? '#F2A93B' : '#262C33', transition: 'background .2s',
                    }}>
                    <span style={{
                      position: 'absolute', top: 3, left: aiFill ? 22 : 3, width: 16, height: 16, borderRadius: '50%',
                      background: '#fff', transition: 'left .2s',
                    }} />
                  </button>
                </div>
              )}

              <label className="label">Your name</label>
              <input className="input mb-4" value={name} maxLength={20}
                onChange={(e) => setName(e.target.value)} placeholder="Player 1" />

              {error && <p className="text-xs mb-3" style={{ color: '#E5484D' }}>{error}</p>}

              <button onClick={createGame} disabled={busy} className="btn btn-primary w-full" style={{ fontSize: 12 }}>
                {busy ? 'Creating…' : mode === 'local' ? 'Start local game' : 'Create room'}
              </button>
            </div>

            {/* Join */}
            <div className="card p-6">
              <p className="mono text-[10px] uppercase tracking-[0.18em] mb-4" style={{ color: '#4C535B' }}>Join a room</p>
              <p className="text-xs mb-4" style={{ color: '#79818A', lineHeight: 1.7 }}>
                Enter the 6-character room code your friend shared, or copy it from the invite link.
              </p>
              <label className="label">Room code</label>
              <input className="input mb-4 font-mono tracking-[0.3em] uppercase" value={joinCode} maxLength={6}
                onChange={(e) => setJoinCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                placeholder="ABC123" />
              <label className="label">Your name</label>
              <input className="input mb-4" value={name} maxLength={20}
                onChange={(e) => setName(e.target.value)} placeholder="Player" />
              <button onClick={joinGame} disabled={busy || joinCode.length < 4} className="btn btn-ghost w-full"
                style={{ fontSize: 12, opacity: busy || joinCode.length < 4 ? 0.5 : 1 }}>
                {busy ? 'Joining…' : 'Join room'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Lobby screen (online) ──
  if (isLobby && state) {
    const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/ludo?g=${session.roomCode}` : '';
    return (
      <div className="py-10 sm:py-14">
        <div className="container-site max-w-xl">
          <div className="card p-6 sm:p-8 text-center">
            <p className="eyebrow">Online room</p>
            <p className="mono text-[10px] uppercase tracking-[0.2em] mt-6 mb-2" style={{ color: '#4C535B' }}>Room code</p>
            <p className="headline mb-6" style={{ color: '#F2A93B', fontSize: 'clamp(2.4rem, 7vw, 3.4rem)', letterSpacing: '0.25em' }}>
              {state.roomCode}
            </p>

            <div className="mb-6 px-4 py-3 rounded" style={{ background: '#0F1215', border: '1px solid #262C33' }}>
              <p className="text-xs" style={{ color: '#79818A', lineHeight: 1.7, wordBreak: 'break-all' }}>{shareLink}</p>
            </div>
            <button onClick={() => navigator.clipboard?.writeText(shareLink)?.catch(() => {})}
              className="btn btn-dark mb-6" style={{ padding: '9px 16px', fontSize: 11 }}>
              Copy invite link
            </button>

            <p className="mono text-[10px] uppercase tracking-[0.18em] text-left mb-3" style={{ color: '#4C535B' }}>Players</p>
            <div className="space-y-2 mb-6">
              {players.map((p) => (
                <div key={p.seat} className="flex items-center justify-between px-4 py-3 rounded"
                  style={{ background: '#0F1215', border: `1px solid ${p.type === 'ai' ? '#262C33' : '#262C33'}` }}>
                  <div className="flex items-center gap-3">
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                    <span className="text-sm font-semibold" style={{ color: '#E9E7E2' }}>{p.name}</span>
                    {p.seat === session.seat && <span className="tag" style={{ color: '#F2A93B', borderColor: 'rgba(242,169,59,0.4)' }}>you</span>}
                    {p.type === 'ai' && <span className="tag" style={{ color: '#79818A', borderColor: '#262C33' }}>bot</span>}
                  </div>
                  <span className="mono text-[10px]" style={{ color: '#4C535B' }}>{COLOR_NAMES[p.seat]}</span>
                </div>
              ))}
            </div>

            {error && <p className="text-xs mb-3" style={{ color: '#E5484D' }}>{error}</p>}

            {canStart ? (
              <button onClick={startGame} disabled={busy} className="btn btn-primary w-full" style={{ fontSize: 12 }}>
                {busy ? 'Starting…' : 'Start game'}
              </button>
            ) : (
              <p className="text-xs py-3" style={{ color: '#79818A' }}>
                {session.seat === 0 ? 'Waiting for at least one more player…' : 'Waiting for the host to start…'}
              </p>
            )}
            <button onClick={clearSession} className="w-full mt-3 text-[11px] mono uppercase tracking-[0.12em]"
              style={{ color: '#4C535B', background: 'none', border: 'none', cursor: 'pointer' }}>
              Leave room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Game screen ──
  if (!state) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-14">
      <div className="container-site max-w-4xl">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <p className="eyebrow">Arcade · {state.mode === 'online' ? `Room ${state.roomCode}` : 'Local game'}</p>
            <h1 className="headline mt-2" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.3rem)' }}>Ludo<span className="accent">.</span></h1>
          </div>
          <button onClick={clearSession} className="btn btn-ghost" style={{ padding: '9px 14px', fontSize: 11 }}>
            {finished ? 'New game' : 'Quit'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6 items-start">
          {/* Board */}
          <div className="card p-3 sm:p-4">
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', maxWidth: 560, margin: '0 auto' }}>
              <svg viewBox="0 0 15 15" width="100%" height="100%" style={{ display: 'block' }}>
                <rect x="0" y="0" width="15" height="15" rx="0.6" fill="#101318" stroke="#262C33" strokeWidth="0.06" />
                {[0, 1, 2, 3].map((i) => (
                  <g key={`b${i}`}>
                    <rect x={BASE_POS[i].x + 0.15} y={BASE_POS[i].y + 0.15} width="5.7" height="5.7" rx="0.5"
                      fill={`${COLORS[i]}18`} stroke={`${COLORS[i]}66`} strokeWidth="0.06" />
                    <rect x={BASE_INNER[i].x + 0.35} y={BASE_INNER[i].y + 0.35} width="2.3" height="2.3" rx="0.3"
                      fill={COLORS[i]} opacity="0.9" />
                    <text x={BASE_INNER[i].x + 1.5} y={BASE_INNER[i].y + 1.72} textAnchor="middle" fontSize="1.05"
                      fontWeight="700" fill="#0B0D0F" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {COLOR_NAMES[i][0]}
                    </text>
                  </g>
                ))}
                {HOME_COLS.map((col, p) => (
                  <g key={`hc${p}`}>
                    {col.map(([x, y], i) => (
                      <rect key={i} x={x + 0.1} y={y + 0.1} width="0.8" height="0.8" rx="0.16"
                        fill={`${COLORS[p]}22`} stroke={`${COLORS[p]}88`} strokeWidth="0.045" />
                    ))}
                  </g>
                ))}
                {TRACK.map(([x, y], i) => {
                  const owner = START.indexOf(i);
                  const isStar = STARS.has(i);
                  return (
                    <g key={`t${i}`}>
                      <rect x={x + 0.08} y={y + 0.08} width="0.84" height="0.84" rx="0.18"
                        fill={owner >= 0 ? `${COLORS[owner]}30` : '#15191E'}
                        stroke={isStar ? '#F2A93B' : owner >= 0 ? `${COLORS[owner]}99` : '#262C33'}
                        strokeWidth="0.045" />
                      {isStar && <circle cx={x + 0.5} cy={y + 0.5} r="0.16" fill="none" stroke="#F2A93B88" strokeWidth="0.04" />}
                    </g>
                  );
                })}
              </svg>

              {/* Tokens */}
              <div style={{ position: 'absolute', inset: 0 }}>
                {tokens.map((tk, i) => {
                  const px = (tk.x / 15) * 100;
                  const py = (tk.y / 15) * 100;
                  return (
                    <div key={`${tk.p}-${tk.t}-${tk.r}`}
                      onClick={tk.movable ? () => moveToken(tk.t) : undefined}
                      style={{
                        position: 'absolute', left: `${px}%`, top: `${py}%`, width: '8.2%', height: '8.2%',
                        transform: 'translate(-50%, -50%)',
                        transition: 'left .45s cubic-bezier(.34,1.3,.64,1), top .45s cubic-bezier(.34,1.3,.64,1)',
                        cursor: tk.movable ? 'pointer' : 'default', zIndex: tk.r === -1 ? 1 : 5,
                        opacity: finished && tk.p !== state.winner ? 0.55 : 1,
                      }}>
                      {tk.movable && (
                        <div style={{ position: 'absolute', inset: '-35%', borderRadius: '50%', border: '2px solid #F2A93B', animation: 'mz-glow 1s ease-in-out infinite' }} />
                      )}
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: `radial-gradient(circle at 32% 28%, #ffffff55 0%, transparent 45%), ${tk.color}`,
                        border: '2px solid #0B0D0F', boxShadow: `0 2px 6px rgba(0,0,0,.6), 0 0 0 1.5px ${tk.color}66`,
                      }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel */}
          <div className="card p-5">
            <p className="mono text-[10px] uppercase tracking-[0.18em] mb-3" style={{ color: '#4C535B' }}>Game panel</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {players.map((p) => (
                <div key={p.seat} className="flex items-center gap-2 px-2.5 py-2 rounded"
                  style={{
                    background: state.turn === p.seat && !finished ? `${p.color}14` : '#0F1215',
                    border: `1px solid ${state.turn === p.seat && !finished ? `${p.color}66` : '#262C33'}`,
                    transition: 'all .3s',
                  }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />
                  <span className="mono text-[10px] tracking-wider truncate" style={{ color: state.turn === p.seat && !finished ? p.color : '#79818A' }}>
                    {p.name}
                  </span>
                  <span className="mono text-[10px] ml-auto" style={{ color: '#4C535B' }}>
                    {state.board[p.seat].filter((r) => r === HOME).length}/4
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center py-4">
              <Dice value={state.dice} rolling={rolling} />
            </div>

            <p className="text-xs text-center mb-4" style={{ color: '#AEB5BD', lineHeight: 1.6, minHeight: 42 }}>
              {message}
            </p>

            {myTurn && state.phase === 'roll' && (
              <button onClick={rollDice} disabled={busy} className="btn btn-primary w-full" style={{ fontSize: 12 }}>
                {busy ? 'Rolling…' : 'Roll dice'}
              </button>
            )}
            {myTurn && state.phase === 'move' && state.movable.length > 0 && (
              <div className="w-full py-2.5 text-center rounded" style={{ background: 'rgba(242,169,59,0.08)', border: '1px solid rgba(242,169,59,0.3)' }}>
                <span className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#F2A93B' }}>
                  Tap a glowing piece
                </span>
              </div>
            )}
            {myTurn && state.phase === 'move' && state.movable.length === 0 && (
              <div className="w-full py-2.5 text-center rounded" style={{ background: '#0F1215', border: '1px solid #262C33' }}>
                <span className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A' }}>
                  No moves — waiting…
                </span>
              </div>
            )}
            {!myTurn && !finished && (
              <div className="w-full py-2.5 text-center rounded" style={{ background: `${turnPlayer?.color || '#262C33'}10`, border: `1px solid ${turnPlayer?.color || '#262C33'}44` }}>
                <span className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: turnPlayer?.color || '#79818A' }}>
                  {turnPlayer?.type === 'ai' ? `${turnPlayer.name} is thinking…` : `Waiting for ${turnPlayer?.name}…`}
                </span>
              </div>
            )}

            {error && <p className="text-[11px] mt-3 text-center" style={{ color: '#E5484D' }}>{error}</p>}

            <div className="mt-5 pt-4" style={{ borderTop: '1px solid #1B2026' }}>
              <p className="mono text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: '#4C535B' }}>Rules</p>
              <ul className="text-[11px] space-y-1.5" style={{ color: '#79818A', lineHeight: 1.6 }}>
                <li>• Roll a <strong style={{ color: '#F2A93B' }}>6</strong> to leave the base — and roll again.</li>
                <li>• Land on an opponent to capture them (safe squares protect you).</li>
                <li>• Exact roll to reach home. First to 4 tokens home wins.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Win overlay with rankings */}
        {finished && state.ranks.length > 0 && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5,6,8,0.82)', backdropFilter: 'blur(4px)', animation: 'mz-fade .3s ease', padding: 16,
          }}>
            <div className="card p-6 sm:p-8 text-center" style={{ maxWidth: 400, width: '100%', animation: 'mz-pop .45s cubic-bezier(.34,1.56,.64,1)' }}>
              <p className="mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: '#4C535B' }}>Game over — final rankings</p>
              <h2 className="headline text-2xl mb-5" style={{ color: COLORS[state.winner] }}>
                {players.find((p) => p.seat === state.winner)?.name} wins! 🏆
              </h2>
              <div className="space-y-2 mb-6">
                {state.ranks.map((seat, idx) => {
                  const p = players.find((x) => x.seat === seat);
                  return (
                    <div key={seat} className="flex items-center gap-3 px-4 py-3 rounded"
                      style={{ background: idx === 0 ? `${COLORS[seat]}14` : '#0F1215', border: `1px solid ${idx === 0 ? `${COLORS[seat]}66` : '#262C33'}` }}>
                      <span className="text-lg" style={{ width: 34 }}>{MEDALS[idx]}</span>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[seat], display: 'inline-block' }} />
                      <span className="text-sm font-semibold truncate" style={{ color: '#E9E7E2' }}>{p?.name}</span>
                      {p?.type === 'ai' && <span className="tag ml-auto" style={{ color: '#79818A', borderColor: '#262C33' }}>bot</span>}
                    </div>
                  );
                })}
              </div>
              <button onClick={clearSession} className="btn btn-primary w-full" style={{ fontSize: 12 }}>Play again</button>
              <Link href="/" className="btn btn-ghost w-full mt-2.5" style={{ fontSize: 11 }}>Back to home</Link>
            </div>
          </div>
        )}

        <style>{`
          @keyframes mz-dice { 0% { transform: rotate(0deg) scale(1); } 25% { transform: rotate(90deg) scale(1.08); } 50% { transform: rotate(180deg) scale(1); } 75% { transform: rotate(270deg) scale(1.08); } 100% { transform: rotate(360deg) scale(1); } }
          @keyframes mz-dice-in { from { transform: rotate(-120deg) scale(0.6); opacity: 0; } to { transform: rotate(0) scale(1); opacity: 1; } }
          @keyframes mz-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(242,169,59,0.5); } 50% { box-shadow: 0 0 0 6px rgba(242,169,59,0); } }
          @keyframes mz-fade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes mz-pop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>

      </div>
    </div>
  );
}
