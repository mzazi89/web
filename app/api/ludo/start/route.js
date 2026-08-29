import { NextResponse } from 'next/server';
import { redact } from '@/lib/ludo/engine';
import { loadGame, saveGame } from '@/lib/ludo/store';

export const dynamic = 'force-dynamic';

// POST /api/ludo/start — { gameId, seat, playerToken }
// The host (seat 0) starts an online game from the lobby once at least two
// players are present.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { gameId, seat, playerToken } = body;

    const state = await loadGame(String(gameId || ''));
    if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    if (state.status !== 'lobby') return NextResponse.json({ error: 'Game already started' }, { status: 409 });

    const player = state.players.find((p) => p.seat === seat && p.token === playerToken);
    if (!player) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    if (seat !== 0) return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 });

    const humans = state.players.filter((p) => p.type === 'human').length;
    if (humans < 2) {
      return NextResponse.json({ error: 'Need at least 2 players to start' }, { status: 400 });
    }

    state.status = 'playing';
    state.phase = 'roll';
    state.turn = 0;
    state.lastEvent = { type: 'start' };
    state.updatedAt = new Date().toISOString();

    await saveGame(state);
    return NextResponse.json({ state: redact(state, seat, playerToken) });
  } catch (e) {
    console.error('Ludo start error:', e.message);
    return NextResponse.json({ error: 'Could not start the game' }, { status: 500 });
  }
}
