import { NextResponse } from 'next/server';
import { initializeDatabase } from '../../../lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('DB init error:', error);
    return NextResponse.json({ error: 'Database initialization failed', details: error.message }, { status: 500 });
  }
}
