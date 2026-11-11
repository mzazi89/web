'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icons } from '@/components/ui';
import { fmtKes } from '@/lib/currency';
import { authHref } from '@/lib/nextPath';

// MZAZI TECH INC — the catalogue.
//
// One shelf for everything the company sells: panels, VPS, WhatsApp bot plans,
// the developer API and custom builds. Data comes from /api/catalog, which reads
// the same tables the admin panel edits, so prices cannot drift.
//
// Only panels are cart-provisionable. VPS, bot plans and API keys each have
// their own provisioning flow (/vps, /subscription, /api/docs) — routing to them
// is honest; forcing them into one checkout would not be.

const CART_KEY = 'mzazi.panels.cart.v1';

const CATEGORIES = [
  { id: 'all', label: 'Everything' },
  { id: 'panel', label: 'Panels' },
  { id: 'game', label: 'Game' },
  { id: 'vps', label: 'VPS' },
  { id: 'bot', label: 'Bots' },
  { id: 'api', label: 'API' },
  { id: 'service', label: 'Services' },
];

const KIND_LABEL = { panel: 'Panel', vps: 'VPS', bot: 'WhatsApp bot', api: 'Developer API', service: 'Service' };
const KIND_ICON = { panel: Icons.Server, vps: Icons.Cpu, bot: Icons.Bot, api: Icons.Code, service: Icons.Layers };

const priceOf = (item) => {
  if (item?.price == null) return null;
  const base = Number(item.price);
  const pct = Number(item.discount_percent || 0);
  return pct > 0 && pct < 100 ? Math.ceil(base * (1 - pct / 100)) : base;
};

// Sizes arrive as numbers (packages) or free text (VPS, typed by an operator).
const sizeText = (v) => {
  const s = String(v ?? '').trim();
  if (!s) return '—';
  if (/[a-z]/i.test(s)) return s;
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  if (n === 0) return 'Unmetered';
  return n >= 1024 ? `${+(n / 1024).toFixed(1)} GB` : `${n} MB`;
};
const ramText = sizeText;
const diskText = sizeText;
const cpuText = (v) => { const s = String(v ?? '').trim(); if (!s) return '—'; if (/[a-z%]/i.test(s)) return s; const n = Number(s); return n === 0 ? 'Unmetered' : `${n}%`; };

