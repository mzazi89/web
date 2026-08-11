import { NextResponse } from 'next/server';
import https from 'https';
import { neon } from '@neondatabase/serverless';
import { creditReferralCommission } from '@/lib/api/referral';

// Add this line to force dynamic rendering
export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL);
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'No reference provided' }, { status: 400 });
    }

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
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    if (verificationResponse.status && verificationResponse.data.status === 'success') {
      const { metadata } = verificationResponse.data;
      
      const username = `user_${metadata.user_id}_${Date.now()}`;
      const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const panelLink = `https://panel.mzazitech.com`;
      
      const credentials = JSON.stringify({
        username,
        password,
        panel_link: panelLink,
        package: metadata.package_name
      });

      await sql`
        UPDATE orders 
        SET status = 'completed', pterodactyl_credentials = ${credentials} 
        WHERE reference = ${reference}
      `;

      await sql`
        INSERT INTO payments (reference, amount, status, paid_at) 
        VALUES (${reference}, ${verificationResponse.data.amount / 100}, 'success', NOW())
      `;

      // Referral commission: credit KSH 20 to the referrer when the buyer completes a purchase
      const orderRow = await sql`SELECT id, user_id FROM orders WHERE reference = ${reference} LIMIT 1`;
      if (orderRow.length > 0) {
        await creditReferralCommission({
          orderId: orderRow[0].id,
          buyerUserId: orderRow[0].user_id,
          reference,
        });
      }

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
      await sql`
        UPDATE orders SET status = 'failed' WHERE reference = ${reference}
      `;

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
