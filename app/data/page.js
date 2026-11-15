'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Field, Input, Badge, Icons, Skeleton } from '@/components/ui';

// MZAZI TECH — buy data.
//
// One screen: pick a bundle, confirm the number, pay from the wallet. The phone
// number defaults to the account's own M-PESA line, because the commonest
// mistake in a top-up is a typo in a number you have typed a hundred times.
//
// While Safaricom's rail is unconfigured the page says so plainly and disables
// the buttons — worse than a missing feature is one that takes money and fails.

const fmt = (n) => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
const size = (mb) => (mb >= 1024 ? `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB` : `${mb} MB`);

export default function DataPage() {
  const [state, setState] = useState({ loading: true, plans: [], balance: 0, live: false });
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [plansRes, meRes] = await Promise.all([
          fetch('/api/data/plans').then((r) => r.json()),
          fetch('/api/auth/me').then((r) => r.json()).catch(() => ({})),
        ]);
        if (!alive) return;
        setState({
          loading: false,
          plans: plansRes.plans || [],
          balance: Number(plansRes.balance || 0),
          live: Boolean(plansRes.live),
        });
        const p = meRes?.user?.phone || meRes?.user?.phone_number || '';
        if (p) setPhone(String(p));
      } catch {
        if (alive) setState((s) => ({ ...s, loading: false }));
      }
    })();
    return () => { alive = false; };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of state.plans) {
      const key = p.network || 'safaricom';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return [...map.entries()];
  }, [state.plans]);

  async function buy(plan) {
    setNote(null);
    setBusy(plan.id);
    try {
      const res = await fetch('/api/data/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote({ bad: true, text: data.error || 'That did not go through.' });
      } else {
        setNote({ bad: false, text: `${plan.name} sent to ${phone}. Receipt ${data.reference}.` });
        setState((s) => ({ ...s, balance: +(s.balance - plan.price).toFixed(2) }));
      }
    } catch {
      setNote({ bad: true, text: 'Network hiccup — nothing was charged.' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 96, paddingBottom: 120 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>— DATA BUNDLES</div>
      <h1 className="display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 10 }}>
        Data, straight to the phone.
      </h1>
      <p className="lede" style={{ maxWidth: 560 }}>
        Buy a bundle with your wallet and it is delivered to any Safaricom number — yours or a
        customer&apos;s. No vouchers, no codes to type.
      </p>

      <div className="data-strip">
        <div>
          <div className="data-strip-label">Wallet</div>
          <div className="data-strip-value">{fmt(state.balance)}</div>
        </div>
        <Link href="/wallet" className="btn btn-ghost btn-sm">Top up <Icons.ArrowRight size={13} /></Link>
      </div>

      {!state.loading && !state.live && (
        <div className="data-banner">
          <Icons.Info size={16} />
          <span>Data bundles are being switched on. Top up your wallet meanwhile — nothing is charged until they go live.</span>
        </div>
      )}

      <Card className="data-phone" style={{ marginTop: 22 }}>
        <Field label="Send to" hint="Safaricom number that receives the bundle">
          <Input
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XX XXX XXX"
            autoComplete="tel"
            maxLength={15}
          />
        </Field>
      </Card>

      {note && (
        <div className={`data-note ${note.bad ? 'is-bad' : 'is-good'}`} role="status">
          {note.text}
        </div>
      )}

      {state.loading ? (
        <div className="data-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} h={132} radius={14} />)}
        </div>
      ) : state.plans.length === 0 ? (
        <Card style={{ marginTop: 22, textAlign: 'center', padding: 40 }}>
          <Icons.Wifi size={26} />
          <p style={{ marginTop: 12 }}>No bundles on the shelf yet.</p>
        </Card>
      ) : (
        grouped.map(([network, plans]) => (
          <section key={network} style={{ marginTop: 26 }}>
            <div className="data-group">
              <Badge tone="brand">{network}</Badge>
              <span>{plans.length} bundle{plans.length === 1 ? '' : 's'}</span>
            </div>
            <div className="data-grid">
              {plans.map((p) => {
                const short = p.price > state.balance;
                return (
                  <Card key={p.id} className="data-card">
                    <div className="data-card-top">
                      <span className="data-size">{size(p.size_mb)}</span>
                      <span className="data-valid">{p.validity_days} day{p.validity_days === 1 ? '' : 's'}</span>
                    </div>
                    <div className="data-name">{p.name}</div>
                    <div className="data-price">{fmt(p.price)}</div>
                    <Button
                      size="sm"
                      variant={short ? 'ghost' : 'primary'}
                      disabled={!state.live || short || busy === p.id || !phone.trim()}
                      onClick={() => buy(p)}
                    >
                      {busy === p.id ? 'Sending…' : short ? 'Top up first' : 'Buy'}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
