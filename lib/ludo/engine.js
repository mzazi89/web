// ─────────────────────────────────────────────────────────────────────────────
// MZAZI LUDO — server-authoritative game engine
//
// Pure, framework-agnostic (no Next/React imports) so the SAME engine can be
// driven by HTTP routes today and by WebSockets/Socket.IO later without
// changes. All game truth lives here: dice rolls, move legality, captures,
// turns, wins and rankings. Clients only send intents; the server decides.
//
// State shape:
//   {
//     id, roomCode, mode: 'local'|'online', status: 'lobby'|'playing'|'finished',
//     players: [{ seat, name, color, type: 'human'|'ai', token? }],
//     board: number[4][4]   // relative position per token; -1 = base, 60 = home
//     turn: seat, phase: 'idle'|'roll'|'move',
//     dice: 1-6|null, sixCount: 0-3, winner: seat|null, ranks: seat[],
//     lastEvent: { type, seat, dice, token, captured, ... } | null,
//     createdAt, updatedAt
//   }
//
// Relative position r: 0..53 on track (cell = (START[p] + r) % 54),
// 54..59 in the home column (r-54 = homeIndex 0..5), 60 = home.
// ─────────────────────────────────────────────────────────────────────────────

export const TRACK = [
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

export const START = [0, 14, 27, 41];
export const N = TRACK.length; // 54
export const HOME = N + 6; // 60 — relative position of a finished token

export const HOME_COLS = [
  [[5, 7], [4, 7], [3, 7], [2, 7], [1, 7], [0, 7]],
  [[7, 5], [7, 4], [7, 3], [7, 2], [7, 1], [7, 0]],
  [[9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7]],
  [[7, 9], [7, 10], [7, 11], [7, 12], [7, 13], [7, 14]],
];

// Safe squares: 4 start cells + 4 star cells (absolute track indices)
export const SAFE = new Set([0, 7, 14, 21, 27, 34, 41, 48]);

export const COLORS = ['#E5484D', '#3ECF8E', '#F2A93B', '#4C7DFC'];
export const COLOR_NAMES = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

const MAX_AI_RESOLUTIONS = 400;

// ─── State factory ───────────────────────────────────────────────────────────
export function createState({ id, roomCode, mode, players }) {
  return {
    id,
    roomCode,
    mode,
    status: 'lobby',
    players, // [{ seat, name, color, type, token? }]
    board: Array.from({ length: 4 }, () => Array(4).fill(-1)),
    turn: 0,
    phase: 'idle',
    dice: null,
    sixCount: 0,
    winner: null,
    ranks: [],
    lastEvent: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function clone(state) {
  return JSON.parse(JSON.stringify(state));
}

export function cellOf(player, r) {
  if (r >= 0 && r < N) return TRACK[(START[player] + r) % N];
  if (r >= N && r < HOME) return HOME_COLS[player][r - N];
  return null;
}

export function tokensHome(board, player) {
  return board[player].filter((r) => r === HOME).length;
}

export function maxProgress(board, player) {
  let m = -1;
  for (const r of board[player]) m = Math.max(m, r);
  return m;
}

// ─── Legal moves for the current turn + dice ─────────────────────────────────
export function legalMoves(state) {
  const { board, turn, dice } = state;
  const opts = [];
  if (dice === null || state.phase !== 'move') return opts;
  for (let t = 0; t < 4; t++) {
    const r = board[turn][t];
    if (r === -1) {
      if (dice === 6) opts.push({ token: t, r2: 0, enter: true });
    } else if (r >= 0 && r < HOME) {
      const r2 = r + dice;
      if (r2 <= HOME) opts.push({ token: t, r2, enter: false }); // exact roll to home
    }
  }
  return opts;
}

// ─── Roll the dice (server owns randomness) ──────────────────────────────────
// rng: () => 1..6 (inject crypto.randomInt in routes, Math.random in tests)
export function roll(state, seat, rng) {
  if (state.status !== 'playing') return { ok: false, error: 'Game is not in progress' };
  if (seat !== state.turn) return { ok: false, error: 'Not your turn' };
  if (state.phase === 'move') return { ok: false, error: 'Roll again after moving' };

  const d = rng();
  state.dice = d;
  state.phase = 'move';
  state.updatedAt = new Date().toISOString();

  if (d === 6) {
    state.sixCount += 1;
    if (state.sixCount > 2) {
      // Three consecutive sixes — turn lost
      state.dice = null;
      state.phase = 'roll';
      state.sixCount = 0;
      state.lastEvent = { type: 'three_sixes', seat };
      nextTurn(state);
      return { ok: true, threeSixes: true };
    }
    state.lastEvent = { type: 'roll', seat, dice: d, six: true };
  } else {
    state.sixCount = 0;
    state.lastEvent = { type: 'roll', seat, dice: d, six: false };
  }

  // Classic rule: if the roll produces no legal move, the turn passes
  // (even on a 6 — the extra roll is lost).
  if (legalMoves(state).length === 0) {
    state.dice = null;
    state.phase = 'roll';
    state.sixCount = 0;
    state.lastEvent = { type: 'no_moves', seat, dice: d };
    nextTurn(state);
    return { ok: true, noMoves: true };
  }

  return { ok: true, six: d === 6 };
}

function nextTurn(state) {
  state.turn = (state.turn + 1) % 4;
  state.phase = 'roll';
}

// ─── Apply a move (validated) ────────────────────────────────────────────────
export function move(state, seat, token) {
  if (state.status !== 'playing') return { ok: false, error: 'Game is not in progress' };
  if (seat !== state.turn) return { ok: false, error: 'Not your turn' };
  if (state.phase !== 'move' || state.dice === null) return { ok: false, error: 'Roll the dice first' };

  const opts = legalMoves(state);
  const opt = opts.find((o) => o.token === token);
  if (!opt) return { ok: false, error: 'Invalid move' };

  const { board } = state;
  const r = board[seat][token];
  board[seat][token] = opt.enter ? 0 : opt.r2;

  let captured = [];
  if (opt.r2 >= 0 && opt.r2 < N) {
    const cellIdx = (START[seat] + opt.r2) % N;
    if (!SAFE.has(cellIdx)) {
      const cell = TRACK[cellIdx];
      for (let p = 0; p < 4; p++) {
        if (p === seat) continue;
        for (let t = 0; t < 4; t++) {
          const rr = board[p][t];
          if (rr >= 0 && rr < N) {
            const c = TRACK[(START[p] + rr) % N];
            if (c[0] === cell[0] && c[1] === cell[1]) {
              board[p][t] = -1;
              captured.push({ p, t });
            }
          }
        }
      }
    }
  }

  const finished = tokensHome(board, seat) === 4;
  state.updatedAt = new Date().toISOString();

  if (finished) {
    state.dice = null;
    state.phase = 'idle';
    state.status = 'finished';
    state.winner = seat;
    state.ranks = computeRanks(state);
    state.lastEvent = { type: 'win', seat, dice: state.dice, token, captured: captured.length };
    return { ok: true, finished: true };
  }

  state.lastEvent = {
    type: 'move',
    seat,
    dice: state.dice,
    token,
    r2: board[seat][token],
    captured: captured.length,
    six: state.dice === 6,
  };

  // Rolled a 6 → same player rolls again (sixCount already incremented by roll())
  if (state.dice === 6) {
    state.dice = null;
    state.phase = 'roll';
    return { ok: true, six: true };
  }

  // Otherwise pass the turn
  state.dice = null;
  state.sixCount = 0;
  nextTurn(state);
  return { ok: true };
}

// ─── Rankings (when the game ends) ───────────────────────────────────────────
export function computeRanks(state) {
  const { board, winner } = state;
  const others = [];
  for (let p = 0; p < 4; p++) {
    if (p === winner) continue;
    const totalR = board[p].reduce((a, b) => a + (b >= 0 ? b : 0), 0);
    others.push({ seat: p, home: tokensHome(board, p), maxR: maxProgress(board, p), totalR });
  }
  others.sort((a, b) => b.home - a.home || b.maxR - a.maxR || b.totalR - a.totalR || a.seat - b.seat);
  return [winner, ...others.map((o) => o.seat)];
}

// ─── AI ───────────────────────────────────────────────────────────────────────
function scoreMove(state, token, dice) {
  const { board, turn: p } = state;
  const r = board[p][token];
  let s = 0;

  if (r === -1) {
    // Entering: more valuable while pieces are still trapped
    s += 18 + (4 - board[p].filter((x) => x === -1).length) * 2;
    return s;
  }

  const r2 = r + dice;
  if (r2 === HOME) s += 1200;
  else if (r2 >= N) s += 70 + (r2 - N) * 3;

  const cellIdx = (START[p] + r2) % N;

  if (r2 < N) {
    if (SAFE.has(cellIdx)) s += 25;

    // Capture?
    const cell = TRACK[cellIdx];
    let canCapture = false;
    for (let op = 0; op < 4; op++) {
      if (op === p) continue;
      for (let t = 0; t < 4; t++) {
        const rr = board[op][t];
        if (rr >= 0 && rr < N) {
          const c = TRACK[(START[op] + rr) % N];
          if (c[0] === cell[0] && c[1] === cell[1] && !SAFE.has(cellIdx)) canCapture = true;
        }
      }
    }
    if (canCapture) s += 60;

    // Danger: an opponent within 6 steps behind could capture next turn
    if (!SAFE.has(cellIdx)) {
      for (let op = 0; op < 4; op++) {
        if (op === p) continue;
        for (let t = 0; t < 4; t++) {
          const rr = board[op][t];
          if (rr >= 0 && rr < N) {
            const behind = (START[p] + r2 - (START[op] + rr) + N * 4) % N;
            if (behind > 0 && behind <= 6) s -= 45;
          }
        }
      }
    }

    s += (r2 - r) * 0.6; // progress
  }

  return s;
}

export function aiChoose(state, dice) {
  const opts = legalMoves(state);
  if (!opts.length) return null;
  let best = opts[0];
  let bestScore = -Infinity;
  for (const o of opts) {
    const s = scoreMove(state, o.token, dice);
    if (s > bestScore) { bestScore = s; best = o; }
  }
  return best;
}

// Resolve consecutive AI turns after a human action. The server plays AI
// seats instantly (clients see the resulting state); capped for safety.
export function autoResolveAI(state, rng) {
  let guard = 0;
  while (state.status === 'playing' && state.players[state.turn]?.type === 'ai' && guard < MAX_AI_RESOLUTIONS) {
    guard += 1;
    const seat = state.turn;
    const res = roll(state, seat, rng);
    if (!res.ok) break; // shouldn't happen for AI turns
    if (res.threeSixes) continue;
    const pick = aiChoose(state, state.dice);
    if (!pick) {
      // No legal move → turn passes (even on a 6 — the extra roll is lost)
      state.dice = null;
      state.phase = 'roll';
      state.sixCount = 0;
      nextTurn(state);
      continue;
    }
    move(state, seat, pick.token);
  }
}

// ─── Public view (no secrets) ────────────────────────────────────────────────
// If the caller passes a valid seat+token, `movable` lists the tokens they may
// move right now (used to highlight pieces).
export function redact(state, reqSeat = null, reqToken = null) {
  const { players } = state;
  const actor = players.find((p) => p.seat === reqSeat && p.token && p.token === reqToken);
  let movable = [];
  if (actor && state.status === 'playing' && state.turn === reqSeat && state.phase === 'move') {
    movable = legalMoves(state).map((o) => o.token);
  }
  return {
    id: state.id,
    roomCode: state.roomCode,
    mode: state.mode,
    status: state.status,
    phase: state.phase,
    turn: state.turn,
    dice: state.dice,
    sixCount: state.sixCount,
    winner: state.winner,
    ranks: state.ranks,
    board: state.board,
    movable,
    players: players.map((p) => ({
      seat: p.seat, name: p.name, color: p.color, type: p.type,
      joined: p.type === 'ai' ? true : !!p.token, // open human slots are not joined
    })),
    lastEvent: state.lastEvent,
    updatedAt: state.updatedAt,
  };
}
