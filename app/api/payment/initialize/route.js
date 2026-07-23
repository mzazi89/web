import { NextResponse } from 'next/server';
import https from 'https';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const result = await sql`SELECT * FROM users WHERE id = ${decoded.userId}`;
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { packageName, amount, type } = await request.json();
    const reference = `MZAZI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create order
    await sql`
      INSERT INTO orders (user_id, package_name, amount, type, reference, status) 
      VALUES (${user.id}, ${packageName}, ${amount}, ${type}, ${reference}, 'pending')
    `;

    // Initialize Paystack payment
    const params = JSON.stringify({
      email: user.email,
      amount: amount * 100,
      reference: reference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/callback`,
      metadata: {
        user_id: user.id,
        package_name: packageName,
        type: type
      }
    });

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const paystackResponse = await new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(params);
      req.end();
    });

    return NextResponse.json(paystackResponse);
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
