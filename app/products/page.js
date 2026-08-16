'use client';
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fmtMtc } from '@/lib/currency';

function fmtCpu(v)  { const n = parseInt(v); return n === 0 ? 'Unlimited CPU'  : `${n}% CPU`; }
function fmtRam(v)  { const n = parseInt(v); return n === 0 ? 'Unlimited RAM'  : n >= 1024 ? `${n / 1024} GB RAM`  : `${n} MB RAM`; }
function fmtDisk(v) { const n = parseInt(v); return n === 0 ? 'Unlimited Disk' : n >= 1024 ? `${n / 1024} GB Disk` : `${n} MB Disk`; }

const STEPS = ['Select plan', 'Configure', 'Review', 'Done'];

export default function ProductsPage() {
  const [user, setUser]         = useState(null);
  const [balance, setBalance]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [packages, setPackages] = useState([]);
  const [pkg, setPkg]           = useState(null);
  const [nests, setNests]       = useState([]);
  const [eggs, setEggs]         = useState([]);
  const [loadingNests, setLN]   = useState(false);
  const [loadingEggs, setLE]    = useState(false);
  const [form, setForm]         = useState({ ptero_username: '', ptero_password: '', firstname: '', lastname: '', nest_id: '', egg_id: '' });
  const [step, setStep]         = useState('select');
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const router = useRouter();

  useEffect(() => { init(); }, []);

  const init = async () => {
    const [authRes, pkgRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/packages', { cache: 'no-store' }),
    ]);
    if (authRes.ok) {
      const d = await authRes.json(); setUser(d.user);
      const wr = await fetch('/api/wallet/balance');
      if (wr.ok) { const wd = await wr.json(); setBalance(wd.balance || 0); }
    }
    if (pkgRes.ok) { const pd = await pkgRes.json(); setPackages(pd.packages || []); }
    setLoading(false);
  };

  const handleSelectPkg = async (p) => {
    if (!user) { router.push('/login'); return; }
    setPkg(p); setStep('configure'); setError('');
    setLN(true);
    try {
      const res = await fetch('/api/panel/nests');
      if (res.ok) { const d = await res.json(); setNests(d.nests || []); }
    } catch {}
    setLN(false);
  };

  const handleNestChange = async (nestId) => {
    setForm(f => ({ ...f, nest_id: nestId, egg_id: '' }));
    setEggs([]);
    if (!nestId) return;
    setLE(true);
    try {
      const res = await fetch(`/api/panel/eggs?nest_id=${nestId}`);
      if (res.ok) { const d = await res.json(); setEggs(d.eggs || []); }
    } catch {}
    setLE(false);
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!form.ptero_username || !form.ptero_password || !form.firstname || !form.lastname || !form.nest_id || !form.egg_id) {
      setError('All fields are required'); return;
    }
    if (balance < pkg.price) {
      setError(`Insufficient balance. You need ${fmtMtc(pkg.price)} but have ${fmtMtc(balance)}. Please top up your wallet.`);
      return;
    }
    setError(''); setStep('confirm');
  };

  const handleCreate = async () => {
    setStep('creating'); setError('');
    try {
      const res = await fetch('/api/panel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: pkg.id, ...form }),
      });
      const data = await res.json();
      if (res.ok) { setResult(data.panel); setStep('done'); }
      else { setError(data.error || 'Failed to create panel'); setStep('confirm'); }
    } catch {
      setError('Network error. Please try again.'); setStep('confirm');
    }
  };

  const reset = () => { setPkg(null); setStep('select'); setForm({ ptero_username:'',ptero_password:'',firstname:'',lastname:'',nest_id:'',egg_id:'' }); setResult(null); setError(''); setNests([]); setEggs([]); };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const stepIndex = { select: 0, configure: 1, confirm: 2, creating: 2, done: 3 }[step] ?? 0;

  return (
    <div className="py-10 sm:py-14">
      <div className="container-site max-w-6xl">

        {/* ── Page header ── */}
        <div className="mb-10">
          <p className="eyebrow">Pterodactyl hosting</p>
          <h1 className="headline mt-4" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)' }}>
            Deploy a panel<span className="accent">.</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <p className="text-sm" style={{ color: '#79818A' }}>
              Choose a plan, configure your server, and go live in minutes.
            </p>
            {user && (
              <span className="tag tag-amber">
                Wallet: <strong>{fmtMtc(balance)}</strong>
                {balance < 50 && (
                  <Link href="/wallet" style={{ color: '#F2A93B', textDecoration: 'underline' }}>top up →</Link>
                )}
              </span>
            )}
          </div>
        </div>

        {/* ── Step indicator ── */}
        {step !== 'select' && (
          <div className="flex items-center mb-10 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <Fragment key={s}>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span
                    className="mono flex items-center justify-center text-[11px] font-semibold"
                    style={{
                      width: 26, height: 26, borderRadius: 2,
                      background: i < stepIndex ? '#F2A93B' : i === stepIndex ? 'rgba(242,169,59,0.12)' : 'transparent',
                      border: `1px solid ${i <= stepIndex ? '#F2A93B' : '#262C33'}`,
                      color: i < stepIndex ? '#14100A' : i === stepIndex ? '#F2A93B' : '#4C535B',
                    }}>
                    {i < stepIndex ? '✓' : i + 1}
                  </span>
                  <p className="mono text-[11px] uppercase tracking-[0.12em] whitespace-nowrap"
                    style={{ color: i === stepIndex ? '#E9E7E2' : '#4C535B' }}>
                    {s}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-px mx-4 min-w-6 flex-1" style={{ background: i < stepIndex ? '#F2A93B' : '#1B2026' }} />
                )}
              </Fragment>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 px-4 py-3 text-sm flex flex-wrap items-center gap-2" style={{ background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.3)', color: '#E5484D' }}>
            {error}
            {error.includes('Insufficient') && (
              <Link href="/wallet" className="link" style={{ fontSize: 12 }}>Top up wallet →</Link>
            )}
          </div>
        )}

        {/* ════ STEP: select ════ */}
        {step === 'select' && (
          <>
            {!user && (
              <div className="mb-6 px-4 py-3 text-sm flex flex-col sm:flex-row items-start sm:items-center gap-3"
                style={{ background: 'rgba(242,169,59,0.06)', border: '1px solid rgba(242,169,59,0.25)' }}>
                <span style={{ color: '#F2A93B' }}>You need to be logged in to deploy a panel.</span>
                <Link href="/login" className="link flex-shrink-0" style={{ fontSize: 12 }}>Log in →</Link>
              </div>
            )}
            {packages.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#4C535B' }}>No packages available at the moment. Please check back soon.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {packages.map(p => (
                  <div key={p.id}
                    className="card flex flex-col transition-all duration-300 hover:-translate-y-1 cursor-pointer relative"
                    style={{
                      padding: '24px 22px',
                      background: p.popular ? '#16181C' : 'var(--surface)',
                      border: p.popular ? '1px solid #F2A93B' : '1px solid #262C33',
                    }}
                    onClick={() => handleSelectPkg(p)}>
                    {p.popular && (
                      <span className="mono absolute -top-2.5 left-4 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] font-semibold"
                        style={{ background: '#F2A93B', color: '#14100A', borderRadius: 2 }}>
                        Most popular
                      </span>
                    )}
                    <p className="display font-bold text-base mb-1" style={{ color: '#E9E7E2' }}>{p.name}</p>
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="stat-num" style={{ fontSize: '1.8rem', color: p.popular ? '#F2A93B' : '#E9E7E2' }}>{fmtMtc(p.price)}</span>
                      <span className="mono text-[10px] uppercase tracking-[0.1em]" style={{ color: '#4C535B' }}>/mo</span>
                    </div>
                    <p className="text-xs leading-relaxed mb-4" style={{ color: '#79818A' }}>{p.description}</p>
                    <ul className="space-y-1.5 mb-6 flex-1">
                      {[fmtCpu(p.cpu), fmtRam(p.ram), fmtDisk(p.disk), ...(p.expires_after_hours ? [`Auto-removed after ${p.expires_after_hours}h`] : [])].map(spec => (
                        <li key={spec} className="mono flex items-center gap-2 text-[11px]" style={{ color: '#AEB5BD' }}>
                          <span style={{ color: p.accent || '#F2A93B' }}>—</span>
                          {spec}
                        </li>
                      ))}
                    </ul>
                    <button
                      className="btn w-full"
                      style={{
                        padding: '10px 0', fontSize: 11,
                        background: p.popular ? '#F2A93B' : 'transparent',
                        color: p.popular ? '#14100A' : '#AEB5BD',
                        border: p.popular ? '1px solid #F2A93B' : '1px solid #262C33',
                      }}
                      onClick={e => { e.stopPropagation(); handleSelectPkg(p); }}>
                      {p.popular ? 'Get started' : 'Choose plan'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ════ STEP: configure ════ */}
        {step === 'configure' && pkg && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 card p-6 sm:p-8">
              <p className="eyebrow">Step 02</p>
              <h2 className="display text-xl font-bold mt-3 mb-6" style={{ color: '#E9E7E2' }}>Configure your server</h2>
              <form onSubmit={handleConfirm} className="space-y-5">
                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'firstname', label: 'First name', placeholder: 'John' },
                    { key: 'lastname',  label: 'Last name',  placeholder: 'Doe' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="label">{f.label}</label>
                      <input type="text" value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} required className="input" />
                    </div>
                  ))}
                </div>

                {/* Username + Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'ptero_username', label: 'Panel username', placeholder: 'Your Pterodactyl username', type: 'text' },
                    { key: 'ptero_password', label: 'Panel password',  placeholder: 'Min. 8 characters',        type: 'password' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="label">{f.label}</label>
                      <input type={f.type} value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} required className="input" />
                    </div>
                  ))}
                </div>

                {/* Nest selector */}
                <div>
                  <label className="label">Server type (nest)</label>
                  <select value={form.nest_id} onChange={e => handleNestChange(e.target.value)} required className="input">
                    <option value="">{loadingNests ? 'Loading nests…' : '— Select a nest —'}</option>
                    {nests.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>

                {/* Egg selector */}
                <div>
                  <label className="label">Server software (egg)</label>
                  <select value={form.egg_id} onChange={e => setForm(f => ({ ...f, egg_id: e.target.value }))} required disabled={!form.nest_id}
                    className="input" style={{ opacity: !form.nest_id ? 0.5 : 1 }}>
                    <option value="">{loadingEggs ? 'Loading eggs…' : !form.nest_id ? '— Select a nest first —' : '— Select software —'}</option>
                    {eggs.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button type="button" onClick={reset} className="btn btn-ghost flex-1">← Back</button>
                  <button type="submit" className="btn btn-primary flex-1">Review order →</button>
                </div>
              </form>
            </div>

            {/* Order summary */}
            <div>
              <div className="card p-6 lg:sticky lg:top-32">
                <p className="mono text-[10px] uppercase tracking-[0.18em] mb-5" style={{ color: '#4C535B' }}>Order summary</p>
                <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid #1B2026' }}>
                  <div>
                    <p className="display font-bold" style={{ color: '#E9E7E2' }}>{pkg.name} plan</p>
                    <p className="mono text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: '#4C535B' }}>Monthly subscription</p>
                  </div>
                  <p className="stat-num" style={{ fontSize: '1.4rem', color: '#F2A93B' }}>{fmtMtc(pkg.price)}</p>
                </div>
                <div className="space-y-1.5">
                  {[fmtCpu(pkg.cpu), fmtRam(pkg.ram), fmtDisk(pkg.disk)].map(s => (
                    <div key={s} className="mono flex items-center gap-2 text-[11px]" style={{ color: '#79818A' }}>
                      <span style={{ color: '#F2A93B' }}>—</span>
                      {s}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1B2026' }}>
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: '#4C535B' }}>
                    <span>Your balance</span>
                    <span style={{ color: balance >= pkg.price ? '#3ECF8E' : '#E5484D' }}>{fmtMtc(balance)}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: '#4C535B' }}>
                    <span>After purchase</span>
                    <span style={{ color: '#AEB5BD' }}>{fmtMtc(Math.max(0, balance - pkg.price))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ STEP: confirm ════ */}
        {step === 'confirm' && pkg && (
          <div className="max-w-lg mx-auto card p-6 sm:p-8">
            <p className="eyebrow">Step 03</p>
            <h2 className="display text-xl font-bold mt-3 mb-6" style={{ color: '#E9E7E2' }}>Confirm order</h2>
            {[
              { label: 'Plan',      value: `${pkg.name} — ${fmtMtc(pkg.price)}/mo` },
              { label: 'Resources', value: `${fmtCpu(pkg.cpu)} · ${fmtRam(pkg.ram)} · ${fmtDisk(pkg.disk)}` },
              { label: 'Username',  value: form.ptero_username },
              { label: 'Name',      value: `${form.firstname} ${form.lastname}` },
              { label: 'Nest',      value: nests.find(n => String(n.id) === String(form.nest_id))?.name || form.nest_id },
              { label: 'Egg',       value: eggs.find(e => String(e.id) === String(form.egg_id))?.name || form.egg_id },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-3 text-sm" style={{ borderBottom: '1px solid #1B2026' }}>
                <span className="mono text-[10px] uppercase tracking-[0.12em] flex-shrink-0" style={{ color: '#4C535B', paddingTop: 3 }}>{r.label}</span>
                <span className="font-semibold text-right ml-6" style={{ color: '#E9E7E2', wordBreak: 'break-all' }}>{r.value}</span>
              </div>
            ))}
            <div className="flex justify-between py-3.5 text-base" style={{ borderBottom: '1px solid #1B2026' }}>
              <span className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: '#4C535B', paddingTop: 4 }}>Total charge</span>
              <span className="stat-num" style={{ fontSize: '1.3rem', color: '#F2A93B' }}>{fmtMtc(pkg.price)}</span>
            </div>
            <p className="text-xs mt-4 mb-6" style={{ color: '#4C535B' }}>
              {fmtMtc(pkg.price)} will be deducted from your wallet. Balance after: {fmtMtc(Math.max(0, balance - pkg.price))}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setStep('configure')} className="btn btn-ghost flex-1">← Edit</button>
              <button onClick={handleCreate} className="btn btn-primary flex-1">Confirm & deploy</button>
            </div>
          </div>
        )}

        {/* ════ STEP: creating ════ */}
        {step === 'creating' && (
          <div className="text-center py-16 sm:py-24">
            <div className="spinner mx-auto mb-6" />
            <p className="display font-bold text-lg mb-2" style={{ color: '#E9E7E2' }}>Deploying your panel…</p>
            <p className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#4C535B' }}>About 30 seconds — please wait</p>
          </div>
        )}

        {/* ════ STEP: done ════ */}
        {step === 'done' && result && (
          <div className="max-w-lg mx-auto">
            <div className="card p-6 sm:p-8" style={{ borderColor: 'rgba(62,207,142,0.4)' }}>
              <div className="mb-6">
                <p className="eyebrow">Step 04 — done</p>
                <h2 className="headline mt-3" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.1rem)' }}>Panel deployed<span className="accent">.</span></h2>
                <p className="text-sm mt-2" style={{ color: '#79818A' }}>
                  Your server is live. Save these credentials — you will need them to log in.
                </p>
              </div>

              {/* Credentials box */}
              <div className="mb-4" style={{ border: '1px solid #262C33', background: '#0F1215' }}>
                <p className="mono text-[10px] uppercase tracking-[0.16em] px-4 py-3" style={{ color: '#F2A93B', borderBottom: '1px solid #1B2026' }}>
                  Login credentials
                </p>
                {[
                  { label: 'Panel URL',  value: result.panel_url || 'https://public.mzazi.shop', link: result.panel_url || 'https://public.mzazi.shop' },
                  { label: 'Username',   value: result.username  || form.ptero_username },
                  { label: 'Password',   value: result.password  || form.ptero_password },
                  { label: 'Plan',       value: result.package   || pkg?.name },
                  { label: 'Server ID',  value: result.ptero_server_id ? String(result.ptero_server_id) : '—' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm" style={{ borderBottom: '1px solid #1B2026' }}>
                    <span className="mono text-[9px] uppercase tracking-[0.14em] flex-shrink-0" style={{ color: '#4C535B' }}>{r.label}</span>
                    {r.link
                      ? <a href={r.link} target="_blank" rel="noopener noreferrer" className="mono text-[12px] font-semibold truncate" style={{ color: '#4C7DFC', textDecoration: 'underline', wordBreak: 'break-all' }}>{r.value}</a>
                      : <span className="mono text-[12px] font-semibold text-right" style={{ color: '#E9E7E2', wordBreak: 'break-all' }}>{r.value}</span>
                    }
                  </div>
                ))}
              </div>

              {/* Expiry notice */}
              {result.expires_at && (
                <div className="px-4 py-3 mb-4 text-xs flex items-start gap-2" style={{ background: 'rgba(242,169,59,0.05)', border: '1px solid rgba(242,169,59,0.25)', color: '#AEB5BD' }}>
                  <span className="flex-shrink-0" style={{ color: '#F2A93B' }}>EXP</span>
                  <span>This server will be <strong style={{ color: '#E9E7E2' }}>automatically removed</strong> on {new Date(result.expires_at).toLocaleString()}. Back up your data before then.</span>
                </div>
              )}

              {/* Warning to save creds */}
              <div className="px-4 py-3 mb-5 text-xs" style={{ background: 'rgba(229,72,77,0.06)', border: '1px solid rgba(229,72,77,0.25)', color: '#AEB5BD' }}>
                <strong style={{ color: '#E5484D' }}>Save your password now.</strong> It is shown only once and cannot be recovered from this page.
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a href={result.panel_url || 'https://public.mzazi.shop'}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-primary flex-1" style={{ textDecoration: 'none' }}>
                  Open panel →
                </a>
                <button onClick={reset} className="btn btn-ghost flex-1">Deploy another</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
