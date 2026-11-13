// MZAZI API — GET /api/wallet/receipt/[id]
//
// One short receipt for every entry point: the dashboard ledger and the wallet
// page both open this route, so a customer always gets the same document.
//
// Deliberately compact — a receipt is proof of one payment, not a statement. It
// fits a phone screen without scrolling and prints on a single slip. HTML rather
// than PDF so the browser's own "Save as PDF" produces a vector file with the
// site's fonts, and the logo is inlined so the page prints offline.
//
// Ownership is enforced in SQL (`user_id = viewer.id`): a guessed id is a 404.

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getViewer } from '@/lib/dashboard/session';
import { money } from '@/lib/dashboard/data';
import { logoDataUri } from '@/lib/brand-logo';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const when = (d) =>
  d ? new Date(d).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

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
  @page { size: A5; margin: 8mm; }
  *, *::before, *::after { box-sizing: border-box; }
  :root { color-scheme: light; --ink: #0a1020; --ink-2: #4a5670; --dim: #7b879e;
          --line: #e4e9f2; --brand: #2e6bff; --cyan: #22d3ee; --dark: #05070c; }
  html, body { margin: 0; }
  body {
    background: radial-gradient(700px 260px at 10% -20%, rgba(46,107,255,.14), transparent 70%), #eef1f7;
    padding: 18px 14px 40px;
    font: 12.5px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
    color: var(--ink);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet {
    max-width: 430px; margin: 0 auto; background: #fff;
    border: 1px solid var(--line); border-radius: 14px; overflow: hidden;
    box-shadow: 0 20px 44px -26px rgba(9,17,38,.45);
  }

  .head {
    position: relative; display: flex; align-items: center; gap: 10px;
    padding: 15px 16px 14px;
    background: radial-gradient(340px 120px at 6% -50%, rgba(46,107,255,.55), transparent 70%),
                radial-gradient(300px 140px at 100% 140%, rgba(34,211,238,.34), transparent 70%),
                linear-gradient(140deg, #05070c, #0a1226 60%, #05070c);
    color: #f2f6ff;
  }
  .head::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
    background: linear-gradient(90deg, var(--brand), var(--cyan) 55%, #7c5cff);
  }
  .mark {
    width: 34px; height: 34px; flex: 0 0 34px; border-radius: 9px; overflow: hidden;
    background: #05070c; border: 1px solid rgba(120,160,255,.35);
    box-shadow: 0 0 0 3px rgba(46,107,255,.10);
  }
  .mark img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .co { min-width: 0; }
  .co b { display: block; font-size: 13.5px; font-weight: 800; letter-spacing: -.01em; }
  .co b em { font-style: normal; color: var(--cyan); }
  .co span { font-size: 8.5px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #9fb2d4; }
  .doc { margin-left: auto; text-align: right; flex: 0 0 auto; }
  .doc small { display: block; font-size: 8px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #8ea3c7; }
  .doc i { font-style: normal; font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; font-weight: 600; }
  .pill {
    display: inline-block; margin-top: 5px; padding: 2px 8px; border-radius: 999px;
    font-size: 8.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
    border: 1px solid currentColor;
  }
  .is-ok { color: #5ef2b0; } .is-bad { color: #ff8aa6; } .is-wait { color: #ffd166; }

  .body { padding: 14px 16px 4px; }
  .amt { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; padding-bottom: 12px; border-bottom: 1px dashed #dbe2ee; }
  .amt .label { font-size: 8.5px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--dim); }
  .amt b { font-size: 24px; font-weight: 800; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .amt b small { font-size: 11px; font-weight: 700; color: var(--ink-2); letter-spacing: 0; }

  dl { display: grid; grid-template-columns: auto 1fr; gap: 5px 12px; margin: 12px 0 0; }
  dt { font-size: 8.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--dim); padding-top: 2px; }
  dd { margin: 0; text-align: right; font-weight: 600; word-break: break-word; }
  dd.mono { font-family: ui-monospace, Menlo, monospace; font-size: 11px; font-weight: 500; color: var(--ink-2); }

  .total {
    margin: 14px 0 0; padding: 10px 12px; border-radius: 10px;
    display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
    background: var(--dark); color: #eaf1ff;
  }
  .total span { font-size: 8.5px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #9fb2d4; }
  .total b { font-size: 16px; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }

  .note { margin: 11px 0 0; font-size: 10.5px; line-height: 1.5; color: var(--ink-2); }
  .note b { color: var(--ink); }

  .foot {
    margin-top: 14px; padding: 11px 16px 13px; border-top: 1px solid var(--line); background: #fbfcfe;
    font-size: 9.5px; color: var(--ink-2); display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;
  }
  .foot a { color: var(--brand); text-decoration: none; }
  .foot .mono { font-family: ui-monospace, Menlo, monospace; font-size: 9px; color: var(--dim); }

  .actions { max-width: 430px; margin: 10px auto 0; display: flex; gap: 8px; justify-content: flex-end; }
  .btn {
    font: inherit; font-weight: 700; font-size: 11.5px; padding: 8px 15px; border-radius: 999px;
    cursor: pointer; border: 1px solid var(--dark); background: var(--dark); color: #fff;
  }
  .btn.ghost { background: #fff; color: var(--ink); border-color: var(--line); }

  @media print {
    body { background: #fff; padding: 0; }
    .sheet { border: 0; border-radius: 0; box-shadow: none; max-width: none; }
    .actions { display: none !important; }
  }
</style></head>
<body>
  <div class="sheet">
    <header class="head">
      <span class="mark">${logoDataUri() ? `<img src="${logoDataUri()}" alt="MZAZI TECH" />` : ''}</span>
      <span class="co"><b>MZAZI <em>TECH</em></b><span>Innovate · Build · Grow</span></span>
      <span class="doc">
        <small>Receipt</small>
        <i>${number}</i><br />
        <span class="pill ${stampClass}">${stamp}</span>
      </span>
    </header>

    <div class="body">
      <div class="amt">
        <span class="label">${isDebit ? 'Charged' : 'Credited'}</span>
        <b><small>KES</small> ${isDebit ? '−' : '+'}${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
      </div>

      <dl>
        <dt>From</dt><dd>${esc(name)}<br /><span style="font-weight:400;color:var(--ink-2)">${esc(viewer.email)}</span></dd>
        <dt>Date</dt><dd>${esc(when(t.paid_at || t.created_at))}</dd>
        <dt>For</dt><dd>${esc(t.description || 'Wallet transaction')}</dd>
        <dt>Method</dt><dd>${esc(method)}</dd>
        ${t.reference ? `<dt>Ref</dt><dd class="mono">${esc(t.reference)}</dd>` : ''}
      </dl>

      ${t.failure_reason ? `<p class="note" style="color:#b3143c"><b>Not settled:</b> ${esc(t.failure_reason)}</p>` : ''}

      <div class="total">
        <span>${settled ? 'Total paid' : failed ? 'Not paid' : 'Pending'}${bonus > 0 ? ' · incl. bonus' : ''}</span>
        <b>${money(total)}</b>
      </div>

      <p class="note">
        <b>2-week panel warranty.</b> Panels are replaced free inside two weeks of purchase — just message support.
      </p>
    </div>

    <footer class="foot">
      <span>MZAZI TECH INC · Nairobi<br /><a href="mailto:mzazitechinc@gmail.com">mzazitechinc@gmail.com</a></span>
      <span style="text-align:right">mzazi.shop<br /><span class="mono">${number}</span></span>
    </footer>
  </div>

  <div class="actions">
    <button class="btn ghost" onclick="history.length > 1 ? history.back() : window.close()">Back</button>
    <button class="btn" onclick="window.print()">Print / PDF</button>
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
