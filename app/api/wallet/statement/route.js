// MZAZI API — GET /api/wallet/statement?from=2026-11-01&to=2026-11-30
//
// An account statement a customer can request for themselves, any period, no
// support ticket: opening balance, every settled movement with a running
// balance, money in, money out, closing balance.
//
// Returns HTML so the browser's "Save as PDF" makes a vector copy — the same
// reasoning as the single receipt. The logo is inlined for the same reason.
//
// Two honest details that most statements get wrong:
//   * the opening balance is computed from the ledger *before* the period, not
//     assumed to be zero, so the closing figure reconciles with the wallet;
//   * failed and abandoned attempts are listed but never counted, because they
//     moved no money. Silently dropping them is what makes a customer think a
//     charge vanished.
//
// Scope is enforced in SQL (`user_id = viewer.id`) — no id parameter exists to
// guess, so one account can never read another's statement.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getViewer } from '@/lib/dashboard/session';
import { money } from '@/lib/dashboard/data';
import { logoDataUri } from '@/lib/brand-logo';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const SETTLED = new Set(['success', 'done', 'completed']);
const MAX_ROWS = 500;
const MAX_DAYS = 400;

const day = (d) => new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
const clock = (d) => new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
const ymd = (d) => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD

function parseDate(value, fallback) {
  if (!value) return fallback;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export async function GET(request) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const url = new URL(request.url);
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const from = parseDate(url.searchParams.get('from'), monthStart);
  // `to` is inclusive for the customer: the whole of that day is included.
  const toDay = parseDate(url.searchParams.get('to'), today);
  const to = new Date(toDay.getFullYear(), toDay.getMonth(), toDay.getDate() + 1);

  if (to <= from) {
    return NextResponse.json({ error: 'The end date must be after the start date.' }, { status: 400 });
  }
  if ((to - from) / 86_400_000 > MAX_DAYS) {
    return NextResponse.json({ error: `Pick a period of ${MAX_DAYS} days or less.` }, { status: 400 });
  }

  // Opening balance: everything before the window, on the same convention the
  // dashboard uses — debits subtract, credits and bonuses add.
  const [open] = await sql`
    SELECT COALESCE(SUM(CASE WHEN type = 'debit' THEN -(amount + COALESCE(bonus_amount, 0))
                             ELSE (amount + COALESCE(bonus_amount, 0)) END), 0) AS opening
    FROM wallet_transactions
    WHERE user_id = ${viewer.id} AND created_at < ${from.toISOString()}
  `;
  const opening = Number(open?.opening || 0);

  const rows = await sql`
    SELECT id, type, amount, bonus_amount, status, description, payment_method,
           reference, created_at, paid_at
    FROM wallet_transactions
    WHERE user_id = ${viewer.id}
      AND created_at >= ${from.toISOString()}
      AND created_at < ${to.toISOString()}
    ORDER BY created_at, id
    LIMIT ${MAX_ROWS + 1}
  `;

  const truncated = rows.length > MAX_ROWS;
  const list = truncated ? rows.slice(0, MAX_ROWS) : rows;

  // One pass, so the running balance and the totals can never disagree.
  let running = opening;
  let inSum = 0;
  let outSum = 0;
  const lines = list.map((t) => {
    const debit = String(t.type).toLowerCase() === 'debit';
    const settled = SETTLED.has(String(t.status || '').toLowerCase());
    const gross = Number(t.amount || 0) + (debit ? 0 : Number(t.bonus_amount || 0));
    if (settled) {
      if (debit) { outSum += gross; running -= gross; } else { inSum += gross; running += gross; }
    }
    return { ...t, debit, settled, gross, balance: running };
  });

  const closing = running;
  const name = [viewer.firstname, viewer.lastname].filter(Boolean).join(' ') || viewer.email;
  const period = `${day(from)} — ${day(new Date(to - 1))}`;
  const ref = `MZ-ST-${ymd(from).replace(/-/g, '')}-${ymd(new Date(to - 1)).replace(/-/g, '')}`;
  const pendingCount = lines.filter((l) => !l.settled).length;

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Statement ${period} · MZAZI TECH</title>
<style>
  @page { size: A4; margin: 12mm; }
  *, *::before, *::after { box-sizing: border-box; }
  :root { color-scheme: light; --ink:#0a1020; --ink-2:#4a5670; --dim:#7b879e; --line:#e4e9f2;
          --brand:#2e6bff; --cyan:#22d3ee; --dark:#05070c; --good:#067a52; --bad:#b3143c; }
  html, body { margin: 0; }
  body {
    background: radial-gradient(900px 320px at 10% -10%, rgba(46,107,255,.13), transparent 70%), #eef1f7;
    padding: 22px 14px 48px;
    font: 12.5px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
    color: var(--ink);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet { max-width: 760px; margin: 0 auto; background: #fff; border: 1px solid var(--line);
           border-radius: 14px; overflow: hidden; box-shadow: 0 22px 50px -30px rgba(9,17,38,.45); }

  .head { position: relative; display: flex; align-items: center; gap: 12px; padding: 18px 22px 16px;
    background: radial-gradient(420px 150px at 4% -60%, rgba(46,107,255,.55), transparent 70%),
                radial-gradient(380px 170px at 100% 150%, rgba(34,211,238,.32), transparent 70%),
                linear-gradient(140deg, #05070c, #0a1226 60%, #05070c); color: #f2f6ff; }
  .head::after { content:""; position:absolute; left:0; right:0; bottom:0; height:2px;
    background: linear-gradient(90deg, var(--brand), var(--cyan) 55%, #7c5cff); }
  .mark { width: 38px; height: 38px; flex: 0 0 38px; border-radius: 10px; overflow: hidden;
    background:#05070c; border:1px solid rgba(120,160,255,.35); box-shadow: 0 0 0 3px rgba(46,107,255,.10); }
  .mark img { width:100%; height:100%; object-fit: cover; display:block; }
  .co b { display:block; font-size:14.5px; font-weight:800; letter-spacing:-.01em; }
  .co b em { font-style:normal; color: var(--cyan); }
  .co span { font-size:8.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:#9fb2d4; }
  .doc { margin-left:auto; text-align:right; }
  .doc small { display:block; font-size:8px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:#8ea3c7; }
  .doc i { font-style:normal; font-size:12px; font-weight:600; }

  .body { padding: 16px 22px 8px; }
  .who { display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap; padding-bottom: 12px; border-bottom:1px solid var(--line); }
  .who p { margin:0; }
  .who .to { font-size:14px; font-weight:700; }
  .who .muted { color: var(--ink-2); }
  .who .right { text-align:right; }

  .figs { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:1px; margin: 14px 0 0;
    background: var(--line); border:1px solid var(--line); border-radius:10px; overflow:hidden; }
  .figs div { background:#fff; padding: 9px 12px; }
  .figs dt { font-size:8px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color: var(--dim); margin:0 0 2px; }
  .figs dd { margin:0; font-size:12.5px; font-weight:750; font-variant-numeric: tabular-nums; }
  .figs .in dd { color: var(--good); } .figs .out dd { color: var(--bad); }
  .figs .close { background: var(--dark); }
  .figs .close dt { color:#9fb2d4; } .figs .close dd { color:#eaf1ff; }

  table { width:100%; border-collapse: collapse; margin: 16px 0 0; }
  th { text-align:left; padding: 0 6px 8px; font-size:8px; font-weight:700; letter-spacing:.14em;
       text-transform:uppercase; color: var(--dim); border-bottom:1px solid var(--line); }
  th.r, td.r { text-align:right; }
  td { padding: 7px 6px; border-bottom:1px solid #f2f5fa; vertical-align: top; font-size: 11.5px; }
  tr:nth-child(even) td { background: #fcfdff; }
  .d { white-space: nowrap; color: var(--ink-2); font-variant-numeric: tabular-nums; }
  .d small { display:block; font-size:9.5px; color: var(--dim); }
  .desc { font-weight:600; }
  .ref { display:block; font-family: ui-monospace, Menlo, monospace; font-size:9.5px; color: var(--dim); }
  .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
  .in { color: var(--good); } .out { color: var(--bad); }
  .void td { color: var(--dim); }
  .tag { display:inline-block; margin-left:5px; padding:1px 6px; border-radius:999px; font-size:8px;
         font-weight:800; letter-spacing:.1em; text-transform:uppercase; border:1px solid currentColor; color: var(--bad); }

  .note { margin: 14px 0 0; font-size:10.5px; color: var(--ink-2); line-height:1.55; }
  .foot { margin-top: 16px; padding: 12px 22px 14px; border-top:1px solid var(--line); background:#fbfcfe;
          font-size:9.5px; color: var(--ink-2); display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  .foot a { color: var(--brand); text-decoration:none; }
  .foot .mono { font-family: ui-monospace, Menlo, monospace; font-size:9px; color: var(--dim); }

  .actions { max-width: 760px; margin: 12px auto 0; display:flex; gap:8px; justify-content:flex-end; }
  .btn { font:inherit; font-weight:700; font-size:11.5px; padding:8px 16px; border-radius:999px;
         cursor:pointer; border:1px solid var(--dark); background: var(--dark); color:#fff; }
  .btn.ghost { background:#fff; color: var(--ink); border-color: var(--line); }

  @media print {
    body { background:#fff; padding:0; }
    .sheet { border:0; border-radius:0; box-shadow:none; max-width: none; }
    .actions { display:none !important; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
  }
  @media (max-width: 560px) {
    .figs { grid-template-columns: 1fr 1fr; }
    .body { padding: 14px 16px 6px; }
    .head, .foot { padding-left:16px; padding-right:16px; }
    td, th { padding-left: 4px; padding-right: 4px; }
  }
</style></head>
<body>
  <div class="sheet">
    <header class="head">
      <span class="mark">${logoDataUri() ? `<img src="${logoDataUri()}" alt="MZAZI TECH" />` : ''}</span>
      <span class="co"><b>MZAZI <em>TECH</em></b><span>Innovate · Build · Grow</span></span>
      <span class="doc"><small>Account statement</small><i>${ref}</i></span>
    </header>

    <div class="body">
      <div class="who">
        <div>
          <p class="to">${esc(name)}</p>
          <p class="muted">${esc(viewer.email)}</p>
        </div>
        <div class="right">
          <p class="muted">${esc(period)}</p>
          <p class="muted" style="font-size:10.5px">Generated ${esc(day(new Date()))} ${esc(clock(new Date()))}</p>
        </div>
      </div>

      <dl class="figs">
        <div><dt>Opening</dt><dd>${money(opening)}</dd></div>
        <div class="in"><dt>Money in</dt><dd>+${money(inSum)}</dd></div>
        <div class="out"><dt>Money out</dt><dd>−${money(outSum)}</dd></div>
        <div class="close"><dt>Closing</dt><dd>${money(closing)}</dd></div>
      </dl>

      <table>
        <thead>
          <tr>
            <th style="width:88px">Date</th>
            <th>Description</th>
            <th class="r" style="width:92px">In</th>
            <th class="r" style="width:92px">Out</th>
            <th class="r" style="width:100px">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${lines.length === 0 ? `<tr><td colspan="5" style="text-align:center;color:var(--dim);padding:22px 0">No movements in this period.</td></tr>` : ''}
          ${lines.map((l) => `
          <tr class="${l.settled ? '' : 'void'}">
            <td class="d">${esc(day(l.paid_at || l.created_at))}<small>${esc(clock(l.paid_at || l.created_at))}</small></td>
            <td>
              <span class="desc">${esc(l.description || 'Wallet transaction')}${l.settled ? '' : `<span class="tag">${esc(l.status)}</span>`}</span>
              ${l.reference ? `<span class="ref">${esc(l.reference)}</span>` : ''}
            </td>
            <td class="r num in">${!l.debit && l.settled ? '+' + money(l.gross) : '—'}</td>
            <td class="r num out">${l.debit && l.settled ? '−' + money(l.gross) : '—'}</td>
            <td class="r num">${money(l.balance)}</td>
          </tr>`).join('')}
        </tbody>
      </table>

      ${truncated ? `<p class="note"><b>Showing the first ${MAX_ROWS} entries.</b> Narrow the period for a complete statement.</p>` : ''}
      ${pendingCount > 0 ? `<p class="note">${pendingCount} entr${pendingCount === 1 ? 'y is' : 'ies are'} shown in grey — pending or failed attempts. They are not counted in the totals because no money moved.</p>` : ''}
      <p class="note">This statement is generated from your account ledger. Payments are processed by Paystack; M-PESA and card settlements appear on your bank statement under Paystack. Balances are in Kenyan shillings.</p>
    </div>

    <footer class="foot">
      <span>MZAZI TECH INC · Nairobi, Kenya<br /><a href="mailto:mzazitechinc@gmail.com">mzazitechinc@gmail.com</a></span>
      <span style="text-align:right">mzazi.shop<br /><span class="mono">${ref}</span></span>
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