// Every card carries a preview drawn from its own data — a panel window, a
// terminal, a chat thread, a response payload. Nothing implies software the
// customer is not getting.
function Preview({ item, large }) {
  if (item.kind === 'panel') {
    return (
      <div className={`mkt-preview ${large ? '' : 'is-compact'}`} aria-hidden="true">
        <div className="mkt-preview-bar">
          <span className="mkt-dots"><i /><i /><i /></span>
          <span className="mkt-preview-url">panel.mzazi.shop</span>
        </div>
        <div className="mkt-preview-body">
          <div className="mkt-preview-side"><span /><span /><span /><span /></div>
          <div className="mkt-preview-main">
            <div className="mkt-preview-title">{item.name}</div>
            <div className="mkt-preview-chips">
              <span>{ramText(item.specs?.ram)} RAM</span>
              <span>{cpuText(item.specs?.cpu)} CPU</span>
              <span>{diskText(item.specs?.disk)}</span>
            </div>
            <div className="mkt-preview-chart">
              {[38, 62, 48, 74, 58, 86, 66, 92].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (item.kind === 'vps') {
    return (
      <div className={`mkt-preview mkt-visual ${large ? '' : 'is-compact'}`} aria-hidden="true">
        <div className="mkt-preview-bar">
          <span className="mkt-dots"><i /><i /><i /></span>
          <span className="mkt-preview-url">root@{(item.name || 'vps').toLowerCase().replace(/\s+/g, '-')}</span>
        </div>
        <pre className="mkt-term">{`$ df -h /
/dev/vda1 ${diskText(item.specs?.disk)} 41%
$ uptime · ${item.specs?.location || 'EU'}`}</pre>
      </div>
    );
  }

  if (item.kind === 'bot') {
    return (
      <div className={`mkt-preview mkt-visual ${large ? '' : 'is-compact'}`} aria-hidden="true">
        <div className="mkt-preview-bar">
          <span className="mkt-dots"><i /><i /><i /></span>
          <span className="mkt-preview-url">wa.me · linked</span>
        </div>
        <div className="mkt-chat">
          <span className="mkt-bubble is-in">.menu</span>
          <span className="mkt-bubble is-out">{item.specs?.devices === 'Unlimited' ? 'Unlimited devices' : `${item.specs?.devices || 1} devices`} · ready</span>
          <span className="mkt-bubble is-in">.pair</span>
        </div>
      </div>
    );
  }

  if (item.kind === 'api') {
    return (
      <div className={`mkt-preview mkt-visual ${large ? '' : 'is-compact'}`} aria-hidden="true">
        <div className="mkt-preview-bar">
          <span className="mkt-dots"><i /><i /><i /></span>
          <span className="mkt-preview-url">api.mzazi.shop</span>
        </div>
        <pre className="mkt-term">{`GET /v1/… 200 OK
{ "ok": true,
  "endpoints": ${item.specs?.endpoints || 0} }`}</pre>
      </div>
    );
  }

  return (
    <div className={`mkt-preview mkt-visual ${large ? '' : 'is-compact'}`} aria-hidden="true">
      <div className="mkt-preview-bar">
        <span className="mkt-dots"><i /><i /><i /></span>
        <span className="mkt-preview-url">mzazi.shop</span>
      </div>
      <div className="mkt-service-visual"><Icons.Layers size={large ? 26 : 20} /></div>
    </div>
  );
}

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

  const [items, setItems] = useState([]);
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
        const [catRes, me] = await Promise.all([fetch('/api/catalog', { cache: 'no-store' }), fetch('/api/auth/me')]);
        const data = await catRes.json().catch(() => ({}));
        if (!catRes.ok) throw new Error(data.error || 'The catalogue could not be loaded.');
        if (!alive) return;
        setItems(Array.isArray(data.items) ? data.items : []);
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

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (Array.isArray(raw)) setCart(raw.filter((r) => r && typeof r.id === 'string' && Number(r.qty) > 0));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* private mode */ }
  }, [cart]);

  const rows = useMemo(
    () => cart.map((r) => ({ ...items.find((i) => i.id === r.id), id: r.id, qty: r.qty })).filter((r) => r.name),
    [cart, items],
  );
  const units = useMemo(() => rows.flatMap((r) => Array.from({ length: r.qty }, () => r)), [rows]);
  const total = useMemo(() => rows.reduce((s, r) => s + (priceOf(r) || 0) * r.qty, 0), [rows]);
  const count = rows.reduce((s, r) => s + r.qty, 0);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const inCat = cat === 'all'
        || (cat === 'panel' ? i.kind === 'panel' : cat === 'game' ? i.category === 'game' : i.kind === cat);
      const inQ = !q || `${i.name} ${i.description}`.toLowerCase().includes(q);
      return inCat && inQ;
    });
  }, [items, cat, query]);

  const add = (item, silent) => {
    if (item.kind !== 'panel') { router.push(item.href); return; }
    setCart((c) => {
      const hit = c.find((r) => r.id === item.id);
      if (hit) return c.map((r) => (r.id === item.id ? { ...r, qty: Math.min(5, r.qty + 1) } : r));
      return [...c, { id: item.id, qty: 1 }];
    });
    if (!silent) say(`${item.name} added to cart`);
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

    try {
      const res = await fetch('/api/panel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: units[0].ref,
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

    for (const unit of units.slice(1)) {
      try {
        const res = await fetch('/api/panel/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: form.ptero_username, mode: 'different', package_id: unit.ref }),
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

  const closeCheckout = () => { setCheckout(false); setResults(null); setError(''); setEggs([]); };

  const specEntries = (item) => Object.entries(item.specs || {}).filter(([, v]) => v !== null && v !== undefined && v !== '');

  return (
    <div className="container-site mkt">
      <header className="mkt-head">
        <div className="mkt-brand">
          <span className="mkt-wordmark">MZAZI<b>TECH</b><i>INC</i></span>
        </div>
        <div className="mkt-head-actions">
          <button type="button" className={`mkt-icon-btn ${searchOpen ? 'is-on' : ''}`} onClick={() => setSearchOpen((v) => !v)} aria-label="Search" aria-expanded={searchOpen}>
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
          <h1 className="mkt-title">The catalogue</h1>
          <p className="mkt-sub">Panels, VPS, WhatsApp bots and the API — sold from one account.</p>
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
          <input autoFocus className="mkt-search-input" placeholder="Search panels, VPS, bots, API" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search catalogue" />
          {query && <button type="button" className="mkt-clear" onClick={() => setQuery('')} aria-label="Clear search"><Icons.X size={13} /></button>}
        </div>
      )}

      <div className="mkt-chips" role="tablist" aria-label="Categories">
        {CATEGORIES.map((c) => {
          const n = c.id === 'all' ? items.length
            : c.id === 'panel' ? items.filter((i) => i.kind === 'panel').length
            : c.id === 'game' ? items.filter((i) => i.category === 'game').length
            : items.filter((i) => i.kind === c.id).length;
          return (
            <button key={c.id} role="tab" aria-selected={cat === c.id} className={`mkt-chip ${cat === c.id ? 'is-on' : ''}`} onClick={() => setCat(c.id)}>
              {c.label}{n > 0 && <span className="mkt-chip-n">{n}</span>}
            </button>
          );
        })}
      </div>

      {error && <p className="mkt-error" role="alert">{error}</p>}

      {loading ? (
        <div className="mkt-grid">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}</div>
      ) : list.length === 0 ? (
        <div className="mkt-empty">
          <span className="dash-empty-ico"><Icons.Box size={18} /></span>
          <p className="dash-empty-title">{items.length === 0 ? 'The shelf is empty' : 'Nothing in this category yet'}</p>
          <p className="dash-empty-body">{items.length === 0 ? 'No products are published right now.' : 'Try another category, or clear the search.'}</p>
          {(cat !== 'all' || query) && (
            <button type="button" className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => { setCat('all'); setQuery(''); }}>Clear filters</button>
          )}
        </div>
      ) : (
        <div className="mkt-grid">
          {list.map((item) => {
            const price = priceOf(item);
            const off = price != null && Number(item.price) > price;
            const direct = item.kind !== 'panel';
            return (
              <article className="mkt-card" key={item.id}>
                <button type="button" className="mkt-card-preview" onClick={() => setDetail(item)} aria-label={`Preview ${item.name}`}>
                  <Preview item={item} />
                  {off && <span className="mkt-badge is-off">−{Number(item.discount_percent)}%</span>}
                  {item.popular && !off && <span className="mkt-badge">Popular</span>}
                </button>

                <div className="mkt-card-body">
                  <div className="mkt-card-top">
                    <h2 className="mkt-name">{item.name}</h2>
                  </div>
                  <p className="mkt-desc">{item.description}</p>

                  <div className="mkt-price-row">
                    {price == null ? (
                      <span className="mkt-price is-poa">On request</span>
                    ) : price === 0 ? (
                      <span className="mkt-price">Free<small>tier</small></span>
                    ) : (
                      <span className="mkt-price">{fmtKes(price)}<small>{item.kind === 'bot' ? '/30d' : '/mo'}</small></span>
                    )}
                    {off && <s className="mkt-was">{fmtKes(item.price)}</s>}
                  </div>

                  <div className="mkt-card-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDetail(item)}>Details</button>
                    {direct ? (
                      <Link href={item.href} className="btn btn-primary btn-sm">
                        {item.kind === 'api' ? 'Get key' : item.kind === 'vps' ? 'Configure' : item.kind === 'service' ? 'Talk to us' : 'Choose'}
                      </Link>
                    ) : (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => add(item)}>Buy now</button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {<Portal>{detail && (
        <div className="mkt-overlay" role="dialog" aria-modal="true" aria-label={`${detail.name} details`} onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="mkt-sheet mkt-detail">
            <button type="button" className="mkt-close" onClick={() => setDetail(null)} aria-label="Close"><Icons.X size={15} /></button>

            <Preview item={detail} large />

            <div className="mkt-detail-head">
              <div>
                <span className="mkt-kicker">{KIND_LABEL[detail.kind]}</span>
                <h2 className="mkt-detail-title">{detail.name}</h2>
              </div>
              <div className="mkt-detail-price">
                {priceOf(detail) == null ? <b>On request</b> : priceOf(detail) === 0 ? <b>Free</b> : <b>{fmtKes(priceOf(detail))}</b>}
                <span>{detail.kind === 'bot' ? 'per 30 days' : detail.kind === 'panel' ? 'per month' : detail.kind === 'api' ? 'to start' : 'scoped'}</span>
              </div>
            </div>

            <p className="mkt-detail-text">{detail.description}</p>

            {specEntries(detail).length > 0 && (
              <dl className="mkt-specs">
                {specEntries(detail).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k === 'ram' ? 'Memory' : k === 'cpu' ? 'CPU' : k === 'disk' ? 'Disk' : k}</dt>
                    <dd>{k === 'ram' ? ramText(v) : k === 'disk' ? diskText(v) : String(v)}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mkt-detail-cols">
              <div>
                <h3 className="mkt-h3">What's included</h3>
                <ul className="mkt-list">
                  {(detail.kind === 'panel' ? [
                    'Full Pterodactyl control panel',
                    'Root-level file and console access',
                    'One free allocation, extra ports on request',
                    'Backups, databases and schedules',
                    'Wallet billing — no card stored',
                  ] : detail.kind === 'bot' ? [
                    'Your own WhatsApp number, paired in minutes',
                    'All 1,269 commands and group tools',
                    'Runs on our infrastructure, not your phone',
                    'Unlink any device from the dashboard',
                    'Wallet billing — no card stored',
                  ] : detail.kind === 'vps' ? [
                    'NVMe-backed KVM instance',
                    'Full root access over SSH',
                    'Isolated networking and instant resizes',
                    'Kenyan billing, regional placement',
                    'Human support from Nairobi',
                  ] : detail.kind === 'api' ? [
                    'One key for every endpoint',
                    'Daily quotas enforced before the upstream call',
                    'Full request logs with latency',
                    'Rotate or revoke instantly',
                    'Free tier to build against',
                  ] : [
                    'Scoped in writing before work starts',
                    'Direct line to the engineer',
                    'Handover with documentation',
                    'Fixed-price milestones',
                  ]).map((f) => <li key={f}><Icons.Check size={12} /> {f}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="mkt-h3">Requirements</h3>
                <ul className="mkt-list">
                  {(detail.kind === 'panel' ? ['A MZAZI account with wallet balance', 'A panel username and 8+ character password', 'A supported egg (Paper, Node, Python…)']
                    : detail.kind === 'bot' ? ['A MZAZI account with wallet balance', 'A WhatsApp number you control', 'WhatsApp installed to enter the pairing code']
                    : detail.kind === 'vps' ? ['A MZAZI account with wallet balance', 'An SSH key or root password preference', 'A hostname if you want DNS set up']
                    : detail.kind === 'api' ? ['A MZAZI account', 'An API key from the dashboard', 'A client that can send HTTPS requests']
                    : ['A short brief', 'Access to any systems we must integrate']).map((r) => <li key={r}><Icons.Check size={12} /> {r}</li>)}
                </ul>
                <h3 className="mkt-h3" style={{ marginTop: 12 }}>Support</h3>
                <p className="mkt-detail-text" style={{ margin: 0 }}>
                  Handled by a human — <Link href="/help" className="link">open a ticket</Link> and we answer from Nairobi, usually within a few hours.
                </p>
              </div>
            </div>

            {items.filter((i) => i.id !== detail.id && i.kind === detail.kind).length > 0 && (
              <div className="mkt-also">
                <h3 className="mkt-h3">More {KIND_LABEL[detail.kind].toLowerCase()}{detail.kind === 'panel' ? 's' : ' options'}</h3>
                <div className="mkt-also-row">
                  {items.filter((i) => i.id !== detail.id && i.kind === detail.kind).slice(0, 5).map((i) => (
                    <button key={i.id} type="button" className="mkt-also-item" onClick={() => setDetail(i)}>
                      <span>{i.name}</span>{priceOf(i) != null && <b>{fmtKes(priceOf(i))}</b>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mkt-detail-foot">
              {detail.kind === 'panel' ? (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => { add(detail); setDetail(null); setCartOpen(true); }}>Add to cart</button>
                  <button type="button" className="btn btn-primary" onClick={() => { add(detail, true); setDetail(null); openCheckout(); }}>Buy now</button>
                </>
              ) : (
                <Link href={detail.href} className="btn btn-primary" style={{ flex: 1 }}>
                  {detail.kind === 'api' ? 'Create a key' : detail.kind === 'service' ? 'Talk to us' : 'Continue'}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}</Portal>}

      {<Portal>{cartOpen && (
        <div className="mkt-overlay" role="dialog" aria-modal="true" aria-label="Cart" onClick={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}>
          <div className="mkt-sheet mkt-cart">
            <button type="button" className="mkt-close" onClick={() => setCartOpen(false)} aria-label="Close"><Icons.X size={15} /></button>
            <h2 className="mkt-detail-title" style={{ fontSize: 17 }}>Your cart</h2>

            {rows.length === 0 ? (
              <p className="mkt-detail-text">Nothing here yet. Panels can be bought in one checkout; VPS, bots and API keys open their own setup.</p>
            ) : (
              <>
                {rows.map((r) => (
                  <div className="mkt-line" key={r.id}>
                    <div style={{ minWidth: 0 }}>
                      <p className="mkt-line-name">{r.name}</p>
                      <p className="mkt-line-meta">{ramText(r.specs?.ram)} RAM · {cpuText(r.specs?.cpu)} CPU · {diskText(r.specs?.disk)} disk</p>
                    </div>
                    <div className="mkt-qty" role="group" aria-label={`Quantity for ${r.name}`}>
                      <button type="button" onClick={() => setQty(r.id, r.qty - 1)} aria-label="Decrease">−</button>
                      <span>{r.qty}</span>
                      <button type="button" onClick={() => setQty(r.id, r.qty + 1)} aria-label="Increase">+</button>
                    </div>
                    <span className="mkt-line-price">{fmtKes((priceOf(r) || 0) * r.qty)}</span>
                    <button type="button" className="mkt-remove" onClick={() => remove(r.id)} aria-label={`Remove ${r.name}`}><Icons.Trash size={13} /></button>
                  </div>
                ))}

                <div className="mkt-summary">
                  <div><span>Subtotal</span><span>{fmtKes(total)}</span></div>
                  <div><span>Servers</span><span>{count}</span></div>
                  <div className="is-total"><span>Total due today</span><span>{fmtKes(total)}</span></div>
                </div>

                <button type="button" className="btn btn-primary mkt-wide" onClick={openCheckout}>Checkout · {fmtKes(total)}</button>
                <p className="mkt-fineprint">Charged from your wallet. First server creates a new panel account; extras are added to it.</p>
              </>
            )}
          </div>
        </div>
      )}</Portal>}

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
                <p className="mkt-detail-text">{count} server{count === 1 ? '' : 's'} · {fmtKes(total)} from your wallet ({fmtKes(balance)} available).</p>

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
                  {rows.map((r) => <div key={r.id}><span>{r.name} × {r.qty}</span><span>{fmtKes((priceOf(r) || 0) * r.qty)}</span></div>)}
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
