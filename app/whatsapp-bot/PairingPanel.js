'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { fmtKes } from '@/lib/currency';

// Interactive WhatsApp pairing panel for the /whatsapp-bot page.
// Requires login — shows the pairing card, linked devices + unlink, and plans.
export default function PairingPanel() {
  const [authed, setAuthed] = useState(null); // null | true | false
  const [data, setData] = useState(null);     // { plan, maxDevices, devices, plans }
  const [loadErr, setLoadErr] = useState('');

  // pairing
  const [pairNumber, setPairNumber] = useState('');
  const [pairPhase, setPairPhase] = useState('idle'); // idle | requesting | waiting | done | error
  const [pairCode, setPairCode] = useState('');
  const [pairError, setPairError] = useState('');
  const pollPairRef = useRef(null);

  // unlink / buy
  const [busyNum, setBusyNum] = useState(null);
  const [buying, setBuying] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (!r.ok) { setAuthed(false); return; }
        setAuthed(true);
        loadDevices();
      })
      .catch(() => setAuthed(false));
  }, []);

  const loadDevices = async () => {
    try {
      const res = await fetch('/api/pair/devices', { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } catch {}
  };

  const pollPair = (requestId) => {
    if (pollPairRef.current) clearInterval(pollPairRef.current);
    let attempts = 0;
    const check = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/pair?requestId=${requestId}`, { cache: 'no-store' });
        const d = await res.json();
        if (d.status === 'done') {
          clearInterval(pollPairRef.current);
          if (d.result?.code) {
            setPairCode(d.result.code);
            setPairPhase('done');
            setTimeout(loadDevices, 3000); // session appears in the list once connected
          } else {
            setPairPhase('error');
            setPairError('Pairing finished but no code was returned.');
          }
          return;
        }
        if (d.status === 'failed') {
          clearInterval(pollPairRef.current);
          setPairPhase('error');
          setPairError(d.error || 'Pairing failed. Try again.');
          return;
        }
      } catch {}
      if (attempts >= 40) {
        clearInterval(pollPairRef.current);
        setPairPhase('error');
        setPairError('The bot is taking too long. Try again in a moment.');
      }
    };
    check();
    pollPairRef.current = setInterval(check, 3000);
  };

  const startPair = async () => {
    const digits = pairNumber.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      setPairPhase('error');
      setPairError('Enter a valid phone number, e.g. 254785016388.');
      return;
    }
    setPairPhase('requesting');
    setPairError('');
    setPairCode('');
    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: digits }),
      });
      const d = await res.json();
      if (!res.ok) {
        setPairPhase('error');
        setPairError(d.error || 'Failed to start pairing.');
        return;
      }
      setPairPhase('waiting');
      pollPair(d.requestId);
    } catch {
      setPairPhase('error');
      setPairError('Connection error. Try again.');
    }
  };

  const resetPair = () => {
    if (pollPairRef.current) clearInterval(pollPairRef.current);
    setPairPhase('idle');
    setPairError('');
    setPairCode('');
  };

  const manageDevice = async (number, action) => {
    if (action === 'unlink' && !window.confirm(`Unlink ${number}? The bot will log the device out of WhatsApp (it can be paired again later).`)) return;
    if (action === 'delete' && !window.confirm(`Delete ${number}? This permanently removes the device from the bot and your account.`)) return;
    setBusyNum(number);
    setNotice('');
    try {
      const res = await fetch('/api/pair/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, action }),
      });
      const d = await res.json();
      if (!res.ok) { setNotice(`Error: ${d.error || 'Failed'}`); setBusyNum(null); return; }
      const label = { unlink: 'Unlinking', delete: 'Deleting' }[action] || 'Processing';
      setNotice(`${label} ${number}…`);
      // the bot picks it up within ~15s — refresh after that
      setTimeout(loadDevices, 14000);
    } catch {
      setNotice('Connection error.');
      setBusyNum(null);
    }
  };

  const buyPlan = async (key) => {
    setBuying(key);
    setNotice('');
    try {
      const res = await fetch('/api/pair/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: key }),
      });
      const d = await res.json();
      if (!res.ok) {
        setNotice(`Error: ${d.error || 'Failed to buy plan'}`);
        setBuying(null);
        return;
      }
      setNotice(`Plan activated: ${d.plan.replace('_', ' ')} — you can now link up to ${d.maxDevices} devices.`);
      loadDevices();
    } catch {
      setNotice('Connection error.');
    }
    setBuying(null);
  };

  // ── not logged in ─────────────────────────────────────────────────────────
  if (authed === false) {
    return (
      <div className="card card-pad text-center" style={{ borderColor: 'rgba(242,169,59,0.35)' }}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#F2A93B', margin: '0 auto' }}>
          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <h3 className="display font-bold text-lg mt-4 mb-1" style={{ color: '#E9E7E2' }}>Login to pair from the website</h3>
        <p className="text-sm mb-6" style={{ color: '#79818A' }}>
          Create a free account to get your pairing code right here — no Telegram needed.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>Login</Link>
          <Link href="/signup" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Create account</Link>
        </div>
      </div>
    );
  }

  if (authed === null) {
    return (
      <div className="text-center py-10">
        <div className="spinner mx-auto mb-4" />
        <p className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#4C535B' }}>Loading…</p>
      </div>
    );
  }

  const devices = data?.devices || [];
  const maxDevices = data?.maxDevices || 1;
  const plan = data?.plan || 'FREE';
  const limitReached = devices.length >= maxDevices;

  return (
    <div className="space-y-6">
      {/* device usage + plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card card-pad" style={{ padding: '22px' }}>
          <p className="mono text-[10px] uppercase tracking-[0.16em] mb-3" style={{ color: '#4C535B' }}>Linked devices</p>
          <p className="stat-num" style={{ color: '#3ECF8E' }}>
            {devices.length} <span className="text-sm font-semibold" style={{ color: '#79818A' }}>/ {maxDevices === 999 ? '∞' : maxDevices}</span>
          </p>
          <p className="text-xs mt-2" style={{ color: '#79818A' }}>
            Plan: <span className="mono font-bold" style={{ color: '#F2A93B' }}>{plan.replace('_', ' ')}</span>
            {data?.endDate && <span className="block mt-0.5">expires {new Date(data.endDate).toLocaleDateString()}</span>}
          </p>
          {limitReached && (
            <p className="text-xs mt-4 px-3 py-2.5" style={{ background: 'rgba(242,169,59,0.06)', border: '1px solid rgba(242,169,59,0.3)', color: '#F2A93B' }}>
              All {maxDevices === 999 ? '∞' : maxDevices} device slot{maxDevices === 1 ? '' : 's'} used. Buy a bigger plan to link more.
            </p>
          )}
        </div>

        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(data?.plans || []).map((p) => {
            const isCurrent = plan === p.key;
            return (
              <div key={p.key} className="card card-pad flex flex-col justify-between" style={{
                padding: '16px',
                background: isCurrent ? 'rgba(242,169,59,0.05)' : '#14181D',
                border: isCurrent ? '1px solid rgba(242,169,59,0.45)' : '1px solid #262C33',
              }}>
                <div>
                  <p className="display font-bold text-sm" style={{ color: '#E9E7E2' }}>{p.name}</p>
                  <p className="stat-num mt-1" style={{ fontSize: '1.25rem', color: isCurrent ? '#F2A93B' : '#3ECF8E' }}>{fmtKes(p.priceKsh)}</p>
                  <p className="mono text-[10px] mb-3" style={{ color: '#4C535B' }}>/ {p.days} days</p>
                </div>
                {isCurrent ? (
                  <span className="mono text-[10px] uppercase tracking-[0.1em] text-center py-2" style={{ background: 'rgba(242,169,59,0.12)', color: '#F2A93B', border: '1px solid rgba(242,169,59,0.35)' }}>
                    Current
                  </span>
                ) : (
                  <button onClick={() => buyPlan(p.key)} disabled={buying !== null}
                    className="btn w-full"
                    style={{
                      padding: '9px 0', fontSize: 10,
                      background: '#F2A93B', color: '#14100A', border: '1px solid #F2A93B',
                      opacity: buying !== null ? 0.5 : 1,
                      cursor: buying !== null ? 'not-allowed' : 'pointer',
                    }}>
                    {buying === p.key ? 'Buying…' : 'Buy with wallet'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3.5" style={{ background: 'rgba(242,169,59,0.05)', border: '1px solid rgba(242,169,59,0.2)' }}>
        <p className="text-sm" style={{ color: '#AEB5BD' }}>
          Pay from your wallet balance. Need more funds?{' '}
          <Link href="/wallet" className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: '#F2A93B', textDecoration: 'none' }}>Deposit now →</Link>
        </p>
      </div>

      {notice && (
        <div className="px-4 py-3 text-sm" style={{ background: 'rgba(62,207,142,0.07)', border: '1px solid rgba(62,207,142,0.3)', color: '#3ECF8E' }}>
          {notice}
        </div>
      )}

      {/* pairing card */}
      <div className="card card-pad" style={{ padding: '24px' }}>
        <h3 className="display font-bold text-base" style={{ color: '#E9E7E2' }}>Pair a new number</h3>
        <p className="text-xs mb-5 mt-1" style={{ color: '#79818A' }}>
          Enter the WhatsApp number you want the bot to run on — your pairing code appears here in seconds.
        </p>

        {pairPhase === 'done' ? (
          <div className="p-5 text-center" style={{ background: 'rgba(62,207,142,0.05)', border: '1px solid rgba(62,207,142,0.3)' }}>
            <p className="mono text-[10px] uppercase tracking-[0.16em] mb-3" style={{ color: '#3ECF8E' }}>Pairing code ready</p>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-[0.2em] my-4 font-mono" style={{ color: '#F2A93B' }}>{pairCode}</p>
            <p className="text-xs leading-relaxed max-w-md mx-auto" style={{ color: '#AEB5BD' }}>
              On your phone: <b style={{ color: '#E9E7E2' }}>WhatsApp → Settings → Linked Devices → Link a Device → Pair with a code</b>, then enter the code above.
              The bot connects automatically once you do. Valid for about an hour.
            </p>
            <button onClick={resetPair} className="btn btn-ghost mt-5" style={{ padding: '10px 18px', fontSize: 10, cursor: 'pointer' }}>
              Pair another number
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={pairNumber}
                onChange={(e) => setPairNumber(e.target.value.replace(/[^\d+]/g, ''))}
                placeholder="254785016388"
                inputMode="tel"
                disabled={pairPhase === 'requesting' || pairPhase === 'waiting'}
                className="input flex-1 font-mono"
                style={{ textAlign: 'center', letterSpacing: '0.08em' }}
              />
              <button
                onClick={startPair}
                disabled={pairPhase === 'requesting' || pairPhase === 'waiting'}
                className="btn btn-primary whitespace-nowrap"
                style={{ opacity: pairPhase === 'requesting' || pairPhase === 'waiting' ? 0.55 : 1, cursor: pairPhase === 'requesting' || pairPhase === 'waiting' ? 'not-allowed' : 'pointer' }}>
                {pairPhase === 'requesting' ? 'Requesting…' : pairPhase === 'waiting' ? 'Waiting for code…' : 'Pair number'}
              </button>
            </div>

            {(pairPhase === 'requesting' || pairPhase === 'waiting') && (
              <div className="flex items-center gap-2.5 mt-4 text-sm" style={{ color: '#AEB5BD' }}>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                {pairPhase === 'requesting' ? 'Requesting the pairing code…' : 'The bot is generating your code — it appears here in a few seconds…'}
              </div>
            )}

            {pairPhase === 'error' && (
              <div className="mt-4 px-4 py-3 text-sm" style={{ background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.3)', color: '#E5484D' }}>
                {pairError}
                <button onClick={resetPair} className="mono ml-2 text-[10px] uppercase tracking-[0.1em] underline" style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#E5484D' }}>Try again</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* linked devices */}
      <div className="card card-pad" style={{ padding: '24px' }}>
        <h3 className="display font-bold text-base mb-4" style={{ color: '#E9E7E2' }}>Your linked devices</h3>
        {devices.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#4C535B' }}>No devices linked yet. Pair your first number above.</p>
        ) : (
          <div className="space-y-2.5">
            {devices.map((d) => (
              <div key={d.number} className="flex items-center justify-between gap-3 px-4 py-3.5"
                style={{ background: 'rgba(15,18,21,0.6)', border: '1px solid #262C33' }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="mono font-bold text-sm truncate" style={{ color: '#E9E7E2' }}>{d.number}</p>
                    <span className="tag tag-green">
                      <span className="dot anim-pulse" /> Active
                    </span>
                  </div>
                  <p className="mono text-[10px] uppercase tracking-[0.1em] mt-1" style={{ color: '#4C535B' }}>
                    {d.connectedAt ? `linked ${new Date(d.connectedAt).toLocaleDateString()}` : 'linked'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => manageDevice(d.number, 'unlink')} disabled={busyNum === d.number}
                    className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em]"
                    style={{
                      color: '#4C7DFC',
                      border: '1px solid rgba(76,125,252,0.35)',
                      background: 'transparent',
                      cursor: busyNum === d.number ? 'not-allowed' : 'pointer',
                      opacity: busyNum === d.number ? 0.5 : 1,
                    }}>
                    Unlink
                  </button>
                  <button onClick={() => manageDevice(d.number, 'delete')} disabled={busyNum === d.number}
                    className="mono px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em]"
                    style={{
                      color: '#E5484D',
                      border: '1px solid rgba(229,72,77,0.35)',
                      background: 'transparent',
                      cursor: busyNum === d.number ? 'not-allowed' : 'pointer',
                      opacity: busyNum === d.number ? 0.5 : 1,
                    }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
