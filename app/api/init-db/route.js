import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';

let isInitialized = false;

export async function GET() {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      isInitialized = true;
      return NextResponse.json({ message: 'Database initialized successfully' });
    } catch (error) {
      return NextResponse.json({ error: 'Database initialization failed' }, { status: 500 });
    }
  }
  
  return NextResponse.json({ message: 'Database already initialized' });
}
