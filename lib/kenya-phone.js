// ─────────────────────────────────────────────────────────────────────────────
// Kenyan phone number + M-PESA Till validation helpers
// Normalizes local formats to the international format Paystack requires:
//   0722000000  → +254722000000
//   0712345678  → +254712345678
//   254722000000→ +254722000000
//   +254722000000 → +254722000000
//   722000000   → +254722000000
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeKenyanPhone(input) {
  if (typeof input !== 'string' || !input.trim()) {
    return { ok: false, error: 'Please enter your M-PESA phone number.' };
  }

  let digits = input.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);

  if (!/^\d{9,12}$/.test(digits)) {
    return { ok: false, error: 'Please enter a valid Kenyan phone number (e.g. 0712345678).' };
  }

  // 0-prefixed local format: 07XXXXXXXX / 01XXXXXXXX
  if (digits.length === 10 && (digits.startsWith('07') || digits.startsWith('01'))) {
    return { ok: true, phone: `+254${digits.slice(1)}`, local: digits };
  }

  // 9-digit without leading zero: 7XXXXXXXX / 1XXXXXXXX
  if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) {
    return { ok: true, phone: `+254${digits}`, local: `0${digits}` };
  }

  // Full international: 2547XXXXXXXX / 2541XXXXXXXX
  if (digits.length === 12 && digits.startsWith('254')) {
    return { ok: true, phone: `+254${digits.slice(3)}`, local: `0${digits.slice(3)}` };
  }

  return { ok: false, error: 'Please enter a valid Kenyan phone number (e.g. 0712345678).' };
}

// A customer's personal M-PESA number is NOT a Till number — Tills are the
// 5–8 digit merchant numbers (e.g. 522533, 1234567).
export function isValidTillNumber(input) {
  return typeof input === 'string' && /^\d{5,8}$/.test(input.trim());
}
