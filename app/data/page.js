'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, Field, Input, Icons, Skeleton } from '@/components/ui';

// MZAZI TECH — buy data, straight from Safaricom.
//
// Four states, and the page is honest in each of them:
//   idle     ask for a number
//   offers   exactly what the API returned — no fallback catalogue, no invented prices
//   buy      submit, then show what Safaricom said
//   history  what happened, with a refresh that asks again
//
// If the API is not configured or the app lacks the Dynamic Offers subscription,
// the real message is shown instead of a fake shelf of bundles.

const money = (n, cur = 'KES') => (n == null ? '—' : `${cur} ${Number(n).toLocaleString('en-KE')}`);
const size = (mb) => (mb == null ? null : mb >= 1024 ? `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB` : `${mb} MB`);
const when = (d) => new Date(d).toLocaleString('en-KE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function DataPage() {
  const [msisdn, setMsisdn] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | loading | offers | empty | error | buying | done
  const [offers, setOffers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(null);

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/data/history').catch(() => null);
    if (!res || !res.ok) return;
    const d = await res.json().catch(() => ({}));
    setHistory(d.purchases || []);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function fetchOffers(e) {
    e?.preventDefault();
    setError(null); setResult(null); setSelected(null); setOffers([]);
    setPhase('loading');
    try {
      const res = await fetch('/api/data/offers', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ msisdn }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.ok) {
        setError({ message: d.error || 'Safaricom could not answer.', kind: d.kind, raw: d.raw });
        setPhase('error');
        return;
      }
      setOffers(d.offers || []);
      setPhase((d.offers || []).length ? 'offers' : 'empty');
    } catch {
      setError({ message: 'Could not reach the server.', kind: 'network' });
      setPhase('error');
    }
  }

  async function buy() {
    if (!selected) return;
    setPhase('buying'); setError(null);
    try {
      const res = await fetch('/api/data/purchase', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ msisdn, offer: { id: selected.id, name: selected.name, price: selected.price } }),
      });
      const d = await res.json().catch(() => ({}));
      setResult({ ...d, ok: res.ok && d.ok });
      setPhase('done');
      loadHistory();
    } catch {
      setError({ message: 'Network hiccup — the purchase was not confirmed.', kind: 'network' });
      setPhase('done');
    }
  }

  async function refresh(id) {
    setRefreshing(id);
    try {
      const res = await fetch(`/api/data/purchase/${id}`);
      const d = await res.json().catch(() => ({}));
      if (d.ok && d.status) {
        setHistory((rows) => rows.map((r) => (r.id === id ? { ...r, status: d.status } : r)));
      }
    } finally {
      setRefreshing(null);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 96, paddingBottom: 120 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>— DATA BUNDLES</div>
      <h1 className="display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 10 }}>
        Data, straight from Safaricom.
      </h1>
      <p className="lede" style={{ maxWidth: 560 }}>
        Enter a Safaricom number and we will ask Safaricom what it can sell that line right now —
        bundles, prices and validity exactly as they come back.
      </p>

      <Card style={{ marginTop: 22 }}>
        <form onSubmit={fetchOffers} className="data-form">
          <Field label="Safaricom number" hint="07XX XXX XXX · 01XX XXX XXX · 2547XXXXXXXX">
            <Input
              inputMode="tel" value={msisdn} onChange={(e) => setMsisdn(e.target.value)}
              placeholder="0712 345 678" autoComplete="tel" maxLength={15}
            />
          </Field>
          <Button type="submit" disabled={phase === 'loading' || msisdn.trim().length < 9} icon={<Icons.Wifi size={15} />}>
            {phase === 'loading' ? 'Asking Safaricom…' : 'Fetch offers'}
          </Button>
        </form>
      </Card>

      {phase === 'loading' && (
        <div className="data-grid" style={{ marginTop: 20 }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} h={120} radius={14} />)}
        </div>
      )}

      {phase === 'empty' && (
        <Card style={{ marginTop: 20 }}>
          <p><strong>No offers for that line.</strong></p>
          <p className="muted" style={{ marginTop: 6 }}>
            Safaricom returned an empty offer list, which usually means the account cannot buy
            bundles right now (airtime balance, barred line, or a number not on the Safaricom network).
          </p>
        </Card>
      )}

      {phase === 'error' && error && (
        <Card style={{ marginTop: 20 }}>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error.message}</p>
          {error.kind === 'config' && (
            <p className="muted" style={{ marginTop: 8 }}>
              The Dynamic Offers endpoint has not been entered yet. It comes from your Daraja app&apos;s
              API definition and is pasted in Admin → Settings → Data bundles.
            </p>
          )}
          {error.kind === 'permission' && (
            <p className="muted" style={{ marginTop: 8 }}>
              Your Daraja app is not subscribed to Dynamic Offers. Safaricom has to approve that
              product for the app before any call will succeed.
            </p>
          )}
          {error.raw && (
            <pre className="data-raw">{error.raw}</pre>
          )}
          <Button variant="ghost" size="sm" style={{ marginTop: 12 }} onClick={fetchOffers}>Try again</Button>
        </Card>
      )}

      {(phase === 'offers' || phase === 'buying' || phase === 'done') && offers.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <div className="data-group">
            <Badge tone="brand">live offers</Badge>
            <span>{offers.length} from Safaricom</span>
          </div>
          <div className="data-grid">
            {offers.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`data-offer ${selected?.id === o.id ? 'is-selected' : ''}`}
                onClick={() => setSelected(o)}
                disabled={phase === 'buying'}
              >
                <span className="data-size">{size(o.sizeMb) || o.name}</span>
                <span className="data-name">{o.name}</span>
                <span className="data-meta">
                  {o.validity ? `${o.validity}${/^\d+$/.test(String(o.validity)) ? ' days' : ''}` : '—'}
                </span>
                <span className="data-price">{money(o.price, o.currency)}</span>
              </button>
            ))}
          </div>

          <div className="data-buybar">
            <div>
              {selected ? (
                <>
                  <div className="data-strip-label">Selected</div>
                  <div style={{ fontWeight: 650 }}>{selected.name} · {money(selected.price, selected.currency)}</div>
                </>
              ) : <span className="muted">Choose an offer above.</span>}
            </div>
            <Button onClick={buy} disabled={!selected || phase === 'buying'} icon={<Icons.Send size={15} />}>
              {phase === 'buying' ? 'Submitting…' : 'Buy with M-PESA'}
            </Button>
          </div>
        </section>
      )}

      {phase === 'done' && result && (
        <Card style={{ marginTop: 20 }}>
          <div className="data-result">
            <Badge tone={result.ok && result.status === 'confirmed' ? 'good' : result.ok ? 'warn' : 'bad'}>
              {result.ok ? result.status : 'failed'}
            </Badge>
            <div>
              <div style={{ fontWeight: 700 }}>
                {result.ok
                  ? result.status === 'confirmed' ? 'Purchase confirmed by Safaricom' : 'Submitted — awaiting confirmation'
                  : 'Not completed'}
              </div>
              <div className="muted" style={{ marginTop: 4 }}>
                {result.reference ? `Reference ${result.reference}. ` : ''}
                {result.error || (result.status === 'confirmed' ? 'The bundle is being applied to the number.' : 'Refresh below to check again.')}
              </div>
            </div>
          </div>
          {result.id && (
            <Button variant="ghost" size="sm" style={{ marginTop: 12 }} onClick={() => refresh(result.id)}>
              {refreshing === result.id ? 'Checking…' : 'Refresh status'}
            </Button>
          )}
        </Card>
      )}

      <Card style={{ marginTop: 30 }}>
        <div className="data-group" style={{ marginBottom: 8 }}>
          <Badge tone="neutral">history</Badge>
          <span>{history.length} purchase{history.length === 1 ? '' : 's'}</span>
        </div>
        {history.length === 0 ? (
          <p className="muted">Nothing yet — your purchases will appear here.</p>
        ) : (
          <div className="data-history">
            {history.map((h) => (
              <div key={h.id} className="data-history-row">
                <div>
                  <div style={{ fontWeight: 600 }}>{h.offer_name || 'Bundle'}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {h.msisdn} · {when(h.created_at)} · {money(h.amount)}
                  </div>
                </div>
                <div className="data-history-right">
                  <Badge tone={h.status === 'confirmed' ? 'good' : h.status === 'failed' ? 'bad' : 'warn'}>{h.status}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => refresh(h.id)} disabled={refreshing === h.id}>
                    {refreshing === h.id ? '…' : <Icons.Refresh size={13} />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="muted" style={{ marginTop: 18, fontSize: 12 }}>
        Not sure what to buy? <Link className="link" href="/whatsapp-bot">Talk to us</Link> — or top up your
        wallet first and come back.
      </p>
    </div>
  );
}
