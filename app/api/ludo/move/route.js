import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { move, autoResolveAI, redact } from '@/lib/ludo/engine';
import { loadGame, saveGame } from '@/lib/ludo/store';

export const dynamic = 'force-dynamic';

const rng = () => crypto.randomInt(1, 7);

// POST /api/ludo/move — { gameId, seat, playerToken, token }
// Moves the given token for the current player. The server re-validates the
// move against the engine (legality, turn, dice) — invalid moves are
// rejected. Consecutive AI turns are resolved server-side.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { gameId, seat, playerToken, token } = body;

    const state = await loadGame(String(gameId || ''));
    if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    const player = state.players.find((p) => p.seat === seat && p.token === playerToken);
    if (!player) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    if (!Number.isInteger(token) || token < 0 || token > 3) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const res = move(state, seat, token);
    if (!res.ok) return NextResponse.json({ error: res.error || 'Invalid move' }, { status: 400 });

    autoResolveAI(state, rng);

    await saveGame(state);
    return NextResponse.json({ state: redact(state, seat, playerToken) });
  } catch (e) {
    console.error('Ludo move error:', e.message);
    return NextResponse.json({ error: 'Could not move the token' }, { status: 500 });
  }
}
