'use client';

// MZAZI TECH — Subscription.
//
// Shows the current plan, the plans the account can move to, and what the wallet
// can afford. Plan data is never hardcoded here: it comes from the same source
// the bot uses, via GET /api/pair/devices (which returns lib/pairApi's PLANS).
//
// Endpoints used (all pre-existing):
//   GET  /api/auth/me             → session gate
//   GET  /api/pair/devices        → { plan, maxDevices, endDate, plans[] }
//   GET  /api/wallet/balance      → { balance, transactions[] }
//   POST /api/pair/plan           → { plan: <key> }  (402 + `insufficient` when low)

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBackground, PageHeader, Button, Card, CardHeader, Badge, PlanCard, StatCard,
  Alert, ErrorState, SkeletonCards, ConfirmDialog, humaniseError, planLabel,
  ToastProvider, useToast, Icons,
} from '@/components/ui';
import { fmtKes } from '@/lib/currency';

const BLURBS = {
  PLAN_5: 'For a small team or a first serious setup.',
  PLAN_10: 'Our most popular size for growing businesses.',
  PLAN_20: 'For agencies running many numbers at once.',
  UNLIMITED: 'No device ceiling — scale as far as you need.',
};

const FEATURES = {
  PLAN_5: ['Up to 5 WhatsApp numbers', 'All bot commands and automations', '24/7 uptime'],
  PLAN_10: ['Up to 10 WhatsApp numbers', 'All bot commands and automations', 'Priority support'],
  PLAN_20: ['Up to 20 WhatsApp numbers', 'All bot commands and automations', 'Priority support'],
  UNLIMITED: ['Unlimited WhatsApp numbers', 'All bot commands and automations', 'Priority support'],
};

const FREE_PLAN = {
  key: 'FREE',
  name: 'Free',
  devices: 1,
  priceKsh: 0,
  days: null,
  blurb: 'The default plan every account starts on.',
  features: ['1 WhatsApp number', 'Core bot features'],
};

function toCard(p) {
  return {
    key: p.key,
    name: planLabel(p.key),
    devices: p.maxDevices >= 999 ? 'unlimited' : p.maxDevices,
    priceKsh: p.priceKsh,
    days: p.days,
    blurb: BLURBS[p.key] || null,
    features: FEATURES[p.key] || [],
  };
}

