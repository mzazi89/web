// MZAZI API — GET /api/wallet/receipt/[id]
//
// A printable receipt for one wallet transaction. Returns HTML rather than a
// PDF: the browser's own "Save as PDF" produces a vector file with the site's
// fonts, and adding a PDF engine for one page would be a dependency the rest of
// the app does not need.
//
// Ownership is enforced in SQL (`user_id = viewer.id`), so a guessed id from
// another account is a 404 — not a receipt with someone else's name on it.

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getViewer } from '@/lib/dashboard/session';
import { money } from '@/lib/dashboard/data';

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

  const settled = ['success', 'done'].includes(String(t.status).toLowerCase());
  const total = Number(t.amount || 0) + Number(t.bonus_amount || 0);
  const name = [viewer.firstname, viewer.lastname].filter(Boolean).join(' ') || viewer.email;

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Receipt MZ-${String(t.id).padStart(6, '0')} · MZAZI TECH INC</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px 20px; background: #eef1f6; font: 13px/1.6 -apple-system, "Segoe UI", Inter, sans-serif; color: #0b1220; }
  .sheet { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #dfe5ee; border-radius: 10px; overflow: hidden; }
  .head { padding: 22px 26px; background: #05070c; color: #eef4ff; display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
  .brand { font-weight: 800; letter-spacing: -0.02em; font-size: 15px; }
  .brand span { color: #22d3ee; font-weight: 600; letter-spacing: 0.14em; font-size: 10px; display: block; margin-top: 3px; }
  .stamp { text-align: right; }
  .stamp b { display: block; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #94a5bf; }
  .stamp i { font-style: normal; font-family: ui-monospace, Menlo, monospace; font-size: 13px; }
  .body { padding: 24px 26px; }
  .row { display: flex; justify-content: space-between; gap: 16px; padding: 9px 0; border-bottom: 1px solid #eef1f6; }
  .row:last-child { border-bottom: 0; }
  .row dt { color: #5a6880; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; }
  .row dd { margin: 0; text-align: right; font-weight: 600; }
  .total { margin-top: 18px; padding: 16px 18px; border-radius: 8px; background: #f4f7fc; display: flex; justify-content: space-between; align-items: baseline; }
  .total b { font-size: 20px; letter-spacing: -0.02em; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .ok { background: #dcfce7; color: #166534; }
  .bad { background: #ffe4e6; color: #9f1239; }
  .wait { background: #fef3c7; color: #92400e; }
  .foot { padding: 16px 26px 22px; color: #5a6880; font-size: 11px; border-top: 1px solid #eef1f6; }
  .actions { max-width: 720px; margin: 16px auto 0; display: flex; gap: 8px; justify-content: flex-end; }
  button { font: inherit; font-weight: 600; padding: 9px 16px; border-radius: 8px; border: 1px solid #05070c; background: #05070c; color: #fff; cursor: pointer; }
  @media print { body { background: #fff; padding: 0; } .actions { display: none; } .sheet { border: 0; border-radius: 0; } }
</style></head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="brand">MZAZI TECH INC<span>INNOVATE. BUILD. GROW.</span></div>
      <div class="stamp">
        <b>Receipt</b>
        <i>MZ-${String(t.id).padStart(6, '0')}</i>
      </div>
    </div>
    <div class="body">
      <div class="row"><dt>Billed to</dt><dd>${esc(name)}<br /><span style="font-weight:400;color:#5a6880">${esc(viewer.email)}</span></dd></div>
      <div class="row"><dt>Date</dt><dd>${esc(when(t.paid_at || t.created_at))}</dd></div>
      <div class="row"><dt>Description</dt><dd>${esc(t.description || 'Wallet transaction')}</dd></div>
      <div class="row"><dt>Method</dt><dd>${esc((t.payment_method || t.provider || 'wallet').toUpperCase())}</dd></div>
      <div class="row"><dt>Status</dt><dd><span class="pill ${settled ? 'ok' : t.status === 'failed' || t.status === 'abandoned' ? 'bad' : 'wait'}">${esc(t.status)}</span></dd></div>
      ${t.reference ? `<div class="row"><dt>Reference</dt><dd style="font-family:ui-monospace,Menlo,monospace;font-size:11px">${esc(t.reference)}</dd></div>` : ''}
      ${t.failure_reason ? `<div class="row"><dt>Reason</dt><dd>${esc(t.failure_reason)}</dd></div>` : ''}

      <div class="total">
        <span>${t.type === 'debit' ? 'Charged' : 'Credited'}${Number(t.bonus_amount) > 0 ? ` (incl. ${money(t.bonus_amount)} bonus)` : ''}</span>
        <b>${money(total)}</b>
      </div>
    </div>
    <div class="foot">
      MZAZI TECH INC · Nairobi, Kenya · mzazi.shop<br />
      This receipt is generated from the account ledger. Payments are processed by Paystack; M-PESA and card settlements appear on your statement under Paystack.
    </div>
  </div>
  <div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}
