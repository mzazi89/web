// MZAZI API — GET /api/wallet/receipt/[id]
//
// One receipt, one design, for every place that offers one: the dashboard ledger
// and the wallet page both link straight here, so a customer's receipt cannot
// depend on which screen they pressed.
//
// Returns HTML, not a PDF: the browser's own "Save as PDF" produces a vector file
// with the site's fonts, and a PDF engine for a single document would be a
// dependency the rest of the app does not need.
//
// Self-contained on purpose — the logo is inlined as a data URI, so the page
// prints identically on a plane, from a saved copy, or through WhatsApp's
// in-app browser, none of which will fetch a remote image mid-print.
//
// Ownership is enforced in SQL (`user_id = viewer.id`): a guessed id from
// another account is a 404, never a receipt with someone else's name on it.

import { NextResponse } from 'next/server';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { getViewer } from '@/lib/dashboard/session';
import { money } from '@/lib/dashboard/data';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const when = (d) =>
  d ? new Date(d).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// The logo is 72 KB on disk and read once per process; base64 makes the document
// standalone, which matters because a receipt is often printed from a phone.
let logoCache = null;
function logo() {
  if (logoCache !== null) return logoCache;
  try {
    const file = path.join(process.cwd(), 'public', 'brand', 'logo.png');
    logoCache = `data:image/png;base64,${readFileSync(file).toString('base64')}`;
  } catch {
    logoCache = ''; // header falls back to the wordmark; never blocks the receipt
  }
  return logoCache;
}

