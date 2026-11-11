'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icons } from '@/components/ui';
import { fmtKes } from '@/lib/currency';
import { authHref } from '@/lib/nextPath';

// MZAZI TECH INC — panels marketplace.
//
// Scope is deliberate: this page sells Pterodactyl / hosting panels and nothing
// else. VPS, API keys and WhatsApp plans live on their own pages, so a visitor
// here is never asked to compare unlike things.
//
// Everything on the shelf comes from /api/packages (the same rows the admin
// panel edits). There is no product copy in this file except the taxonomy.
//
// Checkout reuses the real provisioning path: the first unit in the cart creates
// a panel through /api/panel/create, every further unit is an additional server
// on that same panel account via /api/panel/add. Both debit the wallet, so the
// cart can never quote a total the platform will not charge.

const CART_KEY = 'mzazi.panels.cart.v1';

const CATEGORIES = [
  { id: 'all', label: 'All panels' },
  { id: 'pterodactyl', label: 'Pterodactyl' },
  { id: 'game', label: 'Game panels' },
  { id: 'hosting', label: 'Hosting management' },
  { id: 'reseller', label: 'Reseller' },
];

const priceOf = (p) => {
  const base = Number(p?.price || 0);
  const pct = Number(p?.discount_percent || 0);
  return pct > 0 && pct < 100 ? Math.ceil(base * (1 - pct / 100)) : base;
};
const wasOf = (p) => Number(p?.price || 0);

const ramText = (v) => { const n = Number(v) || 0; return n === 0 ? 'Unmetered' : n >= 1024 ? `${+(n / 1024).toFixed(1)} GB` : `${n} MB`; };
const diskText = (v) => { const n = Number(v) || 0; return n === 0 ? 'Unmetered' : n >= 1024 ? `${+(n / 1024).toFixed(1)} GB` : `${n} MB`; };
const cpuText = (v) => { const n = Number(v) || 0; return n === 0 ? 'Unmetered' : `${n}%`; };

