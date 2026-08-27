import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

import {
  normalizeKenyanPhone,
  createMobileMoneyCharge,
  createTillCharge,
  initializeCardCheckout,
} from '@/lib/paystack';
import {
  generateDepositReference,
  createPendingWalletTransaction,
  markTransactionProcessing,
  markTransactionFailed,
} from '@/lib/walletPayments';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

// Supported payment methods → Paystack provider configuration (Kenya)
const METHODS = {
  card:   { label: 'Card',            needsPhone: false },
  mpesa:  { label: 'M-PESA',          provider: 'mpesa', needsPhone: true  },
  airtel: { label: 'Airtel Money',    provider: 'atl',   needsPhone: true  },
  mptill: { label: 'M-PESA Till',     provider: 'mptill', needsPhone: false },
};

// Map common Paystack charge errors to user-friendly messages.
function friendlyChargeError(paystackMessage, method) {
  const m = String(paystackMessage || '').toLowerCase();
  const network = method === 'mpesa' ? 'M-PESA' : method === 'airtel' ? 'Airtel Money' : 'M-PESA Till';
  if (m.includes('insufficient') || m.includes('low balance') || m.includes('funds')) {
    return `Your ${network} balance is too low for this payment.`;
  }
  if (m.includes('declined') || m.includes('decline')) {
    return 'The payment was declined. Please try again.';
  }
  if (m.includes('expired') || m.includes('timeout') || m.includes('timed out')) {
    return 'The payment request expired before it was approved. Please try again.';
  }
  if (m.includes('duplicate')) {
    return 'A similar payment is already being processed. Please check your phone.';
  }
  if (m.includes('invalid') && (m.includes('phone') || m.includes('number'))) {
    return 'The phone number could not be reached. Please check it and try again.';
  }
  return `Payment request could not be sent. Please check the ${method === 'mptill' ? 'till number' : 'phone number'} and try again.`;
}

function validateTill(raw) {
  const till = String(raw || '').replace(/[^\d]/g, '');
  return /^\d{5,7}$/.test(till) ? till : null; // M-PESA tills are 5–7 digits
}

export async function POST(request) {
  let userId;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = jwt.verify(token.value, JWT_SECRET);
    userId = decoded.userId;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const amount = Number(body.amount);
    const method = String(body.method || '').toLowerCase();

    // ── Validation ──────────────────────────────────────────────────────────
    if (!Number.isFinite(amount) || amount < 10) {
      return NextResponse.json({ error: 'Minimum deposit is KES 10' }, { status: 400 });
    }
    if (!METHODS[method]) {
      return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 });
    }

    let phone = null;
    let till = null;
    if (method === 'mpesa' || method === 'airtel') {
      phone = normalizeKenyanPhone(body.phone);
      if (!phone) {
        return NextResponse.json(
          { error: 'Enter a valid Kenyan phone number, e.g. 0712345678.' },
          { status: 400 }
        );
      }
    }
    if (method === 'mptill') {
      till = validateTill(body.till);
      if (!till) {
        return NextResponse.json(
          { error: 'Enter a valid M-PESA Till number (5–7 digits), e.g. 522533.' },
          { status: 400 }
        );
      }
    }

    const userRows = await sql`SELECT email FROM users WHERE id = ${userId}`;
    if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const email = userRows[0].email;

    // ── Create pending transaction (unique reference = idempotency anchor) ──
    let reference = generateDepositReference(userId);
    const metadata = { user_id: userId, type: 'wallet_deposit', amount_ksh: amount, payment_method: method };
    let tx = await createPendingWalletTransaction({
      userId,
      amount,
      reference,
      paymentMethod: method,
      phoneNumber: phone,
      description: method === 'mptill' ? `Wallet top-up via M-PESA Till ${till}` : 'Wallet top-up via Paystack',
    });
    if (!tx) {
      // Astronomically unlikely collision — retry once with a fresh reference.
      reference = generateDepositReference(userId);
      tx = await createPendingWalletTransaction({
        userId,
        amount,
        reference,
        paymentMethod: method,
        phoneNumber: phone,
        description: method === 'mptill' ? `Wallet top-up via M-PESA Till ${till}` : 'Wallet top-up via Paystack',
      });
    }
    if (!tx) {
      return NextResponse.json({ error: 'Could not create transaction. Please try again.' }, { status: 409 });
    }

    // ── Card: official Paystack checkout (redirect — PCI-safe) ──────────────
    if (method === 'card') {
      const pay = await initializeCardCheckout({
        email,
        amountKes: amount,
        reference,
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/wallet/verify`,
        metadata,
      });
      if (pay.status !== true || !pay.data?.authorization_url) {
        await markTransactionFailed(reference);
        console.error('Paystack card init failed:', pay.message);
        return NextResponse.json({ error: 'Payment could not be started. Please try again.' }, { status: 502 });
      }
      await markTransactionProcessing(reference, pay.data.id);
      return NextResponse.json({ type: 'redirect', reference, authorization_url: pay.data.authorization_url });
    }

    // ── Mobile money: Paystack Charge API (prompt sent to the phone) ────────
    const pay = method === 'mptill'
      ? await createTillCharge({ email, amountKes: amount, account: till, reference, metadata })
      : await createMobileMoneyCharge({ email, amountKes: amount, provider: METHODS[method].provider, phone, reference, metadata });

    if (pay.status !== true || !pay.data?.reference) {
      await markTransactionFailed(reference, pay.message || 'charge_init_failed');
      console.error(`Paystack ${method} charge failed:`, pay.message);
      return NextResponse.json({ error: friendlyChargeError(pay.message, method) }, { status: 502 });
    }

    // pay_offline → Paystack sent the authorization prompt to the phone.
    await markTransactionProcessing(reference, pay.data.id);

    return NextResponse.json({
      type: 'charge',
      reference,
      status: pay.data.status,      // 'pay_offline'
      display_text: pay.data.display_text || 'Please complete authorization on your phone',
    });
  } catch (error) {
    console.error('Deposit error:', error);
    return NextResponse.json({ error: 'Failed to initialize deposit' }, { status: 500 });
  }
}
