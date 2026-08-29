import { NextResponse } from 'next/server';
import { initializeDatabase } from '../../../lib/database';

export const dynamic = 'force-dynamic';

// /api/init-db is a schema-bootstrap endpoint — it must never be callable by
// the public. Guard it with INIT_DB_KEY (send `x-init-key: <key>`), fail
// closed in production when no key is configured, and only allow open access
// in local development.
function authorized(request) {
  const key = process.env.INIT_DB_KEY;
  if (!key) return process.env.NODE_ENV !== 'production';
  const header =
    request.headers.get('x-init-key') ||
    (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') ||
    '';
  return header === key;
}

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await initializeDatabase();
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('DB init error:', error);
    return NextResponse.json({ error: 'Database initialization failed' }, { status: 500 });
  }
}
