import { NextResponse } from 'next/server';
import { redact } from '@/lib/ludo/engine';
import { loadGame, findByRoom } from '@/lib/ludo/store';

export const dynamic = 'force-dynamic';

// GET /api/ludo/status?gameId=...&seat=...&token=...
//    or /api/ludo/status?room=CODE (room lookup for the join picker)
// Polled by the client. Never includes player tokens.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || '';
    const room = searchParams.get('room') || '';
    const seat = searchParams.get('seat') !== null ? parseInt(searchParams.get('seat'), 10) : null;
    const token = searchParams.get('token') || null;

    let state = null;
    if (room) {
      state = await findByRoom(room.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
    } else if (gameId) {
      state = await loadGame(gameId);
    } else {
      return NextResponse.json({ error: 'Missing game id or room' }, { status: 400 });
    }

    if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    return NextResponse.json({ state: redact(state, seat, token) });
  } catch (e) {
    console.error('Ludo status error:', e.message);
    return NextResponse.json({ error: 'Could not load the game' }, { status: 500 });
  }
}
