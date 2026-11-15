# Safaricom Dynamic Offers — integration notes

## What the public documentation actually contains

Daraja's public catalogue (developer.safaricom.co.ke/apis) lists:

Authorization · Dynamic QR · M-Pesa Express (STK Push + Query) · Customer To
Business · Business To Customer · Transaction Status · Account Balance ·
Reversals · Tax Remittance · Business Pay Bill · Business Buy Goods ·
Bill Manager · B2B Express Checkout · Pull Transactions · Getting Started.

**Dynamic Offers is not in that list.** It is a subscribed product on Safaricom's
WSO2 gateway: `GET https://sandbox.safaricom.co.ke/v1/dynamic-offers/` answers
`401 Unauthorised-Invalid Access Token` with `x-cdn: Imperva`, i.e. the route
exists but is gated per app.

Consequence, stated plainly: **the path suffixes, request bodies and response
fields cannot be established from public documentation.** They must be copied
from the API definition shown in the Daraja portal for the app that was granted
the product. This codebase never invents them; it treats them as configuration
and reports the gateway's own error when they are missing or wrong.

## What is implemented

| Concern | Where |
| --- | --- |
| OAuth, token cache, one retry on an expired token | `lib/daraja/client.js` |
| Contract (paths/bodies/marker), response normalisation | `lib/daraja/config.js` |
| Lookup, purchase, status service | `lib/daraja/service.js` |
| Tables: lookups, purchases, events, API logs | `lib/daraja/store.js` |
| Routes | `app/api/data/offers`, `purchase`, `purchase/[id]`, `history` |
| Page | `app/data/page.js` |
| Tests | `node scripts/test-dynamic-offers.mjs` |

Guarantees:

- Credentials never leave the server; no `NEXT_PUBLIC_` variable holds a secret.
- A response is parsed before it is trusted; an unrecognised shape is reported,
  not guessed.
- `confirmed` requires an explicit success signal. A submitted purchase stays
  `pending` until Safaricom says otherwise.
- Duplicate submission is impossible: the reference is generated server-side and
  `offer_purchases.reference` is unique; a colliding insert returns no row.
- Timeouts abort at `OFFERS timeout` (default 9s) and surface as `504`.

## Configuration

Either environment variables (see `.env.example`) or Admin → Settings → Data
bundles (Dynamic Offers). Settings win; environment is the fallback.

```
DARAJA_ENV=sandbox
DARAJA_CONSUMER_KEY=
DARAJA_CONSUMER_SECRET=
OFFERS_LIST_PATH=…        # suffix after /v1/dynamic-offers/
OFFERS_LIST_BODY=…        # {{msisdn}}
OFFERS_BUY_PATH=…
OFFERS_BUY_BODY=…         # {{msisdn}} {{offer}} {{reference}} {{amount}}
OFFERS_STATUS_PATH=…
OFFERS_STATUS_BODY=…      # {{reference}}
OFFERS_METHOD=POST
OFFERS_OK=                # optional success substring
```

## Permissions required

1. A Daraja app (sandbox and production are separate apps with separate keys).
2. **Dynamic Offers** added to that app's subscriptions and approved by Safaricom.
3. OAuth scope issued for the product (the gateway rejects calls with
   `403` / `Unauthorised` until the subscription exists).
4. For production: the app must be taken through **Go Live**; sandbox credentials
   return `401` against `api.safaricom.co.ke`.

## Test matrix

Automated (`scripts/test-dynamic-offers.mjs`, 8/8 passing): number formats,
template filling, three documented response shapes, unknown shape, entries
without ids, error classification, Safaricom wording, timeout abort.

Manual, once the contract is entered:

| Case | Expected |
| --- | --- |
| Valid number, offers exist | cards render name/size/price/validity exactly as returned |
| Valid number, no offers | empty state, no fabricated bundles |
| `07…`, `01…`, `254…` | identical results (normalised) |
| Invalid number | 400 with a specific message |
| Wrong credentials | `502` + "Daraja rejected the credentials" |
| App not subscribed | `502` + permission message, raw body shown |
| Endpoint missing | `503` + which path to paste |
| Gateway slow | `504` "did not answer in time" |
| Purchase accepted | status `pending` until status call confirms |
| Double click | second call `409`, one row |
| Status refresh | transitions recorded in `purchase_events` |

## Deployment

1. Set the variables above in Vercel (or the admin settings page).
2. Deploy `web` as usual — no migrations to run manually; every table is created
   on first use with `CREATE TABLE IF NOT EXISTS`.
3. Enter the contract values, then call `/data` with a real number.

## Known gap

`data_plans`, `/api/data/plans` and `/api/data/order` remain from an earlier
wallet-funded catalogue. The new flow does not use them; they are left in place
because they are referenced by the admin "Data bundles" screen and deleting them
would remove a screen that still works. They can be retired once the dynamic
flow is confirmed live.
