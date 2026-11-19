'use client';

// ─────────────────────────────────────────────────────────────────────────────
// components/WithdrawButton.jsx — take a wallet balance out to M-PESA.
//
// The form is deliberately plain: amount, number, optional note. Everything that
// makes the payout safe happens on the server (atomic debit, one in flight,
// refund on any failure), so this component's job is to not lie about what
// happened:
//
//   * it never shows "sent" until the API accepted the request,
//   * it says "queued with M-PESA", not "paid", because the success callback is
//     what actually settles it,
//   * when payouts are not configured it explains that instead of failing on
//     submit.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icons, Modal, useToast } from '@/components/ui';

const fmt = (n) => `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function WithdrawButton({ className = 'btn btn-ghost' }) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/withdraw', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setConfig(data);
    } catch {
      /* leave config null — the modal will say so */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setDone(null);
    setError('');
    load();
  }, [open, load]);

  const value = Number(amount);
  const pendingOne = (config?.recent || []).some((r) => r.status === 'pending');
  const whole = Number.isFinite(value) && Math.abs(value - Math.round(value)) < 0.0001;
  const valid = whole && value >= (config?.min || 50) && value <= (config?.max || 150000)
    && value <= (config?.balance || 0) && /\d{9,}/.test(phone.replace(/\D/g, '')) && !pendingOne;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value, phone, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not start the withdrawal');

      setDone(data);
      setAmount('');
      setNote('');
      toast.success('Withdrawal sent to M-PESA');
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <Icons.ArrowUpRight size={14} /> Withdraw
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={done ? 'Withdrawal sent' : 'Withdraw to M-PESA'}
        description={done ? undefined : 'Move your wallet balance to a Safaricom number.'}
        size="sm"
        footer={done ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setOpen(false); router.push('/dashboard/wallet'); }}
          >
            Done
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={submit}
              disabled={!valid || busy || !config?.available}
            >
              {busy ? 'Sending…' : value > 0 ? `Send ${fmt(value)}` : 'Send'}
            </button>
          </>
        )}
      >
        {done ? (
          <div className="stack" style={{ gap: 10 }}>
            <div
              className="note"
              style={{ borderColor: 'var(--line)', background: 'var(--brand-a06)' }}
            >
              <Icons.CheckCircle size={16} />
              <p>
                <b>{fmt(done.transaction?.amount)}</b> is on its way to{' '}
                <b>{done.transaction?.phone}</b>. Safaricom will text you when it lands.
              </p>
            </div>
            <p className="text-[12px]" style={{ color: 'var(--dim)' }}>
              Reference <b>{done.transaction?.reference}</b>. New balance {fmt(done.balance)}.
              If M-PESA cannot complete it, the amount returns to your wallet automatically.
            </p>
          </div>
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            {loading && <p className="text-[12.5px]" style={{ color: 'var(--dim)' }}>Checking withdrawal settings…</p>}

            {!loading && config && !config.available && (
              <div className="note" style={{ borderColor: 'var(--line)' }}>
                <Icons.AlertCircle size={16} />
                <p>
                  Withdrawals are not enabled yet. M-PESA payouts need the B2C shortcode and
                  initiator configured — contact support and this form starts working, no update needed.
                </p>
              </div>
            )}

            {!loading && config?.available && (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="kpi-label">Available</span>
                  <b style={{ fontSize: 18 }}>{fmt(config.balance)}</b>
                </div>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold">Amount</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={config.min}
                      max={config.max}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`${config.min} – ${config.max.toLocaleString()}`}
                      className="input"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setAmount(String(Math.min(config.balance, config.max)))}
                    >
                      Max
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold">M-PESA number</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="input"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold">Note (optional)</span>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 80))}
                    placeholder="What is this for?"
                    className="input"
                  />
                </label>

                {pendingOne && (
                  <div className="note" style={{ borderColor: 'var(--brand-a25)', background: 'var(--brand-a06)' }}>
                    <Icons.Clock size={15} />
                    <p>A payout is already being processed. It clears the moment M-PESA confirms, then you can withdraw again.</p>
                  </div>
                )}

                <p className="text-[11.5px]" style={{ color: 'var(--dim)' }}>
                  Whole shillings only · minimum {fmt(config.min)} · maximum {fmt(config.max)} · no fee.
                  The balance is held the moment you send and returned automatically if M-PESA
                  fails. Payouts on {config.channel || 'M-PESA'}.
                </p>

                {error && (
                  <div className="note" style={{ borderColor: 'var(--bad-a25)', background: 'var(--bad-a08)' }}>
                    <Icons.AlertCircle size={15} />
                    <p>{error}</p>
                  </div>
                )}

                {(config.recent || []).length > 0 && (
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--dim)' }}>Recent payouts</p>
                    <div className="stack" style={{ gap: 6 }}>
                      {config.recent.map((r) => (
                        <div key={r.id} className="flex items-center justify-between" style={{ gap: 8 }}>
                          <span className="mono text-[11.5px]" style={{ color: 'var(--muted)' }}>
                            {new Date(r.created_at).toLocaleDateString('en-KE')} · {r.phone_number}
                          </span>
                          <span className="flex items-center" style={{ gap: 8 }}>
                            <b className="text-[12px]">{fmt(r.amount)}</b>
                            <span
                              className="rounded-full px-2 py-[2px] text-[10.5px] font-bold"
                              style={{
                                background: r.status === 'success' ? 'var(--good-a10, rgba(34,197,94,0.12))' : r.status === 'failed' ? 'var(--bad-a08)' : 'var(--brand-a10)',
                                color: r.status === 'success' ? 'var(--good)' : r.status === 'failed' ? 'var(--bad)' : 'var(--brand)',
                              }}
                            >
                              {r.status === 'pending' ? 'processing' : r.status}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!loading && !config && (
              <p className="text-[12.5px]" style={{ color: 'var(--bad)' }}>
                Could not reach the withdrawal service. Try again in a moment.
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