// A panel "screenshot" drawn from the package's own numbers. No stock art, no
// fake screenshots of software the customer is not getting.
function PanelPreview({ pkg, compact }) {
  const bars = [38, 62, 48, 74, 58, 86, 66, 92];
  return (
    <div className={`mkt-preview ${compact ? 'is-compact' : ''}`} aria-hidden="true">
      <div className="mkt-preview-bar">
        <span className="mkt-dots"><i /><i /><i /></span>
        <span className="mkt-preview-url">panel.mzazi.shop</span>
      </div>
      <div className="mkt-preview-body">
        <div className="mkt-preview-side">
          <span /><span /><span /><span />
        </div>
        <div className="mkt-preview-main">
          <div className="mkt-preview-title">{pkg.name}</div>
          <div className="mkt-preview-chips">
            <span>{ramText(pkg.ram)} RAM</span>
            <span>{cpuText(pkg.cpu)} CPU</span>
            <span>{diskText(pkg.disk)}</span>
          </div>
          <div className="mkt-preview-chart">
            {bars.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Modals portal to <body>: .app-content establishes a stacking context, so an
// overlay rendered inside it can never rise above the fixed dock on mobile.
function Portal({ children }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return createPortal(children, document.body);
}

function Skeleton() {
  return (
    <div className="mkt-card mkt-skel" aria-hidden="true">
      <div className="sk sk-preview" />
      <div className="sk sk-line" style={{ width: '62%' }} />
      <div className="sk sk-line" style={{ width: '88%' }} />
      <div className="sk sk-line" style={{ width: '40%' }} />
    </div>
  );
}

export default function ProductsPage() {
  const router = useRouter();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState('');
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);

  // checkout
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({ firstname: '', lastname: '', ptero_username: '', ptero_password: '', nest_id: '', egg_id: '' });
  const [nests, setNests] = useState([]);
  const [eggs, setEggs] = useState([]);
  const [busy, setBusy] = useState('');
  const [results, setResults] = useState(null);

  const say = (msg) => {
    setToast(msg);
    window.clearTimeout(say._t);
    say._t = window.setTimeout(() => setToast(''), 2600);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [pkgRes, me] = await Promise.all([fetch('/api/packages', { cache: 'no-store' }), fetch('/api/auth/me')]);
        const data = await pkgRes.json().catch(() => ({}));
        if (!pkgRes.ok) throw new Error(data.error || 'The catalogue could not be loaded.');
        if (!alive) return;
        setPackages(Array.isArray(data.packages) ? data.packages : []);
        if (me.ok) {
          const d = await me.json().catch(() => ({}));
          setUser(d.user || null);
          if (d.user) {
            setForm((f) => ({ ...f, firstname: f.firstname || d.user.firstname || '', lastname: f.lastname || d.user.lastname || '' }));
            const w = await fetch('/api/wallet/balance');
            if (w.ok) { const wd = await w.json().catch(() => ({})); setBalance(Number(wd.balance || 0)); }
          }
        }
      } catch (e) {
        if (alive) setError(e.message || 'Something went wrong loading the shelf.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Cart survives reloads; ids are re-validated against the live catalogue so a
  // deleted package never sits in a basket forever.
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (Array.isArray(raw)) setCart(raw.filter((r) => r && Number(r.id)));
    } catch { /* ignore a corrupted basket */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* private mode */ }
  }, [cart]);

  const rows = useMemo(
    () => cart.map((r) => ({ ...packages.find((p) => p.id === r.id), id: r.id, qty: r.qty })).filter((r) => r.name),
    [cart, packages],
  );
  const units = useMemo(() => rows.flatMap((r) => Array.from({ length: r.qty }, () => r)), [rows]);
  const total = useMemo(() => rows.reduce((s, r) => s + priceOf(r) * r.qty, 0), [rows]);
  const count = rows.reduce((s, r) => s + r.qty, 0);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return packages.filter((p) => {
      const inCat = cat === 'all' || (p.category || 'pterodactyl') === cat;
      const inQ = !q || `${p.name} ${p.description || ''}`.toLowerCase().includes(q);
      return inCat && inQ;
    });
  }, [packages, cat, query]);

  const add = (pkg, silent) => {
    setCart((c) => {
      const hit = c.find((r) => r.id === pkg.id);
      if (hit) return c.map((r) => (r.id === pkg.id ? { ...r, qty: Math.min(5, r.qty + 1) } : r));
      return [...c, { id: pkg.id, qty: 1 }];
    });
    if (!silent) say(`${pkg.name} added to cart`);
  };

  const setQty = (id, qty) => setCart((c) => c.map((r) => (r.id === id ? { ...r, qty: Math.max(1, Math.min(5, qty)) } : r)));
  const remove = (id) => setCart((c) => c.filter((r) => r.id !== id));

  const openCheckout = async () => {
    if (!units.length) return;
    if (!user) { router.push(authHref('/products')); return; }
    setCartOpen(false);
    setResults(null);
    setCheckout(true);
    if (!nests.length) {
      setBusy('nests');
      try {
        const res = await fetch('/api/panel/nests');
        const d = await res.json().catch(() => ({}));
        if (res.ok) setNests(d.nests || []);
        else setError(d.error || 'Could not load server types.');
      } finally { setBusy(''); }
    }
  };

  const loadEggs = async (nestId) => {
    setForm((f) => ({ ...f, nest_id: nestId, egg_id: '' }));
    setEggs([]);
    if (!nestId) return;
    setBusy('eggs');
    try {
      const res = await fetch(`/api/panel/eggs?nest_id=${nestId}`);
      const d = await res.json().catch(() => ({}));
      if (res.ok) setEggs(d.eggs || []);
    } finally { setBusy(''); }
  };

  const deploy = async (e) => {
    e.preventDefault();
    if (!form.firstname || !form.lastname || !form.ptero_username || form.ptero_password.length < 8 || !form.nest_id || !form.egg_id) {
      setError('Fill every field — the panel password needs at least 8 characters.');
      return;
    }
    if (total > balance) {
      setError(`Your wallet holds ${fmtKes(balance)} and this order is ${fmtKes(total)}. Top up first.`);
      return;
    }

    setError('');
    setBusy('deploy');
    const log = [];

    // 1. The first unit creates the panel account.
    try {
      const res = await fetch('/api/panel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: units[0].id,
          ptero_username: form.ptero_username,
          ptero_password: form.ptero_password,
          firstname: form.firstname,
          lastname: form.lastname,
          nest_id: form.nest_id,
          egg_id: form.egg_id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'The panel could not be created.');
      log.push({ ok: true, label: `${units[0].name} · primary panel`, detail: data.panel?.panel_url || '' });
    } catch (err) {
      setBusy('');
      setError(err.message);
      setResults({ failed: true, log });
      return;
    }

    // 2. Anything else is an extra server on that same panel account — the
    //    platform's own "add server" path, which charges full package price.
    for (const unit of units.slice(1)) {
      try {
        const res = await fetch('/api/panel/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: form.ptero_username, mode: 'different', package_id: unit.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Server could not be added.');
        log.push({ ok: true, label: `${unit.name} · extra server`, detail: data.server_id ? `server #${data.server_id}` : '' });
      } catch (err) {
        log.push({ ok: false, label: `${unit.name} · extra server`, detail: err.message });
      }
    }

    setBusy('');
    setResults({ failed: log.some((l) => !l.ok), log });
    setCart([]);
    const w = await fetch('/api/wallet/balance');
    if (w.ok) { const wd = await w.json().catch(() => ({})); setBalance(Number(wd.balance || 0)); }
  };

  const closeCheckout = () => {
    setCheckout(false);
    setResults(null);
    setError('');
    setEggs([]);
  };

  return (
    <div className="container-site mkt">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="mkt-head">
        <div className="mkt-brand">
          <span className="mkt-wordmark">MZAZI<b>TECH</b><i>INC</i></span>
        </div>

        <div className="mkt-head-actions">
          <button
            type="button"
            className={`mkt-icon-btn ${searchOpen ? 'is-on' : ''}`}
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search panels"
            aria-expanded={searchOpen}
          >
            <Icons.Search size={16} />
          </button>
          <button type="button" className="mkt-icon-btn" onClick={() => setCartOpen(true)} aria-label={`Cart, ${count} items`}>
            <Icons.Cart size={16} />
            {count > 0 && <span className="mkt-cart-count">{count}</span>}
          </button>
        </div>
      </header>

      <div className="mkt-title-row">
        <div>
          <h1 className="mkt-title">Premium Panels</h1>
          <p className="mkt-sub">Powerful hosting management solutions.</p>
        </div>
        {user ? (
          <span className="mkt-wallet"><Icons.Wallet size={12} /> {fmtKes(balance)}</span>
        ) : (
          <Link href={authHref('/products')} className="btn btn-ghost btn-sm">Sign in</Link>
        )}
      </div>

      {searchOpen && (
        <div className="mkt-search">
          <Icons.Search size={14} />
          <input
            autoFocus
            className="mkt-search-input"
            placeholder="Search panels — name or spec"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search panels"
          />
          {query && <button type="button" className="mkt-clear" onClick={() => setQuery('')} aria-label="Clear search"><Icons.X size={13} /></button>}
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="mkt-chips" role="tablist" aria-label="Panel categories">
        {CATEGORIES.map((c) => {
          const n = c.id === 'all' ? packages.length : packages.filter((p) => (p.category || 'pterodactyl') === c.id).length;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={cat === c.id}
              className={`mkt-chip ${cat === c.id ? 'is-on' : ''}`}
              onClick={() => setCat(c.id)}
            >
              {c.label}
              {n > 0 && <span className="mkt-chip-n">{n}</span>}
            </button>
          );
        })}
      </div>

      {error && <p className="mkt-error" role="alert">{error}</p>}

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="mkt-grid">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}</div>
      ) : list.length === 0 ? (
        <div className="mkt-empty">
          <span className="dash-empty-ico"><Icons.Box size={18} /></span>
          <p className="dash-empty-title">{packages.length === 0 ? 'The shelf is empty' : 'Nothing in this category yet'}</p>
          <p className="dash-empty-body">
            {packages.length === 0
              ? 'No panels are published right now. New stock is added from the admin catalogue.'
              : 'Try another category, or clear the search to see every panel.'}
          </p>
          {(cat !== 'all' || query) && (
            <button type="button" className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => { setCat('all'); setQuery(''); }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="mkt-grid">
          {list.map((p) => {
            const price = priceOf(p);
            const off = wasOf(p) > price;
            const popular = Number(p.popular) === 1 || p.popular === true;
            return (
              <article className="mkt-card" key={p.id}>
                <button type="button" className="mkt-card-preview" onClick={() => setDetail(p)} aria-label={`Preview ${p.name}`}>
                  <PanelPreview pkg={p} compact />
                  {off && <span className="mkt-badge is-off">−{Number(p.discount_percent)}%</span>}
                  {popular && !off && <span className="mkt-badge">Popular</span>}
                </button>

                <div className="mkt-card-body">
                  <div className="mkt-card-top">
                    <h2 className="mkt-name">{p.name}</h2>
                    <span className="mkt-live"><i />Available</span>
                  </div>
                  <p className="mkt-desc">{p.description || `${ramText(p.ram)} RAM · ${cpuText(p.cpu)} CPU · ${diskText(p.disk)} disk`}</p>

                  <div className="mkt-price-row">
                    <span className="mkt-price">{fmtKes(price)}<small>/mo</small></span>
                    {off && <s className="mkt-was">{fmtKes(wasOf(p))}</s>}
                  </div>

                  <div className="mkt-card-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetail(p)}>Details</button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => add(p)}>Buy now</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Details ────────────────────────────────────────────────────── */}
      {<Portal>{detail && (
        <div className="mkt-overlay" role="dialog" aria-modal="true" aria-label={`${detail.name} details`} onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="mkt-sheet mkt-detail">
            <button type="button" className="mkt-close" onClick={() => setDetail(null)} aria-label="Close"><Icons.X size={15} /></button>

            <PanelPreview pkg={detail} />

            <div className="mkt-detail-head">
              <div>
                <span className="mkt-kicker">{CATEGORIES.find((c) => c.id === (detail.category || 'pterodactyl'))?.label || 'Panel'}</span>
                <h2 className="mkt-detail-title">{detail.name}</h2>
              </div>
              <div className="mkt-detail-price">
                <b>{fmtKes(priceOf(detail))}</b>
                <span>per month</span>
              </div>
            </div>

            <p className="mkt-detail-text">
              {detail.description || `A ${detail.name} panel on our managed Pterodactyl infrastructure.`} Provisioned with your own credentials, isolated allocations and a control panel you can hand to a team.
            </p>

            <dl className="mkt-specs">
              <div><dt>Memory</dt><dd>{ramText(detail.ram)}</dd></div>
              <div><dt>CPU</dt><dd>{cpuText(detail.cpu)}</dd></div>
              <div><dt>Disk</dt><dd>{diskText(detail.disk)}</dd></div>
              <div><dt>Panel</dt><dd>Pterodactyl</dd></div>
              <div><dt>Billing</dt><dd>Monthly · wallet</dd></div>
              <div><dt>Provisioning</dt><dd>Instant</dd></div>
            </dl>

            <div className="mkt-detail-cols">
              <div>
                <h3 className="mkt-h3">What's included</h3>
                <ul className="mkt-list">
                  <li><Icons.Check size={12} /> Full Pterodactyl control panel</li>
                  <li><Icons.Check size={12} /> Root-level file and console access</li>
                  <li><Icons.Check size={12} /> One free allocation, extra ports on request</li>
                  <li><Icons.Check size={12} /> Backups, databases and schedules</li>
                  <li><Icons.Check size={12} /> Wallet billing — no card stored</li>
                </ul>
              </div>
              <div>
                <h3 className="mkt-h3">Requirements</h3>
                <ul className="mkt-list">
                  <li><Icons.Check size={12} /> A MZAZI account with wallet balance</li>
                  <li><Icons.Check size={12} /> A panel username and 8+ character password</li>
                  <li><Icons.Check size={12} /> A supported egg (Paper, Node, Python…)</li>
                </ul>
                <h3 className="mkt-h3" style={{ marginTop: 12 }}>Support</h3>
                <p className="mkt-detail-text" style={{ margin: 0 }}>
                  Panel issues are handled by a human — <Link href="/help" className="link">open a ticket</Link> and we answer from Nairobi, usually within a few hours.
                </p>
              </div>
            </div>

            {packages.filter((p) => p.id !== detail.id).length > 0 && (
              <div className="mkt-also">
                <h3 className="mkt-h3">Available packages</h3>
                <div className="mkt-also-row">
                  {packages.filter((p) => p.id !== detail.id).slice(0, 5).map((p) => (
                    <button key={p.id} type="button" className="mkt-also-item" onClick={() => setDetail(p)}>
                      <span>{p.name}</span>
                      <b>{fmtKes(priceOf(p))}</b>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mkt-detail-foot">
              <button type="button" className="btn btn-ghost" onClick={() => { add(detail); setDetail(null); setCartOpen(true); }}>Add to cart</button>
              <button type="button" className="btn btn-primary" onClick={() => { setDetail(null); add(detail, true); openCheckout(); }}>Buy now</button>
            </div>
          </div>
        </div>
      )}</Portal>}

      {/* ── Cart ───────────────────────────────────────────────────────── */}
      {<Portal>{cartOpen && (
        <div className="mkt-overlay" role="dialog" aria-modal="true" aria-label="Cart" onClick={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}>
          <div className="mkt-sheet mkt-cart">
            <button type="button" className="mkt-close" onClick={() => setCartOpen(false)} aria-label="Close"><Icons.X size={15} /></button>
            <h2 className="mkt-detail-title" style={{ fontSize: 17 }}>Your cart</h2>

            {rows.length === 0 ? (
              <p className="mkt-detail-text">Nothing here yet. Pick a panel and it will show up in this tray.</p>
            ) : (
              <>
                {rows.map((r) => (
                  <div className="mkt-line" key={r.id}>
                    <div style={{ minWidth: 0 }}>
                      <p className="mkt-line-name">{r.name}</p>
                      <p className="mkt-line-meta">{ramText(r.ram)} RAM · {cpuText(r.cpu)} CPU · {diskText(r.disk)} disk</p>
                    </div>
                    <div className="mkt-qty" role="group" aria-label={`Quantity for ${r.name}`}>
                      <button type="button" onClick={() => setQty(r.id, r.qty - 1)} aria-label="Decrease">−</button>
                      <span>{r.qty}</span>
                      <button type="button" onClick={() => setQty(r.id, r.qty + 1)} aria-label="Increase">+</button>
                    </div>
                    <span className="mkt-line-price">{fmtKes(priceOf(r) * r.qty)}</span>
                    <button type="button" className="mkt-remove" onClick={() => remove(r.id)} aria-label={`Remove ${r.name}`}><Icons.Trash size={13} /></button>
                  </div>
                ))}

                <div className="mkt-summary">
                  <div><span>Subtotal</span><span>{fmtKes(total)}</span></div>
                  <div><span>Servers</span><span>{count}</span></div>
                  <div className="is-total"><span>Total due today</span><span>{fmtKes(total)}</span></div>
                </div>

                <button type="button" className="btn btn-primary mkt-wide" onClick={openCheckout}>
                  Checkout · {fmtKes(total)}
                </button>
                <p className="mkt-fineprint">
                  Charged from your wallet. First server creates a new panel account; extras are added to it.
                </p>
              </>
            )}
          </div>
        </div>
      )}</Portal>}

      {/* ── Checkout ───────────────────────────────────────────────────── */}
      {<Portal>{checkout && (
        <div className="mkt-overlay" role="dialog" aria-modal="true" aria-label="Checkout">
          <div className="mkt-sheet mkt-detail">
            <button type="button" className="mkt-close" onClick={closeCheckout} aria-label="Close"><Icons.X size={15} /></button>

            {results ? (
              <>
                <h2 className="mkt-detail-title" style={{ fontSize: 17 }}>{results.failed ? 'Order partially completed' : 'Order complete'}</h2>
                <p className="mkt-detail-text">
                  {results.failed
                    ? 'Some servers could not be provisioned. Anything that succeeded has already been charged; failed items were not.'
                    : 'Your panel is live. Credentials are in the dashboard under My services.'}
                </p>
                <ul className="mkt-list">
                  {results.log.map((l, i) => (
                    <li key={i} style={{ color: l.ok ? 'var(--good)' : 'var(--bad)' }}>
                      {l.ok ? <Icons.Check size={12} /> : <Icons.AlertCircle size={12} />}
                      <span>{l.label}{l.detail ? ` — ${l.detail}` : ''}</span>
                    </li>
                  ))}
                </ul>
                <div className="mkt-detail-foot">
                  <button type="button" className="btn btn-ghost" onClick={closeCheckout}>Close</button>
                  <Link href="/dashboard/services" className="btn btn-primary">Open dashboard</Link>
                </div>
              </>
            ) : (
              <form onSubmit={deploy}>
                <h2 className="mkt-detail-title" style={{ fontSize: 17 }}>Checkout</h2>
                <p className="mkt-detail-text">
                  {count} server{count === 1 ? '' : 's'} · {fmtKes(total)} from your wallet ({fmtKes(balance)} available).
                </p>

                <div className="mkt-form">
                  <label className="field"><span className="field-label">First name</span><input className="input" value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} required /></label>
                  <label className="field"><span className="field-label">Last name</span><input className="input" value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} required /></label>
                  <label className="field"><span className="field-label">Panel username</span><input className="input" value={form.ptero_username} onChange={(e) => setForm({ ...form, ptero_username: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })} required /></label>
                  <label className="field"><span className="field-label">Panel password</span><input className="input" type="password" minLength={8} value={form.ptero_password} onChange={(e) => setForm({ ...form, ptero_password: e.target.value })} required /></label>
                  <label className="field">
                    <span className="field-label">Server type</span>
                    <select className="input" value={form.nest_id} onChange={(e) => loadEggs(e.target.value)} required>
                      <option value="">{busy === 'nests' ? 'Loading…' : 'Select a category'}</option>
                      {nests.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field-label">Software</span>
                    <select className="input" value={form.egg_id} onChange={(e) => setForm({ ...form, egg_id: e.target.value })} required>
                      <option value="">{busy === 'eggs' ? 'Loading…' : 'Select software'}</option>
                      {eggs.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </label>
                </div>

                {error && <p className="mkt-error" role="alert">{error}</p>}

                <div className="mkt-summary">
                  {rows.map((r) => <div key={r.id}><span>{r.name} × {r.qty}</span><span>{fmtKes(priceOf(r) * r.qty)}</span></div>)}
                  <div className="is-total"><span>Total</span><span>{fmtKes(total)}</span></div>
                </div>

                <div className="mkt-detail-foot">
                  <Link href="/wallet" className="btn btn-ghost">Top up</Link>
                  <button type="submit" className="btn btn-primary" disabled={busy === 'deploy'}>
                    {busy === 'deploy' ? 'Provisioning…' : `Pay ${fmtKes(total)}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}</Portal>}

      {toast && <div className="mkt-toast" role="status">{toast}</div>}
    </div>
  );
}
