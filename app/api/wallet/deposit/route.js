import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import {
  initializeCardTransaction,
  chargeMobileMoney,
  PROVIDERS,
  MIN_DEPOSIT_KES,
  MAX_DEPOSIT_KES,
} from '@/lib/paystack';
import { normalizeKenyanPhone, isValidTillNumber } from '@/lib/kenya-phone';
import { sql, ensureWalletSchema, ensureWallet, generateReference, markTransactionFailed, getDepositOffer, computeDepositBonus } from '@/lib/wallet';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET;

// Payment methods offered on the deposit page.
const METHODS = {
  card: { label: 'Card', provider: null, needsPhone: false, needsTill: false },
  mpesa: { label: 'M-PESA', provider: PROVIDERS.mpesa, needsPhone: true, needsTill: false },
  airtel: { label: 'Airtel Money', provider: PROVIDERS.airtel, needsPhone: true, needsTill: false },
  mpesa_till: { label: 'M-PESA Till', provider: PROVIDERS.mpesa_till, needsPhone: false, needsTill: true },
};

// Map raw Paystack error text to user-friendly messages (never leak API details).
function friendlyChargeError(payload, method) {
  const raw = `${payload?.message || ''} ${payload?.data?.message || ''}`.toLowerCase();
  if (raw.includes('duplicate')) return 'This payment request already exists. Please try again.';
  if (raw.includes('insufficient') || raw.includes('balance')) {
    return 'Payment could not be completed. Please check your mobile money balance and try again.';
  }
  if (raw.includes('phone') || raw.includes('number') || raw.includes('invalid')) {
    return 'Payment request could not be sent. Please check the phone number and try again.';
  }
  if (method === 'mpesa_till') {
    return 'Payment request could not be sent. Please check the Till number and try again.';
  }
  return 'Payment request could not be sent. Please check the phone number and try again.';
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const userId = decoded.userId;

    await ensureWalletSchema();

    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const paymentMethod = String(body.paymentMethod || '').toLowerCase();
    const rawPhone = String(body.phoneNumber || '').trim();
    const rawTill = String(body.tillNumber || '').trim();

    const method = METHODS[paymentMethod];
    if (!method) {
      return NextResponse.json({ error: 'Unsupported payment method.' }, { status: 400 });
    }

    // ── Amount validation (KES) ──
    if (!Number.isFinite(amount) || amount < MIN_DEPOSIT_KES) {
      return NextResponse.json({ error: `Minimum deposit is KES ${MIN_DEPOSIT_KES}` }, { status: 400 });
    }
    if (amount > MAX_DEPOSIT_KES) {
      return NextResponse.json(
        { error: `Maximum deposit is KES ${MAX_DEPOSIT_KES.toLocaleString()}` },
        { status: 400 }
      );
    }

    // ── Phone / Till validation ──
    let phone = null;
    let tillNumber = null;
    if (method.needsTill) {
      if (!isValidTillNumber(rawTill)) {
        return NextResponse.json(
          { error: 'Please enter a valid M-PESA Till number (5–8 digits).' },
          { status: 400 }
        );
      }
      tillNumber = rawTill.trim();
    } else if (method.needsPhone) {
      const normalized = normalizeKenyanPhone(rawPhone);
      if (!normalized.ok) {
        return NextResponse.json({ error: normalized.error }, { status: 400 });
      }
      phone = normalized.phone; // +254…
    }

    const userRows = await sql`SELECT email FROM users WHERE id = ${userId}`;
    if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const email = userRows[0].email;

    const reference = generateReference(userId);

    // ── 1. Create the pending transaction BEFORE talking to Paystack ──
    // If the deposit offer is active, STAMP the multiplier on the row so the
    // bonus matches what the user saw advertised — toggling the offer later
    // never changes an already-started deposit.
    await ensureWallet(userId);
    const offer = await getDepositOffer();
    const offerBonus = offer.enabled ? computeDepositBonus(amount, offer.multiplier) : { bonus: 0, total: amount };
    await sql`
      INSERT INTO wallet_transactions
        (user_id, type, amount, reference, description, status, currency, payment_method, phone_number, provider, bonus_multiplier)
      VALUES
        (${userId}, 'deposit', ${amount}, ${reference}, ${`Wallet top-up via ${method.label}`},
         'pending', 'KES', ${paymentMethod}, ${phone}, 'paystack', ${offer.enabled ? offer.multiplier : null})
    `;

    // ── 2. Card → official Paystack checkout (redirect, PCI-safe) ──
    if (paymentMethod === 'card') {
      const { json } = await initializeCardTransaction({
        email,
        amountKsh: amount,
        reference,
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/wallet/verify`,
        userId,
      });

      if (!json || json.status !== true || !json.data?.authorization_url) {
        await markTransactionFailed(reference, json?.message || 'Paystack initialization failed');
        return NextResponse.json({ error: 'Payment could not be initialized. Please try again.' }, { status: 502 });
      }

      await sql`UPDATE wallet_transactions SET status = 'processing', updated_at = NOW() WHERE reference = ${reference}`;
      return NextResponse.json({
        flow: 'redirect',
        authorization_url: json.data.authorization_url,
        reference,
        offer: offer.enabled ? { multiplier: offer.multiplier, bonusAmount: offerBonus.bonus, totalAmount: offerBonus.total } : null,
      });
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
      await markTransactionFailed(reference, charge.json?.message || 'Charge failed');
      return NextResponse.json({ error: friendlyChargeError(charge.json, paymentMethod) }, { status: 502 });
    }

    // A charge is started when Paystack hands it back as pay_offline (customer
    // must authorize on their phone) or pending (still processing).
    if (!['pay_offline', 'pending', 'success'].includes(data.status)) {
      await markTransactionFailed(reference, data.message || `Unexpected charge status: ${data.status}`);
      return NextResponse.json({ error: 'Payment request could not be sent. Please try again.' }, { status: 502 });
    }

    await sql`UPDATE wallet_transactions SET status = 'processing', updated_at = NOW() WHERE reference = ${reference}`;

    return NextResponse.json({
      flow: 'mobile_money',
      reference,
      displayPhone: phone,
      displayText: data.display_text || null,
      offer: offer.enabled ? { multiplier: offer.multiplier, bonusAmount: offerBonus.bonus, totalAmount: offerBonus.total } : null,
    });
  } catch (error) {
    console.error('Deposit error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
