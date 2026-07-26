import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const { code } = await request.json();

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a voucher code' }, { status: 400 });
    }

    const upperCode = code.trim().toUpperCase();

    // Find the voucher
    const [voucher] = await sql`
      SELECT * FROM voucher_codes WHERE code = ${upperCode}
    `;

    if (!voucher) {
      return NextResponse.json({ error: 'Invalid voucher code' }, { status: 404 });
    }
    if (voucher.status === 'used') {
      return NextResponse.json({ error: 'This voucher has already been used' }, { status: 400 });
    }
    if (voucher.status !== 'active') {
      return NextResponse.json({ error: 'This voucher is not active' }, { status: 400 });
    }

    const amount = parseFloat(voucher.amount);

    // Mark as used
    await sql`
      UPDATE voucher_codes
      SET status = 'used', used_by = ${decoded.userId}, used_at = CURRENT_TIMESTAMP
      WHERE id = ${voucher.id} AND status = 'active'
    `;

    // Credit wallet (upsert)
    await sql`
      INSERT INTO wallet (user_id, balance, updated_at)
      VALUES (${decoded.userId}, ${amount}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET balance = wallet.balance + ${amount}, updated_at = CURRENT_TIMESTAMP
    `;

    // Record transaction
    await sql`
      INSERT INTO wallet_transactions (user_id, type, amount, reference, description, status)
      VALUES (
        ${decoded.userId},
        'deposit',
        ${amount},
        ${'VOUCHER-' + upperCode},
        ${'Voucher top-up — code ' + upperCode},
        'success'
      )
    `;

    // Return new balance
    const [wallet] = await sql`SELECT balance FROM wallet WHERE user_id = ${decoded.userId}`;

    return NextResponse.json({
      message: `KSH ${amount.toLocaleString()} has been credited to your wallet!`,
      amount,
      newBalance: parseFloat(wallet.balance),
    });
  } catch (error) {
    console.error('Redeem voucher error:', error);
    return NextResponse.json({ error: 'Failed to redeem voucher' }, { status: 500 });
  }
}