export async function GET(request, { params }) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await sql`
    SELECT id, type, amount, bonus_amount, status, description, payment_method,
           reference, created_at, paid_at, failure_reason, provider
    FROM wallet_transactions
    WHERE id = ${id} AND user_id = ${viewer.id}
    LIMIT 1
  `;
  const t = rows[0];
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Balance at the moment of this entry: a running total over the customer's own
  // ledger, ordered the same way the dashboard orders it. A single row therefore
  // carries the same "balance after" figure the wallet page shows, without the
  // receipt having to know the account's present balance.
  const balRows = await sql`
    WITH ordered AS (
      SELECT id,
             SUM(CASE WHEN type = 'debit' THEN -(amount + COALESCE(bonus_amount, 0))
                      ELSE (amount + COALESCE(bonus_amount, 0)) END)
               OVER (ORDER BY created_at, id) AS balance
      FROM wallet_transactions
      WHERE user_id = ${viewer.id}
    )
    SELECT balance FROM ordered WHERE id = ${id}
  `;
  const balanceAfter = balRows[0]?.balance != null ? Number(balRows[0].balance) : null;

  const status = String(t.status || '').toLowerCase();
  const settled = ['success', 'done', 'completed'].includes(status);
  const failed = ['failed', 'abandoned', 'cancelled'].includes(status);
  const isDebit = String(t.type).toLowerCase() === 'debit';
  const amount = Number(t.amount || 0);
  const bonus = Number(t.bonus_amount || 0);
  const total = amount + bonus;
  const name = [viewer.firstname, viewer.lastname].filter(Boolean).join(' ') || viewer.email;
  const number = `MZ-${String(t.id).padStart(6, '0')}`;
  const method = String(t.payment_method || t.provider || 'wallet').toUpperCase();
  const stamp = failed ? 'UNPAID' : settled ? 'PAID' : 'PENDING';
  const stampClass = failed ? 'is-bad' : settled ? 'is-ok' : 'is-wait';

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Receipt ${number} · MZAZI TECH</title>
<style>
  @page { size: A4; margin: 12mm; }
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    color-scheme: light;
    --ink: #0a1020;
    --ink-2: #4a5670;
    --dim: #7b879e;
    --line: #e4e9f2;
    --brand: #2e6bff;
    --cyan: #22d3ee;
    --dark: #05070c;
    --good: #067a52;
    --bad: #b3143c;
    --wait: #9a5b00;
  }
  html, body { margin: 0; }
  body {
    background:
      radial-gradient(1100px 420px at 12% -10%, rgba(46,107,255,.16), transparent 60%),
      radial-gradient(900px 400px at 92% 0%, rgba(34,211,238,.12), transparent 60%),
      #eef1f7;
    padding: 28px 16px 56px;
    font: 13px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
    color: var(--ink);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .sheet {
    position: relative;
    max-width: 780px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 24px 60px -28px rgba(9,17,38,.42), 0 2px 6px rgba(9,17,38,.06);
  }

  /* ── header ─────────────────────────────────────────────────────────────── */
  .head {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    padding: 26px 30px 24px;
    background:
      radial-gradient(620px 200px at 8% -40%, rgba(46,107,255,.55), transparent 70%),
      radial-gradient(520px 220px at 96% 130%, rgba(34,211,238,.35), transparent 70%),
      linear-gradient(140deg, #05070c 0%, #0a1226 58%, #05070c 100%);
    color: #f2f6ff;
  }
  .head::after {
    content: "";
    position: absolute; left: 0; right: 0; bottom: 0; height: 3px;
    background: linear-gradient(90deg, var(--brand), var(--cyan) 55%, #7c5cff);
  }
  .who { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .mark {
    width: 58px; height: 58px; flex: 0 0 58px;
    border-radius: 15px;
    background: #05070c;
    border: 1px solid rgba(120,160,255,.35);
    box-shadow: 0 0 0 4px rgba(46,107,255,.10), 0 10px 26px -14px rgba(46,107,255,.9);
    overflow: hidden;
    display: grid; place-items: center;
  }
  .mark img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .co-name { font-size: 19px; font-weight: 800; letter-spacing: -.02em; line-height: 1.15; }
  .co-name em { font-style: normal; color: var(--cyan); }
  .co-tag {
    display: block; margin-top: 4px;
    font-size: 9.5px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase;
    color: #9fb2d4;
  }
  .doc { text-align: right; flex: 0 0 auto; }
  .doc-label {
    font-size: 9.5px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase;
    color: #8ea3c7;
  }
  .doc-no {
    display: block; margin-top: 3px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 15px; font-weight: 600; letter-spacing: .02em;
  }
  .stamp {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 10px; padding: 4px 11px;
    border-radius: 999px;
    font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
    border: 1px solid currentColor;
  }
  .stamp::before {
    content: ""; width: 6px; height: 6px; border-radius: 50%;
    background: currentColor; box-shadow: 0 0 8px currentColor;
  }
  .is-ok { color: #5ef2b0; }
  .is-bad { color: #ff8aa6; }
  .is-wait { color: #ffd166; }

  /* ── body ───────────────────────────────────────────────────────────────── */
  .body { padding: 26px 30px 6px; }

  .grid { display: flex; gap: 18px; align-items: stretch; flex-wrap: wrap; }
  .col-to { flex: 1 1 260px; min-width: 220px; }
  .col-amt { flex: 0 0 300px; max-width: 100%; }

  .kicker {
    font-size: 9.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
    color: var(--dim); margin: 0 0 6px;
  }
  .to-name { font-size: 15.5px; font-weight: 700; letter-spacing: -.01em; }
  .to-mail { color: var(--ink-2); word-break: break-word; }

  .due {
    border-radius: 14px; padding: 16px 18px;
    background: linear-gradient(160deg, #f6f9ff, #eef3ff);
    border: 1px solid #dbe5fa;
  }
  .due-label {
    font-size: 9.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
    color: #5a6b8c;
  }
  .due-amt {
    margin-top: 4px;
    font-size: 30px; font-weight: 800; letter-spacing: -.03em; line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  .due-amt small { font-size: 13px; font-weight: 700; letter-spacing: .02em; color: var(--ink-2); }
  .due-sub { margin-top: 5px; font-size: 11.5px; color: #5a6b8c; }

  .meta {
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1px; margin: 22px 0 4px;
    background: var(--line); border: 1px solid var(--line); border-radius: 12px; overflow: hidden;
  }
  .meta div { background: #fff; padding: 11px 14px; min-width: 0; }
  .meta dt {
    font-size: 9px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase;
    color: var(--dim); margin: 0 0 3px;
  }
  .meta dd { margin: 0; font-size: 12.5px; font-weight: 600; word-break: break-word; }

  table.items { width: 100%; border-collapse: collapse; margin: 20px 0 0; }
  table.items th {
    text-align: left; padding: 0 0 9px;
    font-size: 9px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase;
    color: var(--dim); border-bottom: 1px solid var(--line);
  }
  table.items th:last-child, table.items td:last-child { text-align: right; }
  table.items td { padding: 12px 0; border-bottom: 1px solid #f1f4fa; vertical-align: top; }
  .item-desc { font-weight: 650; }
  .item-note { display: block; margin-top: 2px; color: var(--ink-2); font-size: 11.5px; }
  .num { font-variant-numeric: tabular-nums; font-weight: 650; }

  .sum { margin-left: auto; width: 320px; max-width: 100%; padding: 6px 0 0; }
  .sum .line { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; font-size: 12.5px; color: var(--ink-2); }
  .sum .line b { color: var(--ink); font-variant-numeric: tabular-nums; }
  .sum .grand {
    margin-top: 8px; padding: 13px 15px; border-radius: 12px;
    display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
    background: var(--dark); color: #eaf1ff;
  }
  .sum .grand span { font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #9fb2d4; }
  .sum .grand b { font-size: 19px; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }

  .note {
    margin: 20px 0 0; padding: 13px 15px;
    border-radius: 12px; border: 1px solid #dbe5fa; border-left: 3px solid var(--brand);
    background: #f7faff; color: #2b3a55; font-size: 11.5px; line-height: 1.6;
  }
  .note b { display: block; color: var(--ink); font-size: 11px; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 3px; }

  /* ── footer ─────────────────────────────────────────────────────────────── */
  .foot {
    margin-top: 26px; padding: 18px 30px 22px;
    border-top: 1px solid var(--line);
    background: #fbfcfe;
    display: flex; justify-content: space-between; gap: 18px; flex-wrap: wrap;
    color: var(--ink-2); font-size: 11px;
  }
  .foot .col { min-width: 200px; }
  .foot strong { color: var(--ink); }
  .foot a { color: var(--brand); text-decoration: none; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10.5px; color: var(--dim); }

  .actions { max-width: 780px; margin: 14px auto 0; display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
  .btn {
    font: inherit; font-weight: 700; font-size: 12.5px;
    padding: 10px 18px; border-radius: 999px; cursor: pointer;
    border: 1px solid var(--dark); background: var(--dark); color: #fff;
    box-shadow: 0 10px 24px -14px rgba(5,7,12,.9);
  }
  .btn.ghost { background: #fff; color: var(--ink); border-color: var(--line); box-shadow: none; }

  /* ── print ──────────────────────────────────────────────────────────────── */
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { border: 0; border-radius: 0; box-shadow: none; max-width: none; }
    .actions { display: none !important; }
    .head { border-radius: 0; }
    table.items tr, .sum { break-inside: avoid; }
  }
  @media (max-width: 560px) {
    .head { padding: 20px 18px; flex-wrap: wrap; }
    .doc { text-align: left; }
    .body { padding: 20px 18px 4px; }
    .col-amt { flex: 1 1 100%; }
    .meta { grid-template-columns: 1fr 1fr; }
    .foot { padding: 16px 18px 20px; }
  }
</style></head>
<body>
  <div class="sheet">
    <header class="head">
      <div class="who">
        <span class="mark">${logo() ? `<img src="${logo()}" alt="MZAZI TECH" />` : ''}</span>
        <span>
          <span class="co-name">MZAZI <em>TECH</em></span>
          <span class="co-tag">Innovate · Build · Grow</span>
        </span>
      </div>
      <div class="doc">
        <span class="doc-label">Official receipt</span>
        <span class="doc-no">${number}</span>
        <span class="stamp ${stampClass}">${stamp}</span>
      </div>
    </header>

    <div class="body">
      <div class="grid">
        <div class="col-to">
          <p class="kicker">Billed to</p>
          <p class="to-name">${esc(name)}</p>
          <p class="to-mail">${esc(viewer.email)}</p>
          <p class="mono" style="margin-top:6px">Account #${String(viewer.id).padStart(5, '0')}</p>
        </div>
        <div class="col-amt">
          <div class="due">
            <div class="due-label">${isDebit ? 'Amount charged' : 'Amount credited'}</div>
            <div class="due-amt"><small>KES</small> ${isDebit ? '−' : '+'}${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div class="due-sub">${settled ? 'Settled and posted to your ledger' : failed ? 'This charge did not go through' : 'Awaiting confirmation from the provider'}${bonus > 0 ? ` · includes ${money(bonus)} bonus` : ''}</div>
          </div>
        </div>
      </div>

      <dl class="meta">
        <div><dt>Issued</dt><dd>${esc(when(t.paid_at || t.created_at))}</dd></div>
        <div><dt>Method</dt><dd>${esc(method)}</dd></div>
        <div><dt>Type</dt><dd style="text-transform:capitalize">${esc(t.type)}</dd></div>
      </dl>

      <table class="items">
        <thead><tr><th>Description</th><th style="width:70px">Qty</th><th style="width:130px">Amount</th></tr></thead>
        <tbody>
          <tr>
            <td>
              <span class="item-desc">${esc(t.description || 'Wallet transaction')}</span>
              ${t.reference ? `<span class="item-note">Reference ${esc(t.reference)}</span>` : ''}
            </td>
            <td class="num">1</td>
            <td class="num">${money(amount)}</td>
          </tr>
          ${bonus > 0 ? `<tr><td><span class="item-desc">Bonus credit</span><span class="item-note">Promotional top-up</span></td><td class="num">1</td><td class="num">${money(bonus)}</td></tr>` : ''}
        </tbody>
      </table>

      <div class="sum">
        <div class="line"><span>Subtotal</span><b>${money(amount)}</b></div>
        ${bonus > 0 ? `<div class="line"><span>Bonus</span><b>${money(bonus)}</b></div>` : ''}
        <div class="line"><span>${isDebit ? 'Total charged' : 'Total credited'}</span><b>${money(total)}</b></div>
        ${balanceAfter !== null ? `<div class="line"><span>Wallet balance after</span><b>${money(balanceAfter)}</b></div>` : ''}
        <div class="grand"><span>${settled ? 'Paid' : failed ? 'Not paid' : 'Pending'}</span><b>${money(total)}</b></div>
      </div>

      ${t.failure_reason ? `<div class="note"><b>Why it did not settle</b>${esc(t.failure_reason)}</div>` : ''}
      <div class="note">
        <b>Panel warranty</b>
        Every Pterodactyl panel sold carries a <strong>2-week replacement warranty</strong> from the date of purchase.
        Message support inside that window and the panel is replaced free of charge. Wallet top-ups are credited
        instantly and are not refundable once spent on a service.
      </div>
    </div>

    <footer class="foot">
      <div class="col">
        <strong>MZAZI TECH INC</strong><br />
        Nairobi, Kenya · <a href="https://www.mzazi.shop">mzazi.shop</a><br />
        <a href="mailto:mzazitechinc@gmail.com">mzazitechinc@gmail.com</a> · +254 741 388 986
      </div>
      <div class="col" style="text-align:right">
        Payments are processed by Paystack; M-PESA and card settlements<br />
        appear on your statement under Paystack.<br />
        <span class="mono">Generated ${esc(when(new Date()))} · ${number} · ${stamp}</span>
      </div>
    </footer>
  </div>

  <div class="actions">
    <button class="btn ghost" onclick="history.length > 1 ? history.back() : window.close()">Back</button>
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}
