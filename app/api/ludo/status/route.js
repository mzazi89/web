import { NextResponse } from 'next/server';
import { redact } from '@/lib/ludo/engine';
import { loadGame } from '@/lib/ludo/store';

export const dynamic = 'force-dynamic';

// GET /api/ludo/status?gameId=...&seat=...&token=...
// Polled by the client. Never includes player tokens.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || '';
    const seat = searchParams.get('seat') !== null ? parseInt(searchParams.get('seat'), 10) : null;
    const token = searchParams.get('token') || null;

    if (!gameId) return NextResponse.json({ error: 'Missing game id' }, { status: 400 });
    const state = await loadGame(gameId);
    if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    return NextResponse.json({ state: redact(state, seat, token) });
  } catch (e) {
    console.error('Ludo status error:', e.message);
    return NextResponse.json({ error: 'Could not load the game' }, { status: 500 });
  }
}
