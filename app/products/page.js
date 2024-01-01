'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    price: 50,
    cpu: '20% CPU',
    ram: '512MB RAM',
    disk: '2GB Disk',
    desc: 'Perfect for small bots and lightweight servers',
    popular: false,
    color: '#1e3a8a',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 75,
    cpu: '50% CPU',
    ram: '1GB RAM',
    disk: '5GB Disk',
    desc: 'Great for Minecraft, Discord bots & medium workloads',
    popular: true,
    color: '#1d4ed8',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 100,
    cpu: '100% CPU',
    ram: '5GB RAM',
    disk: '10GB Disk',
    desc: 'Full power for high-performance game servers',
    popular: false,
    color: '#2563eb',
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: 120,
    cpu: 'Unlimited CPU',
    ram: 'Unlimited RAM',
    disk: 'Unlimited Disk',
    desc: 'No limits. Maximum performance for any workload.',
    popular: false,
    color: '#1d4ed8',
  },
];

export default function ProductsPage() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [nests, setNests] = useState([]);
  const [eggs, setEggs] = useState([]);
  const [loadingNests, setLoadingNests] = useState(false);
  const [loadingEggs, setLoadingEggs] = useState(false);
  const [form, setForm] = useState({ ptero_username: '', ptero_password: '', firstname: '', lastname: '', nest_id: '', egg_id: '' });
  const [step, setStep] = useState('select'); // select | configure | confirm | creating | done
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchAuth();
  }, []);

  const fetchAuth = async () => {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      const wRes = await fetch('/api/wallet/balance');
      if (wRes.ok) { const wd = await wRes.json(); setBalance(wd.balance || 0); }
    }
    setLoading(false);
  };

  const handleSelectPkg = async (pkg) => {
    if (!user) { router.push('/login'); return; }
    setSelectedPkg(pkg);
    setStep('configure');
    setError('');
    setLoadingNests(true);
    try {
      const res = await fetch('/api/panel/nests');
      if (res.ok) { const d = await res.json(); setNests(d.nests || []); }
    } catch {}
    setLoadingNests(false);
  };

  const handleNestChange = async (nestId) => {
    setForm(f => ({ ...f, nest_id: nestId, egg_id: '' }));
    setEggs([]);
    if (!nestId) return;
    setLoadingEggs(true);
    try {
      const res = await fetch(`/api/panel/eggs?nest_id=${nestId}`);
      if (res.ok) { const d = await res.json(); setEggs(d.eggs || []); }
    } catch {}
    setLoadingEggs(false);
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!form.ptero_username || !form.ptero_password || !form.firstname || !form.lastname || !form.nest_id || !form.egg_id) {
      setError('All fields are required'); return;
    }
    setError('');
    setStep('confirm');
  };

  const handleCreate = async () => {
    setStep('creating');
    setError('');
    try {
      const res = await fetch('/api/panel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: selectedPkg.id, ...form }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.panel);
        setStep('done');
      } else {
        setError(data.error || 'Failed to create panel');
        setStep('confirm');
      }
    } catch {
      setError('Network error. Please try again.');
      setStep('confirm');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Header */}
      <section className="relative overflow-hidden py-16 mb-10" style={{ background: 'linear-gradient(180deg, #071428, #0a0a0f)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#f0f4ff' }}>Pterodactyl Panel Hosting</h1>
          <p className="text-lg" style={{ color: '#64748b' }}>Choose a plan, configure your server, and deploy instantly from your wallet.</p>
          {user && (
            <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl" style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)' }}>
              <svg className="w-4 h-4" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-sm font-semibold" style={{ color: '#60a5fa' }}>Wallet: KSH {balance.toLocaleString()}</span>
              {balance < 50 && <a href="/wallet" className="text-xs underline" style={{ color: '#f87171' }}>Top up →</a>}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        {/* Step: Select package */}
        {step === 'select' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PACKAGES.map(pkg => (
              <div key={pkg.id} className="relative rounded-2xl p-6 flex flex-col transition-all duration-300"
                style={{
                  backgroundColor: '#16182a',
                  border: pkg.popular ? '1px solid #2563eb' : '1px solid #1e2d4a',
                  boxShadow: pkg.popular ? '0 0 30px rgba(37,99,235,0.2)' : 'none',
                }}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>MOST POPULAR</span>
                  </div>
                )}
                <h3 className="font-bold text-xl mb-1" style={{ color: '#f0f4ff' }}>{pkg.name}</h3>
                <div className="mb-3">
                  <span className="text-4xl font-extrabold" style={{ color: '#3b82f6' }}>KSH {pkg.price}</span>
                  <span className="text-sm" style={{ color: '#64748b' }}>/month</span>
                </div>
                <p className="text-xs mb-5" style={{ color: '#64748b' }}>{pkg.desc}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {[pkg.cpu, pkg.ram, pkg.disk].map(s => (
                    <li key={s} className="flex items-center space-x-2 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      <span style={{ color: '#cbd5e1' }}>{s}</span>
                    </li>
                  ))}
                </ul>
                {balance < pkg.price && user && (
                  <p className="text-xs mb-2 text-center" style={{ color: '#f87171' }}>
                    Need KSH {pkg.price - balance} more → <a href="/wallet" className="underline">Top up</a>
                  </p>
                )}
                <button onClick={() => handleSelectPkg(pkg)}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                  {user ? 'Deploy This Plan' : 'Login to Deploy'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Step: Configure */}
        {step === 'configure' && selectedPkg && (
          <div className="max-w-xl mx-auto">
            <button onClick={() => setStep('select')} className="flex items-center space-x-2 mb-6 text-sm" style={{ color: '#64748b' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span>Back to plans</span>
            </button>

            <div className="rounded-2xl p-8" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: '#f0f4ff' }}>Configure Your Panel</h2>
                <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>
                  {selectedPkg.name} — KSH {selectedPkg.price}
                </span>
              </div>

              {error && (
                <div className="mb-5 p-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleConfirm} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>First Name</label>
                    <input value={form.firstname} onChange={e => setForm(f => ({ ...f, firstname: e.target.value }))} required
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder="John"
                      style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                      onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e2d4a'} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Last Name</label>
                    <input value={form.lastname} onChange={e => setForm(f => ({ ...f, lastname: e.target.value }))} required
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder="Doe"
                      style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                      onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e2d4a'} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Panel Username</label>
                  <input value={form.ptero_username} onChange={e => setForm(f => ({ ...f, ptero_username: e.target.value.replace(/\s/g, '') }))} required
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder="myusername (no spaces)"
                    style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e2d4a'} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Panel Password</label>
                  <input type="password" value={form.ptero_password} onChange={e => setForm(f => ({ ...f, ptero_password: e.target.value }))} required
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder="Strong password"
                    style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e2d4a'} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Nest (Server Type)</label>
                  {loadingNests ? (
                    <div className="flex items-center space-x-2 py-3" style={{ color: '#64748b' }}>
                      <div className="w-4 h-4 border-2 border-t-blue-500 rounded-full animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
                      <span className="text-sm">Loading nests...</span>
                    </div>
                  ) : (
                    <select value={form.nest_id} onChange={e => handleNestChange(e.target.value)} required
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: form.nest_id ? '#f0f4ff' : '#475569' }}>
                      <option value="">Select a nest...</option>
                      {nests.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                    </select>
                  )}
                </div>

                {form.nest_id && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Egg (Software/Game)</label>
                    {loadingEggs ? (
                      <div className="flex items-center space-x-2 py-3" style={{ color: '#64748b' }}>
                        <div className="w-4 h-4 border-2 border-t-blue-500 rounded-full animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
                        <span className="text-sm">Loading eggs...</span>
                      </div>
                    ) : (
                      <select value={form.egg_id} onChange={e => setForm(f => ({ ...f, egg_id: e.target.value }))} required
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: form.egg_id ? '#f0f4ff' : '#475569' }}>
                        <option value="">Select an egg...</option>
                        {eggs.map(e => <option key={e.id} value={e.id}>{e.name}{e.description ? ` — ${e.description.slice(0, 40)}` : ''}</option>)}
                      </select>
                    )}
                  </div>
                )}

                <button type="submit" className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                  Review & Confirm →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && selectedPkg && (
          <div className="max-w-xl mx-auto">
            <button onClick={() => setStep('configure')} className="flex items-center space-x-2 mb-6 text-sm" style={{ color: '#64748b' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span>Edit configuration</span>
            </button>

            <div className="rounded-2xl p-8" style={{ backgroundColor: '#16182a', border: '1px solid rgba(37,99,235,0.4)' }}>
              <h2 className="text-xl font-bold mb-6" style={{ color: '#f0f4ff' }}>Confirm Your Order</h2>

              {error && (
                <div className="mb-5 p-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {error}
                  {error.includes('Insufficient') && (
                    <a href="/wallet" className="block mt-1 underline" style={{ color: '#60a5fa' }}>Top up wallet →</a>
                  )}
                </div>
              )}

              <div className="space-y-3 mb-8">
                {[
                  { label: 'Package', value: `${selectedPkg.name} — KSH ${selectedPkg.price}/month` },
                  { label: 'Resources', value: `${selectedPkg.cpu}, ${selectedPkg.ram}` },
                  { label: 'Panel Username', value: form.ptero_username },
                  { label: 'Client Name', value: `${form.firstname} ${form.lastname}` },
                  { label: 'Nest ID', value: nests.find(n => n.id == form.nest_id)?.name || form.nest_id },
                  { label: 'Egg', value: eggs.find(e => e.id == form.egg_id)?.name || form.egg_id },
                  { label: 'Wallet Balance', value: `KSH ${balance.toLocaleString()}` },
                  { label: 'Amount to Deduct', value: `KSH ${selectedPkg.price}` },
                  { label: 'Balance After', value: `KSH ${(balance - selectedPkg.price).toLocaleString()}`, warn: balance < selectedPkg.price },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid #1e2d4a' }}>
                    <span className="text-sm" style={{ color: '#64748b' }}>{row.label}</span>
                    <span className="text-sm font-semibold" style={{ color: row.warn ? '#f87171' : '#f0f4ff' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)' }}>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  ⚡ Clicking "Confirm" will deduct <strong style={{ color: '#60a5fa' }}>KSH {selectedPkg.price}</strong> from your wallet and immediately create your Pterodactyl panel. This action cannot be undone.
                </p>
              </div>

              <button onClick={handleCreate} disabled={balance < selectedPkg.price}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
                style={{ background: balance < selectedPkg.price ? '#1e2d4a' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', cursor: balance < selectedPkg.price ? 'not-allowed' : 'pointer' }}>
                {balance < selectedPkg.price ? `Insufficient Balance — Top Up First` : `✓ Confirm & Deploy Panel`}
              </button>
            </div>
          </div>
        )}

        {/* Step: Creating */}
        {step === 'creating' && (
          <div className="max-w-xl mx-auto text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f4ff' }}>Creating Your Panel...</h2>
            <p style={{ color: '#64748b' }}>Setting up your Pterodactyl server. This takes about 30 seconds.</p>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && result && (
          <div className="max-w-xl mx-auto">
            <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#16182a', border: '1px solid rgba(34,197,94,0.4)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0f4ff' }}>Panel Created!</h2>
              <p className="mb-8" style={{ color: '#64748b' }}>Your Pterodactyl panel is live. Use the credentials below to log in.</p>

              <div className="text-left space-y-3 mb-8">
                {[
                  { label: 'Panel URL', value: result.panel_url, link: result.panel_url },
                  { label: 'Username', value: result.username },
                  { label: 'Package', value: result.package },
                  { label: 'Wallet Deducted', value: `KSH ${result.price}` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between p-3 rounded-xl" style={{ backgroundColor: '#0d1117' }}>
                    <span className="text-sm" style={{ color: '#64748b' }}>{row.label}</span>
                    {row.link ? (
                      <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold underline" style={{ color: '#60a5fa' }}>{row.value}</a>
                    ) : (
                      <span className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>{row.value}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <a href={result.panel_url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                  Open Panel →
                </a>
                <button onClick={() => { setStep('select'); setSelectedPkg(null); setForm({ ptero_username: '', ptero_password: '', firstname: '', lastname: '', nest_id: '', egg_id: '' }); }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>
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
