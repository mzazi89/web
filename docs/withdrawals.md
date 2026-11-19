# Wallet withdrawals (M-PESA B2C)

A customer can move a wallet balance back to their phone. The rail is Daraja's
**B2C** product — a different Daraja app permission from the STK deposits in
`lib/mpesa.js`, and the only place in this product where money leaves.

## Turning it on

Either in **Admin → Settings → M-PESA payouts (B2C)** or in the environment:

| Setting | Meaning |
|---|---|
| `mpesa_b2c_shortcode` / `MPESA_B2C_SHORTCODE` | shortcode the payout is debited from (blank = deposit shortcode) |
| `mpesa_b2c_initiator` / `MPESA_B2C_INITIATOR` | initiator username on the Daraja app that has B2C enabled |
| `mpesa_b2c_security_credential` / `MPESA_B2C_SECURITY_CREDENTIAL` | initiator password encrypted with Safaricom's certificate (RSA/ECB/PKCS1), base64 |
| `MPESA_B2C_CERT` + `MPESA_B2C_INITIATOR_PASSWORD` | alternative to the above: the PEM certificate and the plain password; the code encrypts it |
| `mpesa_b2c_command` / `MPESA_B2C_COMMAND` | `BusinessPayment` (default), `SalaryPayment`, `PromotionPayment` |

The consumer key/secret and environment (`sandbox`/`production`) are shared with
deposits. `b2cReady()` needs all of the above; until then `POST /api/wallet/withdraw`
answers **503** and the UI says payouts are not enabled, so no money is ever held
for a payout that cannot be sent.

Callbacks land on:

    POST /api/mpesa/b2c/result      (success and failure)
    POST /api/mpesa/b2c/timeout     (Safaricom gave up)

Both honour `mpesa_callback_secret` as `?k=…` when it is set.

## The safety model

1. **Atomic debit.** `UPDATE wallet SET balance = balance - $amt WHERE user_id = $u
   AND balance >= $amt RETURNING …`. No row, no payout — two taps or two tabs
   cannot overdraw.
2. **One in flight.** A pending withdrawal inside 15 minutes answers `409` instead
   of starting a second payout.
3. **Refund paths.** Any failure — bad request, transport error, is transport
   error, Safaricom rejection, callback failure, timeout — moves the row
   `pending → failed` **and then** credits the wallet. The refund only happens if
   that transition matched, so a duplicate callback refunds nothing.
4. **Settlement is idempotent.** `UPDATE … WHERE id = $id AND status = 'pending'`.
   Safaricom retries callbacks; the second one finds nothing to change.
5. **The callback never decides the amount.** The ledger row holds what the
   customer asked for; the callback only moves it between states.

## States

```
pending ──settle(ResultCode=0)──▶ success   (provider_receipt = M-PESA code)
   │
   ├──settle(ResultCode≠0)─────▶ failed    + refund
   ├──timeout──────────────────▶ failed    + refund
   └──daraja error / transport──▶ failed    + refund
```

A withdrawal row is a normal `wallet_transactions` row: `type='withdrawal'`,
`provider='mpesa_b2c'`, `provider_ref` = the OriginatorConversationID we generated,
`provider_conversation_id` = Daraja's ConversationID. That means it shows in the
wallet ledger, the statement and the admin transactions list with no extra work.

## Limits

`MIN_WITHDRAW = 50`, `MAX_WITHDRAW = 150000`, no fee, **whole shillings only** —
Daraja rejects a fractional Amount, and the ledger debits exactly what will be
paid, so `100.50` is refused rather than rounded.

## Support tools

Admin → **Payouts** lists withdrawals by state. A row that is still `pending`
means the wallet is debited and Safaricom has not confirmed: paste the M-PESA
code to mark it paid, or refund it back. Both actions are guarded by
`status = 'pending'`, so two operators cannot double-refund. Nothing reverses
automatically — a late callback for a payout that did happen would otherwise pay
twice.

## Concurrency

A partial unique index (`wtx_one_pending_withdrawal`, on `user_id WHERE
type='withdrawal' AND status='pending'`) is the real guard against a
double-tapped button: the second insert fails, the money is credited back, and
the API answers **409**.
