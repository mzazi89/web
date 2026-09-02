'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fmtKes } from '@/lib/currency';

const METHODS = [
  { id: 'card', label: 'Card', icon: '💳', hint: 'Visa / Mastercard' },
  { id: 'mpesa', label: 'M-PESA', icon: '📲', hint: 'STK push to your phone' },
  { id: 'airtel', label: 'Airtel Money', icon: '📡', hint: 'USSD / Airtel Money' },
  { id: 'mpesa_till', label: 'M-PESA Till', icon: '🏪', hint: 'Pay via Till number' },
];

const NEEDS_PHONE = ['mpesa', 'airtel'];
const NEEDS_TILL = ['mpesa_till'];

function copyText(t) {
  if (navigator.clipboard) navigator.clipboard.writeText(t).catch(() => {});
}

function VpsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // purchase modal state
  const [pkg, setPkg] = useState(null);          // selected package
  const [step, setStep] = useState('method');    // method → pay → waiting → done
  const [method, setMethod] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [till, setTill] = useState('');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [ref, setRef] = useState(null);
  const [displayText, setDisplayText] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [vps, setVps] = useState(null);          // revealed credentials
  const [showPass, setShowPass] = useState(false);
  const [notice, setNotice] = useState('');

  const closeModal = useCallback(() => {
    setPkg(null); setStep('method'); setError(''); setRef(null); setDisplayText(null); setVps(null);
  }, []);

  const init = useCallback(async () => {
    try {
      const [meRes, pkgRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/vps/packages', { cache: 'no-store' }),
      ]);
      if (meRes.ok) { const d = await meRes.json(); setUser(d.user || null); }
      if (pkgRes.ok) { const d = await pkgRes.json(); setPackages(d.packages || []); }
    } catch { /* ignore */ } finally { setLoading(false); }

    // Card callback (or deep link): reveal the paid VPS.
    const reference = searchParams.get('reference');
    const success = searchParams.get('success');
    const err = searchParams.get('error');
    if (err) setNotice({ type: 'error', text: err === 'stock' ? 'Payment received but no instance was available — support will refund you.' : 'Payment could not be completed. Please try again.' });
    if (reference && (success || true)) {
      try {
        const res = await fetch(`/api/vps/status?reference=${encodeURIComponent(reference)}`);
        const data = await res.json();
        if (res.ok && data.status === 'success' && data.vps) {
          setVps(data.vps);
          setNotice({ type: 'success', text: '✅ Payment confirmed — your VPS is ready below!' });
        }
      } catch { /* ignore */ }
    }
  }, [searchParams]);

  useEffect(() => { init(); }, [init]);

  // countdown + polling while a mobile-money charge is outstanding
  useEffect(() => {
    if (!ref || vps) return;
    const iv = setInterval(async () => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(iv); return 0; }
        return s - 1;
      });
      try {
        const res = await fetch(`/api/vps/status?reference=${encodeURIComponent(ref)}`);
        const data = await res.json();
        if (res.ok && data.status === 'success' && data.vps) {
          setVps(data.vps);
          setStep('done');
          clearInterval(iv);
        } else if (data.status === 'failed') {
          setError(data.error || 'Payment failed. Please try again.');
          clearInterval(iv);
          setStep('method');
          setRef(null);
        } else if (data.status === 'out_of_stock') {
          setError(data.error || 'Out of stock at fulfillment — support will refund you.');
          clearInterval(iv);
          setStep('method');
          setRef(null);
        }
      } catch { /* transient — keep polling */ }
    }, 5000);
    return () => clearInterval(iv);
  }, [ref, vps]);

  const openBuy = (p) => {
    if (!user) { router.push('/login?next=/vps'); return; }
    setPkg(p); setStep('method'); setMethod('mpesa'); setPhone(''); setTill(''); setError(''); setRef(null); setVps(null);
  };

  const startPayment = async () => {
    setError('');
    if (NEEDS_PHONE.includes(method) && !phone.trim()) { setError('Enter your M-PESA / Airtel phone number.'); return; }
    if (NEEDS_TILL.includes(method) && !till.trim()) { setError('Enter the Till number you are paying to.'); return; }
    setPaying(true);
    try {
      const res = await fetch('/api/vps/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          paymentMethod: method,
          phoneNumber: phone.trim(),
          tillNumber: till.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not start payment.'); setPaying(false); return; }

      if (data.flow === 'redirect') {
        // Card → Paystack checkout
        window.location.href = data.authorization_url;
        return;
      }

      // Mobile money → STK/USSD prompt on their phone
      setRef(data.reference);
      setDisplayText(data.displayText);
      setSecondsLeft(180);
      setStep('waiting');
    } catch { setError('Network error — please try again.'); }
    setPaying(false);
  };

  const specRows = (p) => [
    { k: 'RAM', v: p.ram || '—' },
    { k: 'CPU', v: p.cpu || '—' },
    { k: 'Storage', v: p.disk || '—' },
    { k: 'Bandwidth', v: p.bandwidth || '—' },
    { k: 'Location', v: p.location || '—' },
    { k: 'OS', v: p.os || 'Linux' },
  ];

  const mm = (s) => (s < 10 ? `0${s}` : `${s}`);

  return (
    <div className="page-shell">
      {/* ── Page header ── */}
      <div className="mb-8">
        <p className="eyebrow">MZAZI TECH · VPS</p>
        <h1 className="display mt-2" style={{ color: '#E9E7E2' }}>VPS Servers</h1>
        <p className="lede mt-3" style={{ maxWidth: 620 }}>
          Raw, full-access virtual servers with instant credentials. Pay with M-PESA, Airtel, Till or Card —
          your login details are revealed the moment payment is confirmed and saved to your dashboard.
        </p>
      </div>

      {notice && (
        <div className={`mb-6 px-4 py-3 text-sm`} style={{ borderRadius: 8, background: notice.type === 'success' ? 'rgba(62,207,142,0.08)' : 'rgba(229,72,77,0.08)', border: `1px solid ${notice.type === 'success' ? 'rgba(62,207,142,0.3)' : 'rgba(229,72,77,0.3)'}`, color: notice.type === 'success' ? '#3ECF8E' : '#E5484D' }}>
          {notice.text}
        </div>
      )}

      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center"><div className="spinner" /></div>
      ) : packages.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: '#79818A' }}>No VPS packages available right now — check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {packages.map((p) => (
            <div key={p.id} className="card p-6 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold" style={{ color: '#E9E7E2' }}>{p.name}</h3>
                  {p.description && <p className="text-xs mt-1" style={{ color: '#79818A', lineHeight: 1.5 }}>{p.description}</p>}
                </div>
                <span className="mono text-[9px] uppercase tracking-[0.14em] px-2 py-1" style={{ background: Number(p.stock) > 0 ? 'rgba(62,207,142,0.1)' : 'rgba(229,72,77,0.1)', color: Number(p.stock) > 0 ? '#3ECF8E' : '#E5484D', borderRadius: 4, whiteSpace: 'nowrap' }}>
                  {Number(p.stock) > 0 ? `${p.stock} in stock` : 'Sold out'}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {specRows(p).map((r) => (
                  <div key={r.k} className="flex items-center justify-between text-xs">
                    <span className="mono uppercase tracking-wider" style={{ color: '#4C535B' }}>{r.k}</span>
                    <span style={{ color: '#AEB5BD' }}>{r.v}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                <div>
                  <div className="mono text-lg font-bold" style={{ color: '#F2A93B' }}>{fmtKes(p.price)}</div>
                  <div className="mono text-[9px] uppercase tracking-wider" style={{ color: '#4C535B' }}>one-time</div>
                </div>
                <button
                  onClick={() => openBuy(p)}
                  disabled={Number(p.stock) < 1}
                  className="btn btn-primary"
                  style={{ padding: '10px 18px', opacity: Number(p.stock) < 1 ? 0.5 : 1, cursor: Number(p.stock) < 1 ? 'not-allowed' : 'pointer' }}
                >
                  {Number(p.stock) < 1 ? 'Sold out' : 'Buy now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Revealed credentials (callback / after success) ── */}
      {vps && (
        <div className="card mt-8 p-6" style={{ border: '1px solid rgba(62,207,142,0.35)' }}>
          <div className="flex items-center gap-3 mb-4">
            <span style={{ fontSize: 22 }}>🖥️</span>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#E9E7E2' }}>Your VPS is live</h2>
              <p className="mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: '#4C535B' }}>{vps.package_name} · {vps.host}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { icon: '🌐', k: 'IP ADDRESS', v: vps.host, copy: true },
              { icon: '🆔', k: 'USERNAME', v: vps.username, copy: true },
              { icon: '🔐', k: 'PASSWORD', v: showPass ? vps.password : '••••••••••', copy: true, raw: vps.password },
              { icon: '🔢', k: 'ID DROPLET', v: vps.droplet_id, copy: true },
              { icon: '🧩', k: 'HOSTNAME', v: vps.hostname },
              { icon: '🌍', k: 'REGION', v: vps.region },
              { icon: '💿', k: 'OS', v: vps.instance_os || vps.pkg_os },
              { icon: '🖥️', k: 'CPU', v: vps.cpu || vps.pkg_cpu },
            ].filter((f) => f.v).map((f) => (
              <div key={f.k} className="px-3.5 py-2.5 flex items-center justify-between gap-3" style={{ background: 'rgba(62,207,142,0.045)', border: '1px solid rgba(62,207,142,0.14)', borderRadius: 9 }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{f.icon}</span>
                  <div className="min-w-0">
                    <div className="mono text-[9px] tracking-[0.14em]" style={{ color: '#4C535B' }}>{f.k}</div>
                    <div className="mt-0.5 mono text-[13px] truncate" style={{ color: '#E9E7E2' }}>{f.v}</div>
                  </div>
                </div>
                {f.k === 'PASSWORD' ? (
                  <button onClick={() => setShowPass(!showPass)} className="btn" style={{ fontSize: 10, padding: '4px 9px', flexShrink: 0 }} title="Show / hide">
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                ) : f.copy ? (
                  <button onClick={() => copyText(f.raw || f.v)} className="btn" style={{ fontSize: 10, padding: '4px 9px', flexShrink: 0 }} title="Copy">Copy</button>
                ) : null}
              </div>
            ))}
          </div>
          <p className="text-xs mt-4" style={{ color: '#79818A', lineHeight: 1.6 }}>
            💡 Save these credentials — they are also saved under{' '}
            <Link href="/dashboard" className="link">your dashboard</Link>.
            Connect via any SSH client (e.g. <span className="mono">ssh {vps.username}@{vps.host} -p {vps.port || 22}</span>).
          </p>
        </div>
      )}

      {/* ── Purchase modal ── */}
      {pkg && !vps && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,6,8,0.78)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(3px)' }} onClick={() => !paying && closeModal()}>
          <div className="card p-6" style={{ width: '100%', maxWidth: 430, maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="eyebrow" style={{ fontSize: 10 }}>Checkout</p>
                <h3 className="text-base font-bold mt-1" style={{ color: '#E9E7E2' }}>{pkg.name}</h3>
                <p className="mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: '#4C535B' }}>
                  {fmtKes(pkg.price)} · credentials revealed after payment
                </p>
              </div>
              <button onClick={() => !paying && closeModal()} className="btn" style={{ fontSize: 14, padding: '2px 8px', background: 'transparent', borderColor: 'transparent', color: '#79818A' }}>✕</button>
            </div>

            {step === 'method' && (
              <>
                <p className="text-xs font-bold mb-2" style={{ color: '#AEB5BD' }}>1 · Choose payment method</p>
                <div className="grid grid-cols-1 gap-2">
                  {METHODS.map((m) => (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className="flex items-center gap-3 px-3.5 py-3 text-left w-full"
                      style={{ borderRadius: 10, border: `1.5px solid ${method === m.id ? '#F2A93B' : 'rgba(233,231,226,0.12)'}`, background: method === m.id ? 'rgba(242,169,59,0.07)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <span style={{ fontSize: 20 }}>{m.icon}</span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold" style={{ color: '#E9E7E2' }}>{m.label}</span>
                        <span className="block text-[11px]" style={{ color: '#79818A' }}>{m.hint}</span>
                      </span>
                      <span style={{ color: method === m.id ? '#F2A93B' : '#3A3F45', fontSize: 16 }}>●</span>
                    </button>
                  ))}
                </div>

                {NEEDS_PHONE.includes(method) && (
                  <div className="mt-3">
                    <label className="mono text-[10px] uppercase tracking-wider" style={{ color: '#4C535B' }}>Phone number (receives the prompt)</label>
                    <input className="input mt-1" placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
                  </div>
                )}
                {NEEDS_TILL.includes(method) && (
                  <div className="mt-3">
                    <label className="mono text-[10px] uppercase tracking-wider" style={{ color: '#4C535B' }}>Till number (pay to)</label>
                    <input className="input mt-1" placeholder="e.g. 500123" value={till} onChange={(e) => setTill(e.target.value)} inputMode="numeric" />
                  </div>
                )}

                {error && <p className="text-xs mt-3" style={{ color: '#E5484D' }}>{error}</p>}

                <button onClick={startPayment} disabled={paying} className="btn btn-primary w-full mt-4" style={{ padding: '13px' }}>
                  {paying ? 'Starting payment…' : `Pay ${fmtKes(pkg.price)}`}
                </button>
                <p className="text-[11px] mt-3 text-center" style={{ color: '#4C535B' }}>
                  🔒 Secure payment via Paystack · your VPS credentials appear here instantly on success
                </p>
              </>
            )}

            {step === 'waiting' && (
              <div className="text-center py-4">
                <div className="spinner mx-auto" />
                <p className="text-sm font-bold mt-5" style={{ color: '#E9E7E2' }}>
                  {method === 'mpesa_till' ? 'Waiting for Till payment…' : 'Check your phone for the prompt'}
                </p>
                {displayText && (
                  <p className="text-xs mt-2 px-3 py-2 inline-block" style={{ background: 'rgba(242,169,59,0.08)', color: '#F2A93B', borderRadius: 8, fontFamily: 'monospace' }}>
                    {displayText}
                  </p>
                )}
                <p className="text-xs mt-3" style={{ color: '#79818A' }}>
                  Enter your M-PESA / Airtel PIN to authorize · auto-confirms in seconds
                </p>
                <p className="mono text-xs mt-2" style={{ color: secondsLeft < 30 ? '#E5484D' : '#4C535B' }}>
                  ⏱ {mm(Math.floor(secondsLeft / 60))}:{mm(secondsLeft % 60)}
                </p>
                {error && <p className="text-xs mt-3" style={{ color: '#E5484D' }}>{error}</p>}
                <button onClick={() => { setRef(null); setStep('method'); setError(''); }} className="btn mt-5" style={{ fontSize: 12 }}>← Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Outer page wraps VpsInner in Suspense (required for useSearchParams in Next.js 14)
export default function VpsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    }>
      <VpsInner />
    </Suspense>
  );
}
