'use client';

// MZAZI TECH — "request a statement".
//
// The customer picks a period and the statement opens as a printable document
// (/api/wallet/statement). Presets cover what people actually ask for — a month,
// a quarter, a year — and Custom covers an accountant with an exact window.
//
// Dates are built in local time and sent as YYYY-MM-DD, never as a Date object:
// a client in Nairobi asking for "October" must get October, not September's
// tail through a UTC conversion.

import { useMemo, useState } from 'react';
import { Modal, Button, Icons } from '@/components/ui';

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function presetRange(key) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case 'last-month':
      return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case 'quarter':
      return { from: iso(new Date(y, m - 2, 1)), to: iso(now) };
    case 'year':
      return { from: iso(new Date(y, 0, 1)), to: iso(now) };
    case 'this-month':
    default:
      return { from: iso(new Date(y, m, 1)), to: iso(now) };
  }
}

const PRESETS = [
  { key: 'this-month', label: 'This month' },
  { key: 'last-month', label: 'Last month' },
  { key: 'quarter', label: 'Last 3 months' },
  { key: 'year', label: 'This year' },
  { key: 'custom', label: 'Custom dates' },
];

export default function StatementButton({ variant = 'ghost', label = 'Statement', size = 'sm' }) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState('this-month');
  const [custom, setCustom] = useState(() => presetRange('this-month'));
  const [error, setError] = useState('');

  const range = useMemo(() => (choice === 'custom' ? custom : presetRange(choice)), [choice, custom]);

  const submit = () => {
    if (!range.from || !range.to) { setError('Pick both dates.'); return; }
    if (new Date(range.to) < new Date(range.from)) { setError('The end date must be after the start date.'); return; }
    setError('');
    const url = `/api/wallet/statement?from=${range.from}&to=${range.to}`;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = url;
    setOpen(false);
  };

  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)} icon={<Icons.Receipt size={15} />}>
        {label}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title="Request a statement"
        description="Every movement on your wallet for the period you choose, with an opening and closing balance."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} icon={<Icons.Download size={15} />}>Open statement</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 6 }}>
          {PRESETS.map((p) => (
            <label
              key={p.key}
              className="row-between"
              style={{
                gap: 10, padding: '9px 11px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${choice === p.key ? 'var(--brand)' : 'var(--line)'}`,
                background: choice === p.key ? 'rgba(46,107,255,.07)' : 'transparent',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</span>
              <input
                type="radio"
                name="statement-period"
                value={p.key}
                checked={choice === p.key}
                onChange={() => { setChoice(p.key); setError(''); }}
                style={{ accentColor: 'var(--brand)' }}
              />
            </label>
          ))}
        </div>

        {choice === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <label className="field">
              <span className="field-label">From</span>
              <input className="input" type="date" value={custom.from}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">To</span>
              <input className="input" type="date" value={custom.to}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
            </label>
          </div>
        )}

        {error && <p className="form-note is-bad" role="alert" style={{ marginTop: 10 }}>{error}</p>}

        <p className="field-hint" style={{ marginTop: 10 }}>
          Opens as a document you can print or save as PDF. Up to 400 days per statement.
        </p>
      </Modal>
    </>
  );
}
