import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    
    // Ensure wallet exists
    await sql`INSERT INTO wallet (user_id, balance) VALUES (${decoded.userId}, 0.00) ON CONFLICT (user_id) DO NOTHING`;

    const rows = await sql`SELECT balance FROM wallet WHERE user_id = ${decoded.userId}`;
    const balance = rows.length > 0 ? parseFloat(rows[0].balance) : 0;

    const txRows = await sql`
      SELECT * FROM wallet_transactions WHERE user_id = ${decoded.userId}
      ORDER BY created_at DESC LIMIT 10
    `;

    return NextResponse.json({ balance, transactions: txRows });
  } catch (error) {
    console.error('Wallet balance error:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}
