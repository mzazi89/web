'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// MZAZI LUDO — classic 4-player Ludo, you (RED) vs 3 AI opponents.
// Full rules: roll 6 to enter, extra turn on 6 (max 3), capture on landing,
// safe squares (starts + stars), exact roll to finish, first to get all 4
// tokens home wins. Dark MZAZI theme, SVG board, CSS-animated pieces.
// ─────────────────────────────────────────────────────────────────────────────

// 54-cell clockwise track (x=col, y=row on a 15×15 grid) — cell 0 = RED start
const TRACK = [
  [1, 8], [0, 8], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [9, 9], [9, 10], [9, 11], [9, 12], [9, 13], [9, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [5, 8], [4, 8], [3, 8], [2, 8],
];

const START = [0, 14, 27, 41]; // red, green, yellow, blue start cells
const N = TRACK.length; // 54

// Home columns (homeIndex 0 = nearest the centre, 5 = home)
const HOME_COLS = [
  [[5, 7], [4, 7], [3, 7], [2, 7], [1, 7], [0, 7]],
  [[7, 5], [7, 4], [7, 3], [7, 2], [7, 1], [7, 0]],
  [[9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7]],
  [[7, 9], [7, 10], [7, 11], [7, 12], [7, 13], [7, 14]],
];

// Safe squares: 4 start cells + 4 star cells
const SAFE = new Set([0, 7, 14, 21, 27, 34, 41, 48]);
const STARS = new Set([7, 21, 34, 48]);

const PLAYERS = [
  { name: 'RED', color: '#E5484D', dark: '#7f1d24', base: { x: 0, y: 0 } },
  { name: 'GREEN', color: '#3ECF8E', dark: '#0f5c3c', base: { x: 9, y: 0 } },
  { name: 'YELLOW', color: '#F2A93B', dark: '#7a4a0e', base: { x: 9, y: 9 } },
  { name: 'BLUE', color: '#4C7DFC', dark: '#1e3a8a', base: { x: 0, y: 9 } },
];

// Base yard slots (4 per player, inside the 6×6 base square)
const YARD_SLOTS = [
  [0.7, 0.7], [3.3, 0.7], [0.7, 3.3], [3.3, 3.3],
];
// Finished-token slots (2×2 centre of each base)
const HOME_SLOTS = [
  [2, 2], [3, 2], [2, 3], [3, 3],
];

const BASE_INNER = [
  { x: 2, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 11 }, { x: 2, y: 11 },
];

// ─── Pure game logic ─────────────────────────────────────────────────────────
function newBoard() {
  return Array.from({ length: 4 }, () => Array(4).fill(-1)); // r = -1 in base
}

function cellOf(player, r) {
  if (r >= 0 && r < N) return TRACK[(START[player] + r) % N];
  if (r >= N && r < N + 6) return HOME_COLS[player][r - N];
  return null; // base (-1) or home (N+6)
}

function occupiedTokens(board, player, cell) {
  const out = [];
  for (let p = 0; p < 4; p++) {
    if (p === player) continue;
    for (let t = 0; t < 4; t++) {
      const r = board[p][t];
      if (r >= 0 && r < N) {
        const c = TRACK[(START[p] + r) % N];
        if (c[0] === cell[0] && c[1] === cell[1]) out.push([p, t]);
      }
    }
  }
  return out;
}

// All legal moves for one player with one dice value.
function moveOptions(board, player, dice) {
  const opts = [];
  for (let t = 0; t < 4; t++) {
    const r = board[player][t];
    if (r === -1) {
      // Enter from base requires a 6 (and the start cell may hold opponents —
      // the start square is safe, so we stack rather than capture).
      if (dice === 6) opts.push({ token: t, r2: 0, enter: true });
    } else if (r >= 0 && r < N + 6) {
      const r2 = r + dice;
      if (r2 <= N + 6) opts.push({ token: t, r2, enter: false }); // exact roll to home
    }
  }
  return opts;
}

function applyMove(board, player, token, dice) {
  const nb = board.map((row) => [...row]);
  const r = nb[player][token];
  const r2 = r + dice;
  const opt = moveOptions(board, player, dice).find((o) => o.token === token);
  nb[player][token] = opt.enter ? 0 : r2;

  let captured = 0;
  // Capture only on non-safe track cells
  if (r2 >= 0 && r2 < N) {
    const cell = TRACK[(START[player] + r2) % N];
    if (!SAFE.has((START[player] + r2) % N)) {
      for (let p = 0; p < 4; p++) {
        if (p === player) continue;
        for (let t = 0; t < 4; t++) {
          const rr = nb[p][t];
          if (rr >= 0 && rr < N) {
            const c = TRACK[(START[p] + rr) % N];
            if (c[0] === cell[0] && c[1] === cell[1]) {
              nb[p][t] = -1;
              captured++;
            }
          }
        }
      }
    }
  }
  return { board: nb, captured };
}

function hasWon(board, player) {
  return board[player].every((r) => r === N + 6);
}

// ─── AI heuristic ─────────────────────────────────────────────────────────────
function scoreMove(board, player, token, dice, p) {
  const r = board[player][token];
  let score = 0;

  if (r === -1) {
    // Entering: good early, less useful late
    score += 18 + (4 - board[player].filter((x) => x === -1).length) * 2;
    return score;
  }

  const r2 = r + dice;
  if (r2 === N + 6) score += 1200; // finish
  else if (r2 >= N) score += 70 + (r2 - N) * 3; // enter home column

  const cellIdx = (START[player] + r2) % N;

  if (r2 < N) {
    if (SAFE.has(cellIdx)) score += 25;

    // Capture?
    const cell = TRACK[cellIdx];
    let canCapture = false;
    for (let op = 0; op < 4; op++) {
      if (op === player) continue;
      for (let t = 0; t < 4; t++) {
        const rr = board[op][t];
        if (rr >= 0 && rr < N) {
          const c = TRACK[(START[op] + rr) % N];
          if (c[0] === cell[0] && c[1] === cell[1] && !SAFE.has(cellIdx)) canCapture = true;
        }
      }
    }
    if (canCapture) score += 60;

    // Danger: opponent within 6 steps behind (could capture next turn)
    if (!SAFE.has(cellIdx)) {
      for (let op = 0; op < 4; op++) {
        if (op === player) continue;
        for (let t = 0; t < 4; t++) {
          const rr = board[op][t];
          if (rr >= 0 && rr < N) {
            const behind = (START[player] + r2 - (START[op] + rr) + N * 4) % N;
            if (behind > 0 && behind <= 6) score -= 45;
          }
        }
      }
    }

    score += (r2 - r) * 0.6; // progress
  }

  return score;
}

function aiPick(board, player, dice) {
  const opts = moveOptions(board, player, dice);
  if (!opts.length) return null;
  let best = opts[0];
  let bestScore = -Infinity;
  for (const o of opts) {
    const s = scoreMove(board, player, o.token, dice, PLAYERS[player]);
    if (s > bestScore) { bestScore = s; best = o; }
  }
  return best;
}

// ─── Board rendering helpers ──────────────────────────────────────────────────
const C = 1 / 15; // cell size in viewBox units (rendered at scale)

function TokenDot({ x, y, color, r = 0.4, onClick, movable, dim, scale = 1 }) {
  return (
    <g
      transform={`translate(${(x + 0.5) * C * 100 * scale} ${(y + 0.5) * C * 100 * scale})`}
      style={{ cursor: onClick ? 'pointer' : 'default', opacity: dim ? 0.35 : 1, transition: 'opacity .2s' }}
      onClick={onClick}
    >
      {movable && (
        <circle r={C * 100 * 0.62 * scale} fill="none" stroke="#F2A93B" strokeWidth={0.045 * 100 * scale} opacity={0.9}>
          <animate attributeName="opacity" values="1;0.25;1" dur="1.1s" repeatCount="indefinite" />
        </circle>
      )}
      <circle r={C * 100 * 0.42 * scale} fill={color} stroke="#0B0D0F" strokeWidth={0.055 * 100 * scale} />
      <circle r={C * 100 * 0.42 * scale} fill="none" stroke="#ffffff33" strokeWidth={0.028 * 100 * scale} />
      <circle r={C * 100 * 0.13 * scale} cx={-C * 100 * 0.13 * scale} cy={-C * 100 * 0.16 * scale} fill="#ffffff44" />
    </g>
  );
}

// ─── Dice face ────────────────────────────────────────────────────────────────
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
      className="dice"
      style={{
        width: 64, height: 64, borderRadius: 10, background: '#F5F3EF', display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)',
        padding: 10, boxShadow: '0 6px 18px rgba(0,0,0,0.5)', animation: rolling ? 'mz-dice 0.5s linear infinite' : 'none',
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function LudoPage() {
  const [board, setBoard] = useState(newBoard);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [phase, setPhase] = useState('roll'); // roll | move | over
  const [sixCount, setSixCount] = useState(0);
  const [winner, setWinner] = useState(null);
  const [msg, setMsg] = useState('Your turn — roll the dice to start.');
  const [movable, setMovable] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [gameKey, setGameKey] = useState(0);
  const busyRef = useRef(false);

  const human = 0;

  const reset = () => {
    setBoard(newBoard());
    setTurn(0);
    setDice(null);
    setRolling(false);
    setPhase('roll');
    setSixCount(0);
    setWinner(null);
    setMovable([]);
    setLastMove(null);
    setMsg('Your turn — roll the dice to start.');
    busyRef.current = false;
    setGameKey((k) => k + 1);
  };

  const nextTurn = useCallback((after) => {
    setTurn((t) => (t + 1) % 4);
    setDice(null);
    setSixCount(0);
    setPhase('roll');
    setMovable([]);
    setMsg(after ? `Player ${PLAYERS[(turn + 1) % 4].name} — roll the dice.` : '');
  }, [turn]);

  const doMove = useCallback((token) => {
    const d = dice;
    if (d === null) return;
    setBoard((prev) => {
      const res = applyMove(prev, turn, token, d);
      const won = hasWon(res.board, turn);
      setLastMove({ player: turn, token, dice: d, captured: res.captured });

      if (won) {
        setWinner(turn);
        setPhase('over');
        setMsg(`${PLAYERS[turn].name} wins the game!`);
        return res.board;
      }

      // Extra turn on 6 (max 2 extra rolls), otherwise pass
      if (d === 6 && sixCount < 2) {
        setSixCount((c) => c + 1);
        setDice(null);
        setPhase('roll');
        setMsg(`${PLAYERS[turn].name} rolled a 6 — roll again${res.captured ? ' and captured!' : '!'}`);
      } else {
        nextTurn();
        setMsg(`Player ${PLAYERS[(turn + 1) % 4].name}'s turn.`);
      }
      return res.board;
    });
  }, [dice, turn, sixCount, nextTurn]);

  // ── Roll the dice (human) ──
  const roll = () => {
    if (busyRef.current || phase !== 'roll' || turn !== human) return;
    if (winner !== null) return;
    busyRef.current = true;
    setRolling(true);
    setMovable([]);
    setDice(null);

    setTimeout(() => {
      const d = 1 + Math.floor(Math.random() * 6);
      setDice(d);
      setRolling(false);

      if (d === 6 && sixCount === 2) {
        // Three consecutive sixes — lose the turn
        setMsg('Three sixes in a row — turn lost!');
        busyRef.current = false;
        nextTurn();
        return;
      }

      const opts = moveOptions(board, turn, d);
      if (!opts.length) {
        setMsg(d === 6 ? 'No pieces can move — turn passes.' : 'No pieces can move — turn passes.');
        busyRef.current = false;
        nextTurn();
        return;
      }

      if (turn === human) {
        setMovable(opts.map((o) => o.token));
        setPhase('move');
        setMsg(`You rolled ${d}. Tap a glowing piece to move it.`);
        busyRef.current = false;
      } else {
        setPhase('move');
        const pick = aiPick(board, turn, d);
        setTimeout(() => doMove(pick.token), 650);
        busyRef.current = false;
      }
    }, 550);
  };

  // ── AI turn driver ──
  useEffect(() => {
    if (winner !== null || phase !== 'roll' || turn === human) return;
    const t = setTimeout(() => roll(), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, phase, winner]);

  // ── Token positions for rendering ──
  const tokens = [];
  for (let p = 0; p < 4; p++) {
    for (let t = 0; t < 4; t++) {
      const r = board[p][t];
      let pos;
      if (r === -1) {
        const b = PLAYERS[p].base;
        const s = YARD_SLOTS[t];
        pos = { x: b.x + s[0], y: b.y + s[1] };
      } else if (r === N + 6) {
        const b = PLAYERS[p].base;
        const s = HOME_SLOTS[t];
        pos = { x: b.x + s[0], y: b.y + s[1] };
      } else {
        const c = cellOf(p, r);
        pos = { x: c[0], y: c[1] };
      }
      tokens.push({ p, t, r, ...pos, color: PLAYERS[p].color, movable: turn === p && phase === 'move' && movable.includes(t) });
    }
  }

  const finished = (p) => board[p].filter((r) => r === N + 6).length;
  const humanTurn = turn === human && phase !== 'over';

  return (
    <div className="py-10 sm:py-14" key={gameKey}>
      <div className="container-site max-w-4xl">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="eyebrow">Arcade</p>
            <h1 className="headline mt-3" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)' }}>
              Ludo<span className="accent">.</span>
            </h1>
            <p className="text-sm mt-2" style={{ color: '#79818A' }}>
              Classic 4-player Ludo — you (RED) vs 3 AI opponents. First to get all four tokens home wins.
            </p>
          </div>
          <button onClick={reset} className="btn btn-ghost" style={{ padding: '10px 16px', fontSize: 11 }}>
            ↻ New game
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6 items-start">
          {/* ── Board ── */}
          <div className="card p-3 sm:p-4">
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', maxWidth: 560, margin: '0 auto' }}>
              <svg viewBox="0 0 15 15" width="100%" height="100%" style={{ display: 'block' }}>
                <rect x="0" y="0" width="15" height="15" rx="0.6" fill="#101318" stroke="#262C33" strokeWidth="0.06" />

                {/* Home bases */}
                {PLAYERS.map((p, i) => (
                  <g key={i}>
                    <rect x={p.base.x + 0.15} y={p.base.y + 0.15} width="5.7" height="5.7" rx="0.5"
                      fill={`${p.color}18`} stroke={`${p.color}66`} strokeWidth="0.06" />
                    <rect x={BASE_INNER[i].x + 0.35} y={BASE_INNER[i].y + 0.35} width="2.3" height="2.3" rx="0.3"
                      fill={p.color} opacity="0.9" />
                    <text x={BASE_INNER[i].x + 1.5} y={BASE_INNER[i].y + 1.72} textAnchor="middle" fontSize="1.05"
                      fontWeight="700" fill="#0B0D0F" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {p.name[0]}
                    </text>
                  </g>
                ))}

                {/* Home columns */}
                {HOME_COLS.map((col, p) => (
                  <g key={`hc${p}`}>
                    {col.map(([x, y], i) => (
                      <rect key={i} x={x + 0.1} y={y + 0.1} width="0.8" height="0.8" rx="0.16"
                        fill={`${PLAYERS[p].color}22`} stroke={`${PLAYERS[p].color}88`} strokeWidth="0.045" />
                    ))}
                  </g>
                ))}

                {/* Track cells */}
                {TRACK.map(([x, y], i) => {
                  const isStart = START.includes(i);
                  const isStar = STARS.has(i);
                  const owner = START.indexOf(i);
                  return (
                    <g key={`t${i}`}>
                      <rect x={x + 0.08} y={y + 0.08} width="0.84" height="0.84" rx="0.18"
                        fill={isStart ? `${PLAYERS[owner].color}30` : '#15191E'}
                        stroke={isStar ? '#F2A93B' : isStart ? `${PLAYERS[owner].color}99` : '#262C33'}
                        strokeWidth="0.045" />
                      {isStar && (
                        <circle cx={x + 0.5} cy={y + 0.5} r="0.16" fill="none" stroke="#F2A93B88" strokeWidth="0.04" />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Tokens (HTML overlay for smooth CSS transitions) */}
              <div style={{ position: 'absolute', inset: 0 }}>
                {tokens.map((tk, i) => {
                  const px = (tk.x / 15) * 100;
                  const py = (tk.y / 15) * 100;
                  const sz = 8.2; // % of board
                  return (
                    <div
                      key={`${tk.p}-${tk.t}-${tk.r}`}
                      onClick={tk.movable ? () => doMove(tk.t) : undefined}
                      style={{
                        position: 'absolute', left: `${px}%`, top: `${py}%`, width: `${sz}%`, height: `${sz}%`,
                        transform: 'translate(-50%, -50%)', transition: 'left .45s cubic-bezier(.34,1.3,.64,1), top .45s cubic-bezier(.34,1.3,.64,1)',
                        cursor: tk.movable ? 'pointer' : 'default', zIndex: tk.r === -1 ? 1 : 5,
                        opacity: phase === 'over' && winner !== null && tk.p !== winner ? 0.55 : 1,
                      }}
                    >
                      {tk.movable && (
                        <div style={{ position: 'absolute', inset: '-35%', borderRadius: '50%', border: '2px solid #F2A93B', animation: 'mz-glow 1s ease-in-out infinite' }} />
                      )}
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: `radial-gradient(circle at 32% 28%, #ffffff55 0%, transparent 45%), ${tk.color}`,
                        border: '2px solid #0B0D0F', boxShadow: `0 2px 6px rgba(0,0,0,.6), 0 0 0 1.5px ${tk.color}66`,
                        transition: 'box-shadow .2s',
                      }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Control panel ── */}
          <div className="card p-5">
            <p className="mono text-[10px] uppercase tracking-[0.18em] mb-3" style={{ color: '#4C535B' }}>Game panel</p>

            {/* Turn + scores */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PLAYERS.map((p, i) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded"
                  style={{
                    background: turn === i && phase !== 'over' ? `${p.color}14` : '#0F1215',
                    border: `1px solid ${turn === i && phase !== 'over' ? `${p.color}66` : '#262C33'}`,
                    transition: 'all .3s',
                  }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />
                  <span className="mono text-[10px] tracking-wider" style={{ color: turn === i ? p.color : '#79818A' }}>
                    {p.name}
                  </span>
                  <span className="mono text-[10px] ml-auto" style={{ color: '#4C535B' }}>
                    {finished(i)}/4
                  </span>
                </div>
              ))}
            </div>

            {/* Dice */}
            <div className="flex items-center justify-center py-4">
              <Dice value={dice} rolling={rolling} />
            </div>

            {/* Message */}
            <p className="text-xs text-center mb-4" style={{ color: '#AEB5BD', lineHeight: 1.6, minHeight: 40 }}>
              {msg}
            </p>

            {/* Roll button */}
            {humanTurn && phase === 'roll' && (
              <button onClick={roll} disabled={rolling} className="btn btn-primary w-full" style={{ fontSize: 12 }}>
                {rolling ? 'Rolling…' : `Roll dice${dice === null ? '' : ' again'}`}
              </button>
            )}
            {humanTurn && phase === 'move' && dice !== null && (
              <button onClick={() => { setPhase('roll'); setMovable([]); setMsg(`Roll again (${dice}).`); }}
                className="btn btn-primary w-full" style={{ fontSize: 12 }}>
                Roll again
              </button>
            )}
            {!humanTurn && phase !== 'over' && (
              <div className="w-full py-2.5 text-center rounded" style={{ background: `${PLAYERS[turn].color}10`, border: `1px solid ${PLAYERS[turn].color}44` }}>
                <span className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: PLAYERS[turn].color }}>
                  {PLAYERS[turn].name} is thinking…
                </span>
              </div>
            )}

            {phase === 'over' && winner !== null && (
              <button onClick={reset} className="btn btn-primary w-full" style={{ fontSize: 12 }}>
                Play again
              </button>
            )}

            {/* Rules */}
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid #1B2026' }}>
              <p className="mono text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: '#4C535B' }}>Rules</p>
              <ul className="text-[11px] space-y-1.5" style={{ color: '#79818A', lineHeight: 1.6 }}>
                <li>• Roll a <strong style={{ color: '#F2A93B' }}>6</strong> to move a piece out of the base.</li>
                <li>• Rolling a 6 gives an extra roll (three 6s = lost turn).</li>
                <li>• Land on an opponent to send them back to base — safe squares protect you.</li>
                <li>• Exact roll required to reach home. First to 4 tokens home wins.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Win overlay */}
        {phase === 'over' && winner !== null && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(5,6,8,0.82)', backdropFilter: 'blur(4px)', animation: 'mz-fade .3s ease',
          }}>
            <div className="card p-8 text-center" style={{ maxWidth: 380, animation: 'mz-pop .45s cubic-bezier(.34,1.56,.64,1)' }}>
              <div className="text-5xl mb-3" style={{ animation: 'mz-bounce 1s ease infinite' }}>
                {winner === human ? '🏆' : '🤖'}
              </div>
              <p className="mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: '#4C535B' }}>Game over</p>
              <h2 className="headline text-2xl mb-1" style={{ color: PLAYERS[winner].color }}>
                {PLAYERS[winner].name} wins!
              </h2>
              <p className="text-xs mb-6" style={{ color: '#79818A' }}>
                {winner === human ? 'You beat the bots. Impressive.' : `${PLAYERS[winner].name} got all four pieces home first.`}
              </p>
              <button onClick={reset} className="btn btn-primary w-full">Play again</button>
              <Link href="/" className="btn btn-ghost w-full mt-2.5" style={{ fontSize: 11 }}>Back to home</Link>
            </div>
          </div>
        )}

        <style>{`
          @keyframes mz-dice { 0% { transform: rotate(0deg) scale(1); } 25% { transform: rotate(90deg) scale(1.06); } 50% { transform: rotate(180deg) scale(1); } 75% { transform: rotate(270deg) scale(1.06); } 100% { transform: rotate(360deg) scale(1); } }
          @keyframes mz-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(242,169,59,0.5); } 50% { box-shadow: 0 0 0 6px rgba(242,169,59,0); } }
          @keyframes mz-fade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes mz-pop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes mz-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        `}</style>

      </div>
    </div>
  );
}
