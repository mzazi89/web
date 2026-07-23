import { NextResponse } from 'next/server';
import { initializeDatabase } from '../../../lib/database';

export const dynamic = 'force-dynamic';

let isInitialized = false;

export async function GET() {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      isInitialized = true;
      return NextResponse.json({ 
        success: true,
        message: 'Database initialized successfully' 
      });
    } catch (error) {
      console.error('Init error:', error);
      return NextResponse.json({ 
        success: false,
        error: error.message 
      }, { status: 500 });
    }
  }
  
  return NextResponse.json({ 
    success: true,
    message: 'Database already initialized' 
  });
}
