'use client';
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function fmtCpu(v)  { const n = parseInt(v); return n === 0 ? 'Unlimited CPU'  : `${n}% CPU`; }
function fmtRam(v)  { const n = parseInt(v); return n === 0 ? 'Unlimited RAM'  : n >= 1024 ? `${n / 1024} GB RAM`  : `${n} MB RAM`; }
function fmtDisk(v) { const n = parseInt(v); return n === 0 ? 'Unlimited Disk' : n >= 1024 ? `${n / 1024} GB Disk` : `${n} MB Disk`; }

const STEPS = ['Select Plan', 'Configure', 'Review', 'Done'];

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
      setError(`Insufficient balance. You need KSH ${pkg.price} but have KSH ${parseFloat(balance).toFixed(2)}. Please top up your wallet.`);
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
      </div>
    );
  }

  const stepIndex = { select: 0, configure: 1, confirm: 2, creating: 2, done: 3 }[step] ?? 0;

  return (
    <div className="min-h-screen py-8 sm:py-12" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── Page header ── */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: '#f0f4ff' }}>Deploy a Panel</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Choose a plan, configure your server, and go live in minutes.
          </p>
          {user && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
              style={{ backgroundColor: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#60a5fa' }}>
              💳 Wallet: <strong>KSH {parseFloat(balance).toLocaleString()}</strong>
              {balance < 50 && (
                <Link href="/wallet" className="ml-2 underline text-xs" style={{ color: '#f87171', textDecoration: 'underline' }}>Top up →</Link>
              )}
            </div>
          )}
        </div>

        {/* ── Step indicator ── */}
        {step !== 'select' && (
          <div className="flex items-center gap-0 mb-8 sm:mb-10 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <Fragment key={s}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      backgroundColor: i < stepIndex ? '#22c55e' : i === stepIndex ? '#2563eb' : '#1e2d4a',
                      color: i <= stepIndex ? '#fff' : '#475569',
                    }}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <p className="text-xs mt-1.5 whitespace-nowrap"
                    style={{ color: i === stepIndex ? '#f0f4ff' : '#475569', fontWeight: i === stepIndex ? 600 : 400 }}>
                    {s}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2 sm:mx-3 min-w-4"
                    style={{ backgroundColor: i < stepIndex ? '#22c55e' : '#1e2d4a', marginBottom: '1.25rem' }} />
                )}
              </Fragment>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {error}
            {error.includes('Insufficient') && (
              <Link href="/wallet" className="ml-2 underline font-semibold" style={{ color: '#fbbf24' }}>Top up wallet →</Link>
            )}
          </div>
        )}

        {/* ════ STEP: select ════ */}
        {step === 'select' && (
          <>
            {!user && (
              <div className="mb-6 p-4 rounded-xl text-sm flex flex-col sm:flex-row items-start sm:items-center gap-3"
                style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fcd34d' }}>
                <span>⚠️ You need to be logged in to deploy a panel.</span>
                <Link href="/login" className="font-bold underline flex-shrink-0" style={{ color: '#fbbf24' }}>Log in →</Link>
              </div>
            )}
            {packages.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#475569' }}>No packages available at the moment. Please check back soon.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
                {packages.map(p => (
                  <div key={p.id}
                    className="relative rounded-2xl p-5 sm:p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    style={{
                      backgroundColor: p.popular ? '#0f1a35' : '#0f1629',
                      border: `1px solid ${p.popular ? p.accent : '#1e2d4a'}`,
                      boxShadow: p.popular ? `0 0 30px ${p.accent}30` : 'none',
                    }}
                    onClick={() => handleSelectPkg(p)}>
                    {p.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{ background: `linear-gradient(135deg,${p.accent},${p.accent}cc)` }}>
                          Most Popular
                        </span>
                      </div>
                    )}
                    <p className="font-bold text-base mb-1" style={{ color: '#f0f4ff' }}>{p.name}</p>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="font-extrabold text-3xl" style={{ color: p.popular ? p.accent : '#f0f4ff' }}>KSH {parseFloat(p.price).toLocaleString()}</span>
                      <span className="text-xs" style={{ color: '#475569' }}>/mo</span>
                    </div>
                    <p className="text-xs leading-relaxed mb-4" style={{ color: '#64748b' }}>{p.description}</p>
                    <ul className="space-y-2 mb-5 flex-1">
                      {[fmtCpu(p.cpu), fmtRam(p.ram), fmtDisk(p.disk), ...(p.expires_after_hours ? [`Auto-removed after ${p.expires_after_hours}h`] : [])].map(spec => (
                        <li key={spec} className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
                          <svg className="w-4 h-4 flex-shrink-0" style={{ color: p.accent || '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {spec}
                        </li>
                      ))}
                    </ul>
                    <button
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: p.popular ? `linear-gradient(135deg,${p.accent},${p.accent}cc)` : '#1e2d4a' }}
                      onClick={e => { e.stopPropagation(); handleSelectPkg(p); }}>
                      {p.popular ? '⚡ Get Started' : 'Choose Plan'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ════ STEP: configure ════ */}
        {step === 'configure' && pkg && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Form */}
            <div className="lg:col-span-2 rounded-2xl p-5 sm:p-7" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <h2 className="font-bold text-lg mb-5" style={{ color: '#f0f4ff' }}>Configure Your Server</h2>
              <form onSubmit={handleConfirm} className="space-y-4">
                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'firstname', label: 'First Name', placeholder: 'John' },
                    { key: 'lastname',  label: 'Last Name',  placeholder: 'Doe' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>{f.label}</label>
                      <input type="text" value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} required
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                        onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#1e2d4a'} />
                    </div>
                  ))}
                </div>

                {/* Username + Password */}
                {[
                  { key: 'ptero_username', label: 'Panel Username', placeholder: 'Your Pterodactyl username', type: 'text' },
                  { key: 'ptero_password', label: 'Panel Password',  placeholder: 'Min. 8 characters',        type: 'password' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>{f.label}</label>
                    <input type={f.type} value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                      onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#1e2d4a'} />
                  </div>
                ))}

                {/* Nest selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>Server Type (Nest)</label>
                  <select value={form.nest_id} onChange={e => handleNestChange(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: form.nest_id ? '#f0f4ff' : '#475569' }}>
                    <option value="">{loadingNests ? 'Loading nests…' : '— Select a nest —'}</option>
                    {nests.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>

                {/* Egg selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>Server Software (Egg)</label>
                  <select value={form.egg_id} onChange={e => setForm(f => ({ ...f, egg_id: e.target.value }))} required disabled={!form.nest_id}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: form.egg_id ? '#f0f4ff' : '#475569', opacity: !form.nest_id ? 0.5 : 1 }}>
                    <option value="">{loadingEggs ? 'Loading eggs…' : !form.nest_id ? '— Select a nest first —' : '— Select software —'}</option>
                    {eggs.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button type="button" onClick={reset}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{ color: '#94a3b8', border: '1px solid #1e2d4a' }}>
                    ← Back
                  </button>
                  <button type="submit"
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                    Review Order →
                  </button>
                </div>
              </form>
            </div>

            {/* Order summary */}
            <div>
              <div className="rounded-2xl p-5 sm:p-6 sticky top-20" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#475569' }}>Order Summary</p>
                <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid #1e2d4a' }}>
                  <div>
                    <p className="font-bold" style={{ color: '#f0f4ff' }}>{pkg.name} Plan</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Monthly subscription</p>
                  </div>
                  <p className="font-extrabold text-xl" style={{ color: '#3b82f6' }}>KSH {parseFloat(pkg.price).toLocaleString()}</p>
                </div>
                {[fmtCpu(pkg.cpu), fmtRam(pkg.ram), fmtDisk(pkg.disk)].map(s => (
                  <div key={s} className="flex items-center gap-2 py-1.5 text-sm" style={{ color: '#64748b' }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {s}
                  </div>
                ))}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1e2d4a' }}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: '#475569' }}>
                    <span>Your balance</span>
                    <span style={{ color: balance >= pkg.price ? '#4ade80' : '#f87171' }}>KSH {parseFloat(balance).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: '#475569' }}>
                    <span>After purchase</span>
                    <span style={{ color: '#94a3b8' }}>KSH {Math.max(0, balance - pkg.price).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ STEP: confirm ════ */}
        {step === 'confirm' && pkg && (
          <div className="max-w-lg mx-auto rounded-2xl p-6 sm:p-8" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
            <h2 className="font-bold text-xl mb-6" style={{ color: '#f0f4ff' }}>Confirm Order</h2>
            {[
              { label: 'Plan',      value: `${pkg.name} — KSH ${parseFloat(pkg.price).toLocaleString()}/mo` },
              { label: 'Resources', value: `${fmtCpu(pkg.cpu)} · ${fmtRam(pkg.ram)} · ${fmtDisk(pkg.disk)}` },
              { label: 'Username',  value: form.ptero_username },
              { label: 'Name',      value: `${form.firstname} ${form.lastname}` },
              { label: 'Nest',      value: nests.find(n => String(n.id) === String(form.nest_id))?.name || form.nest_id },
              { label: 'Egg',       value: eggs.find(e => String(e.id) === String(form.egg_id))?.name || form.egg_id },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-3 text-sm" style={{ borderBottom: '1px solid #1e2d4a' }}>
                <span style={{ color: '#64748b' }}>{r.label}</span>
                <span className="font-semibold text-right ml-4" style={{ color: '#f0f4ff', wordBreak: 'break-all' }}>{r.value}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 text-base font-bold" style={{ borderBottom: '1px solid #1e2d4a' }}>
              <span style={{ color: '#94a3b8' }}>Total Charge</span>
              <span style={{ color: '#3b82f6' }}>KSH {parseFloat(pkg.price).toLocaleString()}</span>
            </div>
            <p className="text-xs mt-4 mb-6" style={{ color: '#475569' }}>
              KSH {parseFloat(pkg.price).toLocaleString()} will be deducted from your wallet. Balance after: KSH {Math.max(0, balance - pkg.price).toLocaleString()}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setStep('configure')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ color: '#94a3b8', border: '1px solid #1e2d4a' }}>
                ← Edit
              </button>
              <button onClick={handleCreate}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}>
                ✅ Confirm & Deploy
              </button>
            </div>
          </div>
        )}

        {/* ════ STEP: creating ════ */}
        {step === 'creating' && (
          <div className="text-center py-16 sm:py-24">
            <div className="w-14 h-14 rounded-full border-2 animate-spin mx-auto mb-6"
              style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
            <p className="font-bold text-lg mb-2" style={{ color: '#f0f4ff' }}>Deploying your panel…</p>
            <p className="text-sm" style={{ color: '#64748b' }}>This takes about 30 seconds. Please wait.</p>
          </div>
        )}

        {/* ════ STEP: done ════ */}
        {step === 'done' && result && (
          <div className="max-w-lg mx-auto text-center">
            <div className="rounded-2xl p-8 sm:p-10" style={{ backgroundColor: '#0f1629', border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 0 40px rgba(34,197,94,0.1)' }}>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#f0f4ff' }}>Panel Deployed!</h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>Your server is live. Log in to the Pterodactyl panel to manage it.</p>

              <div className="rounded-xl p-4 mb-6 text-left space-y-2" style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a' }}>
                {[
                  { label: 'Plan',      value: pkg?.name },
                  { label: 'Username',  value: form.ptero_username },
                  { label: 'Server ID', value: result.ptero_server_id || '—' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span style={{ color: '#64748b' }}>{r.label}</span>
                    <span className="font-semibold" style={{ color: '#f0f4ff' }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a href={process.env.NEXT_PUBLIC_PTERODACTYL_URL || 'https://public.mzazi.shop'}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white text-center"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', textDecoration: 'none' }}>
                  Open Panel →
                </a>
                <button onClick={reset}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ color: '#94a3b8', border: '1px solid #1e2d4a' }}>
                  Deploy Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
