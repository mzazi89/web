import Link from 'next/link';
import { Icons } from '@/components/ui';
import { getViewer } from '@/lib/dashboard/session';
import StatementButton from '@/components/StatementButton';
import WithdrawButton from '@/components/WithdrawButton';
import { getWallet, money, shortDate } from '@/lib/dashboard/data';
import { PageHead, Panel, Empty, Status, Line, Kpi } from '@/components/dashboard/Parts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wallet & payments' };

// MZAZI TECH — wallet and payment history.
//
// Funding is not re-implemented here: /wallet already owns the Paystack charge
// form (M-PESA, Airtel, Till, card), the OTP flow and the status poller. This
// page is the ledger view of the same tables, plus a receipt per row.

export default async function WalletPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const { balance, transactions, updatedAt } = await getWallet(viewer.id);
  const settled = transactions.filter((t) => ['success', 'done'].includes(String(t.status).toLowerCase()));
  // Withdrawals are money out, like a debit — they must not be counted as "In".
  const isOut = (t) => t.type === 'debit' || t.type === 'withdrawal';
  const inTotal = settled.filter((t) => !isOut(t)).reduce((s, t) => s + Number(t.amount || 0) + Number(t.bonus_amount || 0), 0);
  const outTotal = settled.filter(isOut).reduce((s, t) => s + Number(t.amount || 0), 0);

  return (
    <>
      <PageHead
        eyebrow="Money"
        title="Wallet & payments"
        sub={updatedAt ? `Balance last updated ${shortDate(updatedAt)}` : 'Top up once, spend on any service'}
        actions={
          <>
            <StatementButton label="Statement" />
            <WithdrawButton className="btn btn-ghost" />
            <Link href="/wallet" className="btn btn-primary"><Icons.Plus size={14} /> Add funds</Link>
          </>
        }
      />

      <div className="wallet-hero">
        <div>
          <span className="kpi-label">Available balance</span>
          <p className="wallet-amount">{money(balance)}</p>
          <p className="kpi-note">Spendable on panels, VPS, bot plans and API overage — or withdraw to M-PESA.</p>
        </div>
        <div className="wallet-split">
          <div><span className="kpi-label">In</span><p className="wallet-stat is-in">+{money(inTotal)}</p></div>
          <div><span className="kpi-label">Out</span><p className="wallet-stat is-out">−{money(outTotal)}</p></div>
          <div><span className="kpi-label">Movements</span><p className="wallet-stat">{transactions.length}</p></div>
        </div>
      </div>

      <Panel
        title="Payment history"
        sub="Every top-up and charge on this account"
        action={<Link href="/wallet" className="dash-mini-link">Pay with Paystack <Icons.ArrowUpRight size={12} /></Link>}
      >
        {transactions.length === 0 ? (
          <Empty
            Icon={Icons.Wallet}
            title="No payments yet"
            body="Add funds with M-PESA or a card — Paystack settles it and it appears here instantly."
            href="/wallet"
            label="Add funds"
          />
        ) : transactions.map((t) => {
          const bonusOf = (row) => (isOut(row) ? 0 : Number(row.bonus_amount || 0));
          const receiptable = ['success', 'done', 'failed', 'abandoned'].includes(String(t.status).toLowerCase());
          return (
            <Line
              key={t.id}
              label={t.description || (t.type === 'deposit' ? 'Wallet top-up' : t.type === 'withdrawal' ? 'M-PESA withdrawal' : 'Wallet charge')}
              note={`${shortDate(t.paid_at || t.created_at)} · ${(t.payment_method || 'wallet').toUpperCase()}${t.reference ? ` · ${String(t.reference).slice(0, 18)}…` : ''}`}
              right={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <b className={`dash-amount ${isOut(t) ? 'is-out' : 'is-in'}`}>
                    {isOut(t) ? '−' : '+'}{money(Number(t.amount) + Number(bonusOf(t)))}
                  </b>
                  <Status value={t.status} />
                  {receiptable && (
                    <a href={`/api/wallet/receipt/${t.id}`} target="_blank" rel="noopener noreferrer" className="dash-mini-link">
                      Receipt
                    </a>
                  )}
                </span>
              }
            />
          );
        })}
      </Panel>

      <Panel title="How payments work" sub="Short version, no surprises">
        <div className="note-grid">
          <div className="note"><Icons.Shield size={14} /><p><b>Paystack handles the money.</b> M-PESA, Airtel, Till and cards are charged by Paystack; we never see your PIN or card number.</p></div>
          <div className="note"><Icons.Clock size={14} /><p><b>Most top-ups land in seconds.</b> If a charge is still processing after a few minutes, the receipt shows it and support can trace the reference.</p></div>
          <div className="note"><Icons.Receipt size={14} /><p><b>Every settled row has a receipt.</b> Open it and use your browser's print dialog to save a PDF for your books.</p></div>
        </div>
      </Panel>
    </>
  );
}
