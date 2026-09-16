// MZAZI API — telling a provider's ANSWER apart from its FAILURE NOTICE.
//
// Why this exists: a provider that has run out of quota does not necessarily
// answer with an error status. Pollinations replies HTTP 200 with a perfectly
// well-formed chat completion whose content IS the billing notice — verified
// live, with usage.total_tokens = 0 and user_tier "anonymous". The /api/ai/chat
// route races several sources and takes the first truthy answer, so that notice
// won the race and was relayed to users as the assistant's reply: people asking
// the bot a question got an invoice notice and a link to raise a key budget.
//
// Kept in its own dependency-free module so the patterns can be exercised
// directly against real provider output, instead of being trusted.

'use strict';

// Deliberately NARROW. A loose /rate ?limit|invalid key/ match would also fire on
// a legitimate reply to "why is my API key invalid?" — the assistant would then
// look broken for exactly the questions it exists to answer. So these match
// unmistakable billing/quota wording only, never topic words.
const FAILURE_TEXT = [
  /reached its budget/i,
  /raise the key budget/i,
  /agent_key_budget/i,
  /edit-key\?id=/i,
  /topping up the wallet does not raise/i,
  /insufficient[_ ]quota/i,
  /exceeded your current quota/i,
  /\bquota exceeded\b/i,
  /billing (?:hard )?limit/i,
  // The conditional-comment marker cloudflare-style error pages open with,
  // unanchored: it is what Pollinations returned when given a model it does not
  // serve. Cannot occur in a legitimate support answer.
  /<!--\[if\s+lt\s+ie/i,
];

// Error ENVELOPES: an HTML error page, or a JSON object whose first key is an
// error field. A real answer does not begin like either.
const FAILURE_ENVELOPE =
  /^\s*(?:<!doctype html|<!--?\[if|<html\b|<\?xml|\{\s*"(?:error|errorMessage|detail)"\s*:)/i;

/**
 * True when `text` is a provider failure notice rather than an answer.
 * Empty/blank input also counts as a failure: there is nothing to show.
 *
 * @param {unknown} text
 * @returns {boolean}
 */
function isProviderFailure(text) {
  if (typeof text !== 'string') return false;
  const s = text.trim();
  if (!s) return true;
  if (FAILURE_ENVELOPE.test(s)) return true;
  return FAILURE_TEXT.some((re) => re.test(s));
}

module.exports = { isProviderFailure, FAILURE_TEXT, FAILURE_ENVELOPE };
