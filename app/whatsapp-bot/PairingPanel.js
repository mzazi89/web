'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { fmtMtc } from '@/lib/currency';

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

  const unlink = async (number) => {
    if (!window.confirm(`Unlink ${number}? The bot will disconnect and delete this session.`)) return;
    setBusyNum(number);
    setNotice('');
    try {
      const res = await fetch('/api/pair/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number }),
      });
      const d = await res.json();
      if (!res.ok) { setNotice(`❌ ${d.error || 'Failed to unlink'}`); setBusyNum(null); return; }
      setNotice(`⏳ Unlinking ${number}…`);
      // the bot picks it up within ~15s — refresh after that
      setTimeout(loadDevices, 14000);
    } catch {
      setNotice('❌ Connection error.');
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
        setNotice(`❌ ${d.error || 'Failed to buy plan'}`);
        setBuying(null);
        return;
      }
      setNotice(`✅ Plan activated: ${d.plan.replace('_', ' ')} — you can now link up to ${d.maxDevices} devices.`);
      loadDevices();
    } catch {
      setNotice('❌ Connection error.');
    }
    setBuying(null);
  };

  // ── not logged in ─────────────────────────────────────────────────────────
  if (authed === false) {
    return (
      <div className="rounded-2xl p-6 sm:p-8 text-center" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
        <div className="text-4xl mb-3">🔐</div>
        <h3 className="font-bold text-lg mb-1" style={{ color: '#f0f4ff' }}>Login to pair from the website</h3>
        <p className="text-sm mb-5" style={{ color: '#64748b' }}>
          Create a free account to get your pairing code right here — no Telegram needed.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link href="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#22c55e,#15803d)', textDecoration: 'none' }}>
            Login
          </Link>
          <Link href="/signup" className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ color: '#94a3b8', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
            Create account
          </Link>
        </div>
      </div>
    );
  }

  if (authed === null) {
    return <div className="text-center py-8 text-sm" style={{ color: '#475569' }}>Loading…</div>;
  }

  const devices = data?.devices || [];
  const maxDevices = data?.maxDevices || 1;
  const plan = data?.plan || 'FREE';
  const limitReached = devices.length >= maxDevices;

  return (
    <div className="space-y-6">
      {/* device usage + plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 rounded-2xl p-5" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Linked devices</p>
          <p className="font-extrabold text-2xl" style={{ color: '#4ade80' }}>
            {devices.length} <span className="text-sm font-semibold" style={{ color: '#64748b' }}>/ {maxDevices === 999 ? '∞' : maxDevices}</span>
          </p>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>
            Plan: <span className="font-bold" style={{ color: '#93c5fd' }}>{plan.replace('_', ' ')}</span>
            {data?.endDate && <span className="block mt-0.5">expires {new Date(data.endDate).toLocaleDateString()}</span>}
          </p>
          {limitReached && (
            <p className="text-xs mt-3 p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
              ⚠️ All {maxDevices === 999 ? '∞' : maxDevices} device slot{maxDevices === 1 ? '' : 's'} used. Buy a bigger plan to link more.
            </p>
          )}
        </div>

        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(data?.plans || []).map((p) => {
            const isCurrent = plan === p.key;
            return (
              <div key={p.key} className="rounded-2xl p-4 flex flex-col justify-between" style={{
                backgroundColor: isCurrent ? 'rgba(34,197,94,0.08)' : '#0f1629',
                border: `1px solid ${isCurrent ? 'rgba(34,197,94,0.4)' : '#1e2d4a'}`,
              }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>{p.name}</p>
                  <p className="text-lg font-extrabold mt-1" style={{ color: '#4ade80' }}>{fmtMtc(p.priceKsh)}</p>
                  <p className="text-[10px] mb-2" style={{ color: '#475569' }}>/ {p.days} days</p>
                </div>
                {isCurrent ? (
                  <span className="text-xs font-bold text-center py-2 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                    ✓ Current
                  </span>
                ) : (
                  <button onClick={() => buyPlan(p.key)} disabled={buying !== null}
                    className="py-2 rounded-lg text-xs font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg,#22c55e,#15803d)',
                      opacity: buying !== null ? 0.5 : 1,
                      cursor: buying !== null ? 'not-allowed' : 'pointer',
                    }}>
                    {buying === p.key ? 'Buying…' : 'Buy with Wallet'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <p className="text-sm" style={{ color: '#94a3b8' }}>
          💳 Pay from your wallet balance. Need more funds?{' '}
          <Link href="/wallet" className="font-bold underline" style={{ color: '#60a5fa' }}>Deposit now →</Link>
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl text-sm" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80' }}>
          {notice}
        </div>
      )}

      {/* pairing card */}
      <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
        <h3 className="font-bold text-base" style={{ color: '#f0f4ff' }}>🔗 Pair a new number</h3>
        <p className="text-xs mb-4 mt-1" style={{ color: '#64748b' }}>
          Enter the WhatsApp number you want the bot to run on — your pairing code appears here in seconds.
        </p>

        {pairPhase === 'done' ? (
          <div className="p-4 sm:p-5 rounded-xl text-center" style={{ backgroundColor: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#4ade80' }}>✅ Pairing code ready</p>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-[0.2em] my-3 font-mono" style={{ color: '#f0f4ff' }}>{pairCode}</p>
            <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
              On your phone: <b style={{ color: '#f0f4ff' }}>WhatsApp → Settings → Linked Devices → Link a Device → Pair with a code</b>, then enter the code above.
              The bot connects automatically once you do. Valid for about an hour.
            </p>
            <button onClick={resetPair} className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ color: '#94a3b8', border: '1px solid #1e2d4a', cursor: 'pointer', background: 'none' }}>
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
                className="flex-1 w-full px-4 py-3 rounded-xl text-sm outline-none font-mono"
                style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
              />
              <button
                onClick={startPair}
                disabled={pairPhase === 'requesting' || pairPhase === 'waiting'}
                className="px-5 py-3 rounded-xl text-sm font-bold text-white whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg,#22c55e,#15803d)',
                  opacity: pairPhase === 'requesting' || pairPhase === 'waiting' ? 0.55 : 1,
                  cursor: pairPhase === 'requesting' || pairPhase === 'waiting' ? 'not-allowed' : 'pointer',
                }}>
                {pairPhase === 'requesting' ? 'Requesting…' : pairPhase === 'waiting' ? 'Waiting for code…' : '🔗 Pair Number'}
              </button>
            </div>

            {(pairPhase === 'requesting' || pairPhase === 'waiting') && (
              <div className="flex items-center gap-2.5 mt-3 text-sm" style={{ color: '#94a3b8' }}>
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                {pairPhase === 'requesting' ? 'Requesting the pairing code…' : 'The bot is generating your code — it appears here in a few seconds…'}
              </div>
            )}

            {pairPhase === 'error' && (
              <div className="mt-3 p-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                ❌ {pairError}
                <button onClick={resetPair} className="ml-2 underline" style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#f87171' }}>Try again</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* linked devices */}
      <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
        <h3 className="font-bold text-base mb-4" style={{ color: '#f0f4ff' }}>📱 Your linked devices</h3>
        {devices.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#475569' }}>No devices linked yet. Pair your first number above.</p>
        ) : (
          <div className="space-y-2.5">
            {devices.map((d) => (
              <div key={d.number} className="flex items-center justify-between gap-3 p-3.5 rounded-xl"
                style={{ backgroundColor: 'rgba(10,10,15,0.72)', border: '1px solid #1e2d4a' }}>
                <div className="min-w-0">
                  <p className="font-mono font-bold text-sm truncate" style={{ color: '#f0f4ff' }}>{d.number}</p>
                  <p className="text-xs" style={{ color: '#475569' }}>
                    {d.connectedAt ? `linked ${new Date(d.connectedAt).toLocaleDateString()}` : 'linked'}
                  </p>
                </div>
                <button onClick={() => unlink(d.number)} disabled={busyNum === d.number}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                  style={{
                    color: '#f87171',
                    border: '1px solid rgba(248,113,113,0.3)',
                    backgroundColor: 'rgba(248,113,113,0.05)',
                    cursor: busyNum === d.number ? 'not-allowed' : 'pointer',
                    opacity: busyNum === d.number ? 0.5 : 1,
                  }}>
                  {busyNum === d.number ? 'Unlinking…' : 'Unlink'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
