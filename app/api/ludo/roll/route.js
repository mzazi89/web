import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { roll, autoResolveAI, redact } from '@/lib/ludo/engine';
import { loadGame, saveGame } from '@/lib/ludo/store';

export const dynamic = 'force-dynamic';

// The server owns the dice — clients can never supply a dice value.
const rng = () => crypto.randomInt(1, 7);

// POST /api/ludo/roll — { gameId, seat, playerToken }
// Rolls the dice for the current player, then resolves any consecutive AI
// turns, and returns the redacted state.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { gameId, seat, playerToken } = body;

    const state = await loadGame(String(gameId || ''));
    if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    const player = state.players.find((p) => p.seat === seat && p.token === playerToken);
    if (!player) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const res = roll(state, seat, rng);
    if (!res.ok) return NextResponse.json({ error: res.error || 'Invalid roll' }, { status: 400 });

    // If the roll passed the turn to an AI seat, the server plays it out
    autoResolveAI(state, rng);

    await saveGame(state);
    return NextResponse.json({ state: redact(state, seat, playerToken) });
  } catch (e) {
    console.error('Ludo roll error:', e.message);
    return NextResponse.json({ error: 'Could not roll the dice' }, { status: 500 });
  }
}
