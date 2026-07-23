import { NextResponse } from 'next/server';
import https from 'https';
import db from '@/lib/database';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_secret_key';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'No reference provided' }, { status: 400 });
    }

    // Verify payment with Paystack
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${reference}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    };

    const verificationResponse = await new Promise((resolve, reject) => {
      https.get(options, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      }).on('error', error => {
        reject(error);
      });
    });

    if (verificationResponse.status && verificationResponse.data.status === 'success') {
      const { metadata } = verificationResponse.data;
      
      // Generate Pterodactyl credentials
      const username = `user_${metadata.user_id}_${Date.now()}`;
      const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const panelLink = `https://panel.mzazitech.com`;
      
      const credentials = JSON.stringify({
        username,
        password,
        panel_link: panelLink,
        package: metadata.package_name
      });

      // Update order status
      db.prepare(`
        UPDATE orders 
        SET status = 'completed', pterodactyl_credentials = ? 
        WHERE reference = ?
      `).run(credentials, reference);

      // Record payment
      db.prepare(`
        INSERT INTO payments (reference, amount, status, paid_at) 
        VALUES (?, ?, 'success', datetime('now'))
      `).run(reference, verificationResponse.data.amount / 100);

      return NextResponse.json({
        status: true,
        message: 'Payment successful',
        credentials: {
          username,
          password,
          panel_link: panelLink
        }
      });
    } else {
      // Update order as failed
      db.prepare('UPDATE orders SET status = ? WHERE reference = ?')
        .run('failed', reference);

      return NextResponse.json({
        status: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
