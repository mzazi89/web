import { NextResponse } from 'next/server';
import https from 'https';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import db from '@/lib/database';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_secret_key';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(request) {
  try {
    // Get user from token
    const cookieStore = cookies();
    const token = cookieStore.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { packageName, amount, type } = await request.json();

    // Generate unique reference
    const reference = `MZAZI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create order in database
    const stmt = db.prepare(`
      INSERT INTO orders (user_id, package_name, amount, type, reference, status) 
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);
    stmt.run(user.id, packageName, amount, type, reference);

    // Initialize Paystack payment
    const params = JSON.stringify({
      email: user.email,
      amount: amount * 100, // Paystack expects amount in kobo/cents
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
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      });

      req.on('error', error => {
        reject(error);
      });

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
