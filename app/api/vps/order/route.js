// MZAZI API — POST /api/vps/order
// Creates a VPS order and starts the Paystack payment (card redirect or
// mobile-money STK/USSD push). Mirrors the wallet-deposit charge flow exactly:
//   mpesa / airtel (phone) · mpesa_till (till number) · card (redirect).
// The buyer's phone is only used for the mobile-money prompt — credentials are
// delivered to their account after payment is confirmed.
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import {
  initializeCardTransaction,
  chargeMobileMoney,
  PROVIDERS,
  MAX_DEPOSIT_KES,
} from '@/lib/paystack';
import { normalizeKenyanPhone, isValidTillNumber } from '@/lib/kenya-phone';
import { sql } from '@/lib/wallet';
import {
  ensureVpsSchema,
  generateVpsReference,
  getVpsPackageById,
  getVpsAvailableStock,
} from '@/lib/vps';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET;

const METHODS = {
  card: { label: 'Card', provider: null, needsPhone: false, needsTill: false },
  mpesa: { label: 'M-PESA', provider: PROVIDERS.mpesa, needsPhone: true, needsTill: false },
  airtel: { label: 'Airtel Money', provider: PROVIDERS.airtel, needsPhone: true, needsTill: false },
  mpesa_till: { label: 'M-PESA Till', provider: PROVIDERS.mpesa_till, needsPhone: false, needsTill: true },
};

function friendlyChargeError(payload, method) {
  const raw = `${payload?.message || ''} ${payload?.data?.message || ''}`.toLowerCase();
  if (raw.includes('duplicate')) return 'This payment request already exists. Please try again.';
  if (raw.includes('insufficient') || raw.includes('balance')) {
    return 'Payment could not be completed. Please check your mobile money balance and try again.';
  }
  if (method === 'mpesa_till') return 'Payment request could not be sent. Please check the Till number and try again.';
  return 'Payment request could not be sent. Please check the phone number and try again.';
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const userId = decoded.userId;

    await ensureVpsSchema();

    const body = await request.json().catch(() => ({}));
    const packageId = Number(body.packageId);
    const paymentMethod = String(body.paymentMethod || '').toLowerCase();
    const rawPhone = String(body.phoneNumber || '').trim();
    const rawTill = String(body.tillNumber || '').trim();

    const pkg = await getVpsPackageById(packageId);
    if (!pkg || pkg.active !== true) {
      return NextResponse.json({ error: 'Package not found.' }, { status: 404 });
    }

    const method = METHODS[paymentMethod];
    if (!method) {
      return NextResponse.json({ error: 'Unsupported payment method.' }, { status: 400 });
    }

    const amount = Number(pkg.price);
    if (!Number.isFinite(amount) || amount < 10) {
      return NextResponse.json({ error: 'Invalid package price.' }, { status: 400 });
    }
    if (amount > MAX_DEPOSIT_KES) {
      return NextResponse.json(
        { error: `This package exceeds the KES ${MAX_DEPOSIT_KES.toLocaleString()} per-transaction mobile money limit. Use the Card method or contact support.` },
        { status: 400 }
      );
    }

    // ── Phone / Till validation (used for the mobile-money prompt only) ──
    let phone = null;
    let tillNumber = null;
    if (method.needsTill) {
      if (!isValidTillNumber(rawTill)) {
        return NextResponse.json({ error: 'Please enter a valid M-PESA Till number (5–8 digits).' }, { status: 400 });
      }
      tillNumber = rawTill.trim();
    } else if (method.needsPhone) {
      const normalized = normalizeKenyanPhone(rawPhone);
      if (!normalized.ok) return NextResponse.json({ error: normalized.error }, { status: 400 });
      phone = normalized.phone;
    }

    // ── Stock check ──
    const stock = await getVpsAvailableStock(packageId);
    if (stock < 1) {
      return NextResponse.json({ error: 'Sorry — this VPS package is sold out. Check back soon.' }, { status: 409 });
    }

    const userRows = await sql`SELECT email FROM users WHERE id = ${userId}`;
    if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const email = userRows[0].email;

    const reference = generateVpsReference(userId);

    // ── 1. Create the pending order BEFORE talking to Paystack ──
    await sql`
      INSERT INTO vps_orders (user_id, package_id, amount, phone, payment_method, reference, status)
      VALUES (${userId}, ${packageId}, ${amount}, ${phone || tillNumber || null}, ${paymentMethod}, ${reference}, 'pending')
    `;

    // ── 2. Card → official Paystack checkout (redirect, PCI-safe) ──
    if (paymentMethod === 'card') {
      const { json } = await initializeCardTransaction({
        email,
        amountKsh: amount,
        reference,
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/vps/verify`,
        userId,
      });

      if (!json || json.status !== true || !json.data?.authorization_url) {
        await sql`UPDATE vps_orders SET status = 'failed' WHERE reference = ${reference}`;
        return NextResponse.json({ error: 'Payment could not be initialized. Please try again.' }, { status: 502 });
      }

      await sql`UPDATE vps_orders SET status = 'processing' WHERE reference = ${reference}`;
      return NextResponse.json({ flow: 'redirect', authorization_url: json.data.authorization_url, reference, package: pkg.name });
    }

    // ── 3. Mobile money → Paystack Charge API (STK/USSD push, no redirect) ──
    const charge = await chargeMobileMoney({
      email,
      amountKsh: amount,
      reference,
      provider: method.provider,
      ...(tillNumber ? { tillNumber } : { phone }),
    });

    const ok = charge.json && charge.json.status === true;
    const data = charge.json?.data || {};

    if (!ok) {
      await sql`UPDATE vps_orders SET status = 'failed' WHERE reference = ${reference}`;
      return NextResponse.json({ error: friendlyChargeError(charge.json, paymentMethod) }, { status: 502 });
    }

    if (!['pay_offline', 'pending', 'success'].includes(data.status)) {
      await sql`UPDATE vps_orders SET status = 'failed' WHERE reference = ${reference}`;
      return NextResponse.json({ error: 'Payment request could not be sent. Please try again.' }, { status: 502 });
    }

    await sql`UPDATE vps_orders SET status = 'processing' WHERE reference = ${reference}`;

    return NextResponse.json({
      flow: 'mobile_money',
      reference,
      displayPhone: phone,
      displayText: data.display_text || null,
      package: pkg.name,
    });
  } catch (error) {
    console.error('VPS order error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
