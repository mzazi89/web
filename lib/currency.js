// MZAZI currency — Kenyan Shillings (KES)
//
// Everything a customer is charged is stored and settled in KES. Two things sit
// on top of that number, in one place so display and charge can never disagree:
//
//   * a flat platform fee of USD 0.30, converted at a fixed rate
//   * the USD → KES rate used whenever a provider quotes in dollars (5SIM does)
//
// The rate is a constant, not a live feed on purpose: a price that moves between
// the product page and the checkout is a support ticket and a refund.

export const USD_FEE = Number(process.env.PLATFORM_FEE_USD || 0.3);
export const KES_PER_USD = Number(process.env.KES_PER_USD || 130);

/** The fee in shillings, rounded to the shilling — nobody is charged 0.004. */
export function platformFeeKes() {
  return Math.round(USD_FEE * KES_PER_USD);
}

/** A stored price plus the fee. Use for every sale, never for a wallet balance. */
export function salePrice(baseKes) {
  return Math.round((Number(baseKes) || 0) + platformFeeKes());
}

/** A provider price quoted in USD, landed in KES with the fee applied. */
export function fromUsd(usd) {
  return Math.round((Number(usd) || 0) * KES_PER_USD) + platformFeeKes();
}

export function fmtKes(value, digits = 2) {
  const n = Number((parseFloat(value) || 0).toFixed(digits));
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Convenience: `fmtSale(dbPrice)` renders the price a customer actually pays. */
export function fmtSale(baseKes) {
  return fmtKes(salePrice(baseKes));
}
