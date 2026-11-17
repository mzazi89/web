'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Icons, Ring } from '@/components/ui';

// MZAZI TECH — temporary numbers.
//
// Country → service → number, with the real price shown before anything is
// bought. The price comes from the provider's live stock, so it cannot go stale
// behind a hardcoded table.
//
// Receiving requires a provider key; browsing does not. When the key is missing
// the page says so instead of showing numbers that can never receive.

const money = (v) => (v == null ? '—' : `$${Number(v).toFixed(3)}`);

export default function TempNumberPage() {
  const [countries, setCountries] = useState([]);
  const [services, setServices] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [country, setCountry] = useState('kenya');
  const [service, setService] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const poll = useRef(null);

  useEffect(() => {
    fetch('/api/temp-number?action=countries', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) { setNote(d.error); return; }
        setCountries(d.countries || []);
        setConfigured(Boolean(d.configured));
        if (d.countries?.length && !d.countries.some((c) => c.country === country)) {
          setCountry(d.countries[0].country);
        }
      })
      .catch(() => setNote('Could not load the provider catalogue.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!country) return;
    setService('');
    setServices([]);
    fetch(`/api/temp-number?action=services&country=${encodeURIComponent(country)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setServices(d.services || []))
      .catch(() => setNote('Could not load services for that country.'));
  }, [country]);

  // Poll only while an order is open.
  useEffect(() => {
    if (!order || order.code || /CANCEL|FINISH|TIMEOUT/i.test(order.status || '')) return undefined;
    poll.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/temp-number/${order.sid}`, { cache: 'no-store' });
        const d = await r.json();
        if (r.ok) setOrder((prev) => ({ ...prev, ...d }));
      } catch {}
    }, 5000);
    return () => clearInterval(poll.current);
  }, [order]);

  async function buyNumber() {
    if (!service) return;
    setBusy(true); setNote('');
    try {
      const res = await fetch('/api/temp-number', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'buy', country, service }),
      });
      const d = await res.json();
      if (!res.ok) { setNote(d?.error || 'Could not get a number.'); return; }
      setOrder({ ...d.order, code: null });
    } catch { setNote('Network error — try again.'); }
    finally { setBusy(false); }
  }

  async function cancelOrder() {
    if (!order) return;
    setBusy(true);
    try {
      await fetch('/api/temp-number', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', sid: order.sid }),
      });
      setOrder((prev) => ({ ...prev, status: 'CANCELED' }));
    } finally { setBusy(false); }
  }

  async function copyPhone() {
    try { await navigator.clipboard.writeText(order.phone); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  const chosen = useMemo(() => services.find((s) => s.service === service), [services, service]);
  const label = (id) => id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="wrap" style={{ paddingTop: 22, paddingBottom: 40 }}>
      <section className="anim-fade-up d1">
        <p className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--dim)' }}>Free tool</p>
        <h1 className="section-title" style={{ marginTop: 6 }}>Temporary number</h1>
        <p className="lede mt-3" style={{ maxWidth: 620 }}>
          A real number that receives one SMS, so you can verify an account without giving out your own.
          Prices are live — you see the cost before you take it.
        </p>
      </section>

      {!configured && (
        <p className="tm-note" style={{ borderColor: 'rgba(247,201,72,.35)', background: 'rgba(247,201,72,.10)' }}>
          Receiving is not connected yet. Browsing works; taking a number needs the provider key in
          Admin → Settings.
        </p>
      )}
      {note && <p className="tm-note">{note}</p>}

      {loading ? (
        <div className="tm-loading"><Ring size={24} /><span>Loading the catalogue…</span></div>
      ) : (
        <>
          <Card className="tn-form anim-fade-up d2">
            <label>
              <span>Country</span>
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                {countries.map((c) => (
                  <option key={c.country} value={c.country}>
                    {c.label || label(c.country)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Service</span>
              <select value={service} onChange={(e) => setService(e.target.value)}>
                <option value="">Choose a service…</option>
                {services.map((s) => (
                  <option key={s.service} value={s.service}>
                    {label(s.service)} — {money(s.price)} · {s.stock} left
                  </option>
                ))}
              </select>
            </label>

            <div className="tn-buy">
              <div className="tn-price">
                <span>Price</span>
                <strong>{money(chosen?.price)}</strong>
              </div>
              <Button onClick={buyNumber} loading={busy} disabled={!service || !configured} icon={<Icons.Phone size={15} />}>
                Get a number
              </Button>
            </div>
          </Card>

          {order && (
            <Card className="tn-order anim-fade-up d3">
              <div className="tn-order-top">
                <div>
                  <span className="tm-label">Your number</span>
                  <code className="tm-code">{order.phone}</code>
                </div>
                <Button size="sm" variant="ghost" onClick={copyPhone} icon={<Icons.Copy size={13} />}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>

              <div className="tn-status">
                <span className={`tm-badge ${order.code ? 'is-good' : ''}`}>{order.status || 'PENDING'}</span>
                <span className="tm-hint">
                  {order.code ? 'SMS received' : 'Waiting for the SMS — this page checks every 5 seconds'}
                </span>
              </div>

              {order.code ? (
                <pre className="tn-code">{order.code}</pre>
              ) : (
                <div className="tm-loading"><Ring size={18} /><span>Listening…</span></div>
              )}

              {!order.code && (
                <Button size="sm" variant="ghost" onClick={cancelOrder} loading={busy} icon={<Icons.X size={13} />}>
                  Cancel and release the number
                </Button>
              )}
            </Card>
          )}

          {!order && services.length === 0 && (
            <p className="tm-note">No stock for that country right now — try another one.</p>
          )}
        </>
      )}
    </div>
  );
}
