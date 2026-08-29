import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createState, redact, COLORS, COLOR_NAMES } from '@/lib/ludo/engine';
import { saveGame, newId, newRoomCode, newToken, maybeCleanup } from '@/lib/ludo/store';

export const dynamic = 'force-dynamic';

function clean(s, max = 20) {
  return String(s || '').replace(/[<>&"']/g, '').trim().slice(0, max) || 'Player';
}

// POST /api/ludo/create
// { name, seats: 2-4, mode: 'local'|'online', aiFill: bool }
// Creates a game. seat 0 = the creator. In online mode empty human seats can
// be joined by room code. Returns the creator's seat + player token (and all
// human tokens in local mode).
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const seats = Math.min(4, Math.max(2, parseInt(body.seats, 10) || 4));
    const mode = body.mode === 'local' ? 'local' : 'online';
    const aiFill = !!body.aiFill;

    const creatorName = clean(body.name);
    const players = [];
    const humanTokens = {};
    const tokensBySeat = {};

    for (let s = 0; s < seats; s++) {
      if (s === 0) {
        const token = newToken();
        tokensBySeat[0] = token;
        players.push({ seat: 0, name: creatorName, color: COLORS[0], type: 'human' });
      } else if (mode === 'local' || aiFill) {
        if (mode === 'local') {
          const token = newToken();
          tokensBySeat[s] = token;
          players.push({ seat: s, name: `Player ${s + 1}`, color: COLORS[s], type: 'human' });
        } else {
          players.push({ seat: s, name: `AI ${COLOR_NAMES[s]}`, color: COLORS[s], type: 'ai' });
        }
      } else {
        players.push({ seat: s, name: `Player ${s + 1}`, color: COLORS[s], type: 'human' }); // open slot (joined later)
      }
    }

    // Attach tokens to human players in the state
    for (const p of players) {
      if (p.type === 'human' && tokensBySeat[p.seat]) p.token = tokensBySeat[p.seat];
      if (mode === 'local' && p.type === 'human') humanTokens[p.seat] = tokensBySeat[p.seat];
    }

    const state = createState({ id: newId(), roomCode: newRoomCode(), mode, players });

    // Local games start immediately; online games wait in the lobby
    if (mode === 'local') {
      state.status = 'playing';
      state.phase = 'roll';
    }

    await saveGame(state);
    await maybeCleanup();

    return NextResponse.json({
      gameId: state.id,
      roomCode: state.roomCode,
      mode,
      seat: 0,
      playerToken: tokensBySeat[0],
      localTokens: mode === 'local' ? humanTokens : undefined,
      state: redact(state, 0, tokensBySeat[0]),
    });
  } catch (e) {
    console.error('Ludo create error:', e.message);
    return NextResponse.json({ error: 'Could not create the game. Please try again.' }, { status: 500 });
  }
}
