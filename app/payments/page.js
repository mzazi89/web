'use client';

// MZAZI TECH — Payments & receipts.
//
// A calm ledger view of the same wallet transactions the wallet page shows.
// No new endpoint: GET /api/wallet/balance already returns the latest rows
// (hard-limited to 10 server-side), which this page labels honestly.

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBackground, PageHeader, Button, Card, CardHeader, Badge, DataTable, StatCard,
  EmptyState, ErrorState, Skeleton, humaniseError, Icons,
} from '@/components/ui';
import { fmtKes } from '@/lib/currency';

function moneyTone(type) {
  return type === 'deposit' ? 'good' : 'bad';
}

export default function PaymentsPage() {
  const router = useRouter();
  const [state, setState] = useState('loading');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const me = await fetch('/api/auth/me');
      if (!me.ok) { router.push('/login'); return; }
      const res = await fetch('/api/wallet/balance');
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error('Wallet request failed');
      const d = await res.json();
      setBalance(d.balance || 0);
      setTransactions(d.transactions || []);
      setState('ready');
    } catch (e) {
      setErrorMsg(humaniseError(e, 'We could not load your payments. Please try again.'));
      setState('error');
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const deposits = transactions.filter((t) => t.type === 'deposit');

  return (
    <AppBackground variant="dashboard">
      <div className="container-site" style={{ paddingTop: 26, paddingBottom: 90, maxWidth: 1100 }}>
        <PageHeader
          title="Payments & receipts"
          description="Wallet top-ups and plan purchases in one place, with a receipt for each completed payment."
          icon={<Icons.CreditCard size={20} />}
          actions={<Button href="/wallet" icon={<Icons.Plus size={16} />}>Add money</Button>}
          breadcrumb={['Dashboard', 'Payments']}
        />

        {state === 'loading' && (
          <div className="grid-2-responsive" style={{ marginBottom: 22 }} aria-hidden="true">
            <span className="skeleton" style={{ height: 96, borderRadius: 'var(--r-lg)' }} />
            <span className="skeleton" style={{ height: 96, borderRadius: 'var(--r-lg)' }} />
          </div>
        )}

        {state === 'error' && (
          <Card>
            <ErrorState title="We couldn’t load your payments" message={errorMsg} onRetry={() => load()} />
          </Card>
        )}

        {state === 'ready' && (
          <>
            <div className="grid-2-responsive anim-fade-up" style={{ marginBottom: 22 }}>
              <StatCard label="Wallet balance" value={fmtKes(balance)} hint="Available to spend" icon={<Icons.Wallet size={19} />} tone="brand" />
              <StatCard label="Top-ups recorded" value={deposits.length} hint="In the latest transactions" icon={<Icons.Download size={19} />} tone="good" />
            </div>

            <Card style={{ marginBottom: 22 }}>
              <CardHeader
                title="What appears here"
                description="When you add money to your wallet, or pay for a WhatsApp bot plan, the transaction is recorded and shown below. Plan purchases are debits; top-ups are deposits."
                icon={<Icons.Info size={18} />}
              />
            </Card>

            <Card className="anim-fade-up d1">
              <CardHeader
                title="Recent transactions"
                description="Your latest 10 wallet movements."
                action={<Button variant="ghost" size="sm" href="/wallet">Open wallet</Button>}
              />

              {transactions.length === 0 ? (
                <EmptyState
                  icon={<Icons.CreditCard size={26} />}
                  title="You don't have any payments yet."
                  description="Add money to your wallet or upgrade a plan and the receipts will show up here."
                  action={<Button href="/wallet" icon={<Icons.Plus size={16} />}>Add money</Button>}
                />
              ) : (
                <DataTable columns={['Date', 'Description', 'Type', 'Amount', 'Status']}>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td data-label="Date" className="mono tnum" style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td data-label="Description" style={{ color: 'var(--ink-2)' }}>{t.description || t.type}</td>
                      <td data-label="Type">
                        <Badge tone={t.type === 'deposit' ? 'good' : 'blue'}>{t.type}</Badge>
                      </td>
                      <td data-label="Amount" className="mono tnum" style={{ color: moneyTone(t.type) === 'good' ? 'var(--good)' : 'var(--bad)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {t.type === 'deposit' ? '+' : '−'}{fmtKes(t.amount)}
                      </td>
                      <td data-label="Status">
                        <Badge tone={t.status === 'success' ? 'good' : 'warn'}>{t.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              )}
            </Card>
          </>
        )}
      </div>
    </AppBackground>
  );
}
