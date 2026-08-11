import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { requireUser } from '../../../../lib/api/web-auth';
import { generateApiKey, hashKey } from '../../../../lib/api/utils';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

// Load the key only if it belongs to the current user
async function ownKey(userId, id) {
  const rows = await sql`
    SELECT * FROM api_keys WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `;
  return rows.length > 0 ? rows[0] : null;
}

// PUT /api/api-keys/[id] — actions: revoke | restore | regenerate | rename
export async function PUT(request, { params }) {
  noStore();
  try {
    const user = await requireUser();
    const key = await ownKey(user.id, params.id);
    if (!key) return NextResponse.json({ error: 'API key not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action === 'revoke') {
      await sql`UPDATE api_keys SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP WHERE id = ${key.id}`;
      return NextResponse.json({ message: 'API key revoked' });
    }

    if (action === 'restore') {
      await sql`UPDATE api_keys SET status = 'active', revoked_at = NULL WHERE id = ${key.id}`;
      return NextResponse.json({ message: 'API key restored' });
    }

    if (action === 'rename') {
      const name = String(body.name || '').trim().slice(0, 255);
      if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      await sql`UPDATE api_keys SET name = ${name} WHERE id = ${key.id}`;
      return NextResponse.json({ message: 'API key renamed', name });
    }

    if (action === 'regenerate') {
      // Revoke the old key and issue a fresh one
      await sql`UPDATE api_keys SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP WHERE id = ${key.id}`;
      const rawKey = generateApiKey();
      await sql`
        INSERT INTO api_keys (user_id, name, key_hash, key_prefix)
        VALUES (${user.id}, ${key.name}, ${hashKey(rawKey)}, ${rawKey.slice(0, 14) + '…'})
      `;
      return NextResponse.json({
        message: 'API key regenerated',
        key: rawKey,
        prefix: rawKey.slice(0, 14) + '…',
        warning: 'Store this key securely. It will not be shown again.',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[mzazi-api] key update error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/api-keys/[id] — permanently delete a key
export async function DELETE(request, { params }) {
  noStore();
  try {
    const user = await requireUser();
    const key = await ownKey(user.id, params.id);
    if (!key) return NextResponse.json({ error: 'API key not found' }, { status: 404 });

    await sql`DELETE FROM api_keys WHERE id = ${key.id}`;
    return NextResponse.json({ message: 'API key deleted' });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED' || e.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[mzazi-api] key delete error:', e.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
