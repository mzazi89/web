import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import https from 'https';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const { amount } = await request.json();

    if (!amount || amount < 10) {
      return NextResponse.json({ error: 'Minimum deposit is KSH 10' }, { status: 400 });
    }

    const userRows = await sql`SELECT email FROM users WHERE id = ${decoded.userId}`;
    if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const reference = `WALLET-${decoded.userId}-${Date.now()}`;

    // Initialize Paystack transaction
    const params = JSON.stringify({
      email: userRows[0].email,
      amount: Math.round(amount * 100), // Paystack uses kobo/cents
      currency: 'KES',
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/wallet/verify`,
      metadata: {
        user_id: decoded.userId,
        type: 'wallet_deposit',
        amount_ksh: amount,
      },
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const paystackResponse = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(params);
      req.end();
    });

    if (!paystackResponse.status) {
      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
    }

    // Record pending transaction
    await sql`
      INSERT INTO wallet_transactions (user_id, type, amount, reference, description, status)
      VALUES (${decoded.userId}, 'deposit', ${amount}, ${reference}, 'Wallet top-up via Paystack', 'pending')
    `;

    return NextResponse.json({
      authorization_url: paystackResponse.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error('Deposit error:', error);
    return NextResponse.json({ error: 'Failed to initialize deposit' }, { status: 500 });
  }
}
