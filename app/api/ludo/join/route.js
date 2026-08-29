import { NextResponse } from 'next/server';
import { redact } from '@/lib/ludo/engine';
import { findByRoom, saveGame, newToken } from '@/lib/ludo/store';

export const dynamic = 'force-dynamic';

function clean(s, max = 20) {
  return String(s || '').replace(/[<>&"']/g, '').trim().slice(0, max) || 'Player';
}

// POST /api/ludo/join — { roomCode, name }
// Joins the next open human seat. Starts the game when the last open seat
// is taken (or returns the state; the host can also press Start).
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const roomCode = String(body.roomCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (roomCode.length < 4) {
      return NextResponse.json({ error: 'Enter a valid room code.' }, { status: 400 });
    }

    const state = await findByRoom(roomCode);
    if (!state) return NextResponse.json({ error: 'Room not found. Check the code and try again.' }, { status: 404 });
    if (state.mode !== 'online') return NextResponse.json({ error: 'This room is not joinable.' }, { status: 400 });
    if (state.status !== 'lobby') return NextResponse.json({ error: 'This game has already started.' }, { status: 409 });

    // Optional seat (color) selection — validated against open slots
    const wantedSeat = Number.isInteger(body.seat) && body.seat >= 0 && body.seat <= 3 ? body.seat : null;
    let slot = null;
    if (wantedSeat !== null) {
      const p = state.players.find((x) => x.seat === wantedSeat);
      if (p && p.type === 'human' && !p.token) slot = p;
      else return NextResponse.json({ error: 'That color is already taken.' }, { status: 409 });
    }
    if (!slot) slot = state.players.find((p) => p.type === 'human' && !p.token);
    if (!slot) return NextResponse.json({ error: 'This room is full.' }, { status: 409 });

    const token = newToken();
    slot.token = token;
    slot.name = clean(body.name);
    state.updatedAt = new Date().toISOString();

    const stillOpen = state.players.some((p) => p.type === 'human' && !p.token);
    if (!stillOpen) {
      state.status = 'playing';
      state.phase = 'roll';
      state.lastEvent = { type: 'start' };
    }

    await saveGame(state);
    return NextResponse.json({
      gameId: state.id,
      roomCode: state.roomCode,
      mode: 'online',
      seat: slot.seat,
      playerToken: token,
      state: redact(state, slot.seat, token),
    });
  } catch (e) {
    console.error('Ludo join error:', e.message);
    return NextResponse.json({ error: 'Could not join the room. Please try again.' }, { status: 500 });
  }
}
