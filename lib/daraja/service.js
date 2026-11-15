// MZAZI — Dynamic Offers service.
//
// The one place that knows how to talk to Safaricom about data bundles. Routes
// stay thin: validate, call, translate. Nothing here trusts a response it has
// not parsed, and nothing reports success that the provider did not confirm.
import { darajaConfig, normaliseOffers, offersContract } from './config.js';
import { callOffers, explain } from './client.js';
import { normalizeMpesaPhone } from '@/lib/mpesa';
import { recordLookup, createPurchase, setPurchase, getPurchase } from './store.js';

export { normalizeMpesaPhone as normaliseMsisdn };

const FAIL = (kind, message) => ({ ok: false, kind, error: message });

export async function fetchOffers(msisdnInput, userId) {
  const msisdn = normalizeMpesaPhone(msisdnInput);
  if (!msisdn) {
    return FAIL('invalid', 'Enter a Safaricom number as 07XX XXX XXX, 01XX XXX XXX or 2547XXXXXXXX.');
  }
  const contract = await offersContract();
  if (!contract.listPath) {
    return FAIL('config', 'Dynamic Offers is not configured yet: add the offers endpoint from your Daraja app definition.');
  }

  try {
    const { json, text } = await callOffers({ kind: 'list', vars: { msisdn, reference: '' } });
    const { offers, shapeKnown } = normaliseOffers(json);
    await recordLookup({ userId, msisdn, count: offers.length, ok: true }).catch(() => {});

    if (!shapeKnown) {
      return {
        ok: false,
        kind: 'contract',
        msisdn,
        error: 'Safaricom answered, but not in a shape we can read. The raw response is stored for mapping.',
        raw: text.slice(0, 600),
      };
    }
    return { ok: true, msisdn, offers, empty: offers.length === 0 };
  } catch (e) {
    await recordLookup({ userId, msisdn, count: 0, ok: false, error: e.message }).catch(() => {});
    return FAIL(e.kind || 'upstream', e.message);
  }
}

export async function buyOffer({ userId, msisdnInput, offer, reference, amount }) {
  const msisdn = normalizeMpesaPhone(msisdnInput);
  if (!msisdn) return FAIL('invalid', 'That number is not a valid Safaricom number.');
  if (!offer?.id) return FAIL('invalid', 'Choose an offer first.');

  const contract = await offersContract();
  if (!contract.buyPath) {
    return FAIL('config', 'Purchases are not configured yet: add the purchase endpoint from your Daraja app definition.');
  }

  const id = await createPurchase({
    userId, msisdn, offerRef: String(offer.id), offerName: offer.name, amount: amount ?? offer.price ?? null, reference,
  });
  // The unique reference is what makes a double click harmless.
  if (!id) return { ok: false, kind: 'duplicate', error: 'That purchase was already submitted.', reference };

  try {
    const { json, text } = await callOffers({
      kind: 'buy',
      vars: { msisdn, offer: offer.id, reference, amount: amount ?? offer.price ?? '' },
    });
    const providerRef = providerId(json) || null;
    const confirmed = providerRef && isConfirmed(json);
    const status = confirmed ? 'confirmed' : 'pending';
    await setPurchase(id, {
      status,
      providerRef,
      message: confirmed ? 'Confirmed by Safaricom' : 'Submitted — awaiting Safaricom confirmation',
    });
    return { ok: true, id, reference, status, providerRef, raw: text.slice(0, 600) };
  } catch (e) {
    await setPurchase(id, { status: e.kind === 'timeout' ? 'pending' : 'failed', message: e.message });
    return { ok: false, kind: e.kind || 'upstream', error: e.message, id, reference };
  }
}

export async function refreshStatus({ userId, purchaseId }) {
  const p = await getPurchase(purchaseId, userId);
  if (!p) return FAIL('not_found', 'No such purchase.');
  if (!p.provider_ref) return { ok: true, status: p.status, events: p.events };

  try {
    const { json } = await callOffers({
      kind: 'status',
      vars: { msisdn: p.msisdn, reference: p.reference, offer: p.offer_ref, amount: p.amount ?? '' },
    });
    const status = readStatus(json);
    if (status && status !== p.status) {
      await setPurchase(p.id, { status, message: `Provider reported ${status}` });
    }
    return { ok: true, status: status || p.status, events: (await getPurchase(p.id, userId)).events };
  } catch (e) {
    return { ok: false, kind: e.kind || 'upstream', error: e.message, status: p.status };
  }
}

// Response readers. Deliberately narrow: a field we cannot find is absent, not
// assumed — "confirmed" requires an explicit success signal from Safaricom.
function providerId(json) {
  return (
    json?.transactionId || json?.transaction_id || json?.body?.transactionId ||
    json?.data?.transactionId || json?.reference || json?.body?.reference || null
  );
}

function isConfirmed(json) {
  const code = json?.header?.responseCode ?? json?.responseCode ?? json?.statusCode;
  const text = String(json?.header?.responseMessage ?? json?.message ?? json?.status ?? '').toLowerCase();
  if (String(code) === '0' && !/fail|error|reject/.test(text)) return true;
  return /success|confirmed|completed|processed/.test(text);
}

function readStatus(json) {
  const raw = String(
    json?.status || json?.transactionStatus || json?.body?.status || json?.data?.status || json?.header?.responseMessage || '',
  ).toLowerCase();
  if (/success|confirm|complet|processed/.test(raw)) return 'confirmed';
  if (/fail|reject|declin|cancel/.test(raw)) return 'failed';
  if (/pending|process|queue|await/.test(raw)) return 'pending';
  return null;
}