function SubscriptionInner() {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState('loading');
  const [data, setData] = useState(null);
  const [balance, setBalance] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirm, setConfirm] = useState(null); // { kind, card }
  const [busyKey, setBusyKey] = useState(null);
  const [after, setAfter] = useState(null); // { kind, title, text }

  const load = useCallback(async (silent = false) => {
    if (!silent) setState('loading');
    try {
      const me = await fetch('/api/auth/me');
      if (!me.ok) { router.push('/login'); return; }

      const [dres, bres] = await Promise.all([
        fetch('/api/pair/devices', { cache: 'no-store' }),
        fetch('/api/wallet/balance'),
      ]);
      if (dres.status === 401) { router.push('/login'); return; }
      if (!dres.ok) throw new Error('Plan request failed');
      setData(await dres.json());
      if (bres.ok) {
        const b = await bres.json();
        setBalance(b.balance || 0);
      }
      setState('ready');
    } catch (e) {
      setErrorMsg(humaniseError(e, 'We could not load your subscription. Please try again.'));
      setState('error');
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const doUpgrade = async (card) => {
    setConfirm(null);
    setBusyKey(card.key);
    setAfter(null);
    try {
      const res = await fetch('/api/pair/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: card.key }),
      });
      const d = await res.json().catch(() => ({}));

      if (res.status === 402 || d.insufficient) {
        setAfter({
          kind: 'warn',
          title: 'Not enough wallet balance',
          text: `This plan costs ${fmtKes(card.priceKsh)}. Top up your wallet and try again.`,
          topUp: true,
        });
        toast.error('Your wallet balance is too low for this plan.');
        return;
      }
      if (!res.ok) {
        setAfter({ kind: 'error', title: 'Upgrade didn’t go through', text: humaniseError(d.error || 'Please try again in a moment.') });
        toast.error('We couldn’t upgrade your plan. Please try again.');
        return;
      }

      setAfter({
        kind: 'success',
        title: 'You’re on the new plan',
        text: `${planLabel(d.plan)} is active — you can now connect up to ${d.maxDevices >= 999 ? 'unlimited' : d.maxDevices} device${d.maxDevices === 1 ? '' : 's'}.`,
      });
      toast.success(`${planLabel(d.plan)} plan activated.`);
      await load(true);
    } catch (e) {
      setAfter({ kind: 'error', title: 'Upgrade didn’t go through', text: humaniseError(e) });
      toast.error('We couldn’t upgrade your plan. Please try again.');
    } finally {
      setBusyKey(null);
    }
  };

  const currentKey = data?.plan || 'FREE';
  const plans = (data?.plans || []).map(toCard).sort((a, b) => a.priceKsh - b.priceKsh);
  const cards = [FREE_PLAN, ...plans];
  const endDate = data?.endDate;

  const selectCard = (card) => {
    if (card.key === 'FREE') return;
    const low = balance !== null && balance < card.priceKsh;
    setConfirm({ kind: low ? 'topup' : 'upgrade', card });
  };

  return (
    <AppBackground variant="dashboard">
      <div className="container-site" style={{ paddingTop: 26, paddingBottom: 90, maxWidth: 1120 }}>
        <PageHeader
          title="Subscription"
          description="Your WhatsApp bot plan — how many numbers it covers, when it renews, and how to move up."
          icon={<Icons.Sparkles size={20} />}
          actions={<Button href="/devices" variant="ghost" icon={<Icons.Phone size={16} />}>My devices</Button>}
          breadcrumb={['Dashboard', 'Subscription']}
        />

        {state === 'loading' && <SkeletonCards count={4} height={300} />}

        {state === 'error' && (
          <Card>
            <ErrorState title="We couldn’t load your subscription" message={errorMsg} onRetry={() => load()} />
          </Card>
        )}

        {state === 'ready' && (
          <>
            {/* ── Current plan ── */}
            <Card accent className="anim-fade-up" style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>
                      {planLabel(currentKey)}
                    </h2>
                    <Badge tone="brand">Current plan</Badge>
                  </div>
                  <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
                    {data?.maxDevices >= 999 ? 'Unlimited devices' : `${data?.maxDevices ?? 1} device${(data?.maxDevices ?? 1) === 1 ? '' : 's'} allowed`}
                    {' · '}
                    {endDate ? `expires ${new Date(endDate).toLocaleDateString()}` : 'Never expires'}
                  </p>
                </div>
                <Button href="/devices" variant="dark" icon={<Icons.Phone size={16} />}>Manage devices</Button>
              </div>
            </Card>

            {/* ── Wallet + feedback ── */}
            <div className="grid-2-responsive" style={{ marginBottom: 22 }}>
              <StatCard
                label="Wallet balance"
                value={balance === null ? '—' : fmtKes(balance)}
                hint="Plans are paid from your wallet"
                icon={<Icons.Wallet size={19} />}
                tone="brand"
              />
              <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>
                  Not sure the balance covers a plan? Add money first — you only pay when you upgrade.
                </p>
                <Button href="/wallet" variant="ghost" icon={<Icons.Plus size={16} />}>Add money</Button>
              </Card>
            </div>

            {after && (
              <div style={{ marginBottom: 22 }} role="status" aria-live="polite">
                <Alert kind={after.kind} title={after.title}>
                  {after.text}
                  {after.topUp && (
                    <span style={{ display: 'block', marginTop: 10 }}>
                      <Button size="sm" href="/wallet" icon={<Icons.Wallet size={15} />}>Top up wallet</Button>
                    </span>
                  )}
                </Alert>
              </div>
            )}

            {/* ── Plan grid ── */}
            <h2 className="section-title" style={{ fontSize: '1.2rem', margin: '0 0 16px' }}>Choose your plan</h2>
            <div className="grid-cards">
              {cards.map((card) => {
                const current = card.key === currentKey;
                const low = !current && balance !== null && card.key !== 'FREE' && balance < card.priceKsh;
                return (
                  <div key={card.key} style={{ display: 'flex', flexDirection: 'column' }}>
                    <PlanCard
                      plan={card}
                      current={current}
                      showBuy={card.key !== 'FREE'}
                      recommended={card.key === 'PLAN_10' && !current}
                      busy={busyKey === card.key}
                      disabled={busyKey !== null && busyKey !== card.key}
                      onSelect={() => selectCard(card)}
                    />
                    {low && (
                      <p style={{ margin: '8px 2px 0', fontSize: 12.5, color: 'var(--warn)', fontWeight: 600 }}>
                        Your balance ({fmtKes(balance)}) is below this plan — top up first.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Explainer ── */}
            <Card style={{ marginTop: 26 }}>
              <CardHeader
                title="Need more devices?"
                description="Every plan is measured in WhatsApp numbers, not seats. Upgrading applies instantly and the extra slots are usable right away."
                icon={<Icons.Users size={18} />}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Button href="/devices" variant="dark" icon={<Icons.Phone size={16} />}>View my devices</Button>
                <Button href="/whatsapp-bot" variant="ghost" icon={<Icons.WhatsApp size={16} />}>Connect a number</Button>
              </div>
            </Card>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => (confirm.kind === 'topup' ? router.push('/wallet') : doUpgrade(confirm.card))}
        tone={confirm?.kind === 'topup' ? 'default' : 'default'}
        title={confirm?.kind === 'topup' ? 'Top up to continue' : `Upgrade to ${confirm?.card?.name || ''}?`}
        description={
          confirm?.kind === 'topup'
            ? `This plan costs ${fmtKes(confirm?.card?.priceKsh || 0)} and your wallet has ${fmtKes(balance || 0)}. Add money first and we’ll bring you right back.`
            : `${fmtKes(confirm?.card?.priceKsh || 0)} will be charged from your wallet for ${confirm?.card?.days || 30} days of ${confirm?.card?.name || ''}.`
        }
        confirmLabel={confirm?.kind === 'topup' ? 'Top up wallet' : 'Confirm & pay'}
        cancelLabel="Cancel"
      />
    </AppBackground>
  );
}

export default function SubscriptionPage() {
  return (
    <ToastProvider>
      <SubscriptionInner />
    </ToastProvider>
  );
}
