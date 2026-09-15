'use client';

// MZAZI TECH — interactive WhatsApp pairing panel for /whatsapp-bot.
//
// Four-step wizard: enter the number → get a code → instructions on the phone →
// read/copy the code while we watch for the session to come online.
//
// The pairing itself is DB-mediated and unchanged:
//   POST /api/pair            → queues the request, returns { requestId }
//   GET  /api/pair?requestId= → polled for { status, result:{ code } }
//   GET  /api/pair/bots       → selectable bots (only shown when >1)
//   GET  /api/pair/devices    → plan, allowance, devices
//   POST /api/pair/unlink     → { number, action, bot }
//   POST /api/pair/plan       → { plan }

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Button, Card, CardHeader, Badge, StatusIndicator, BotMark, WizardSteps,
  ProgressBar, ConfirmDialog, Alert, EmptyState, humaniseError, planLabel,
  Icons,
} from '@/components/ui';
import { fmtKes } from '@/lib/currency';

const WIZARD_STEPS = ['Enter number', 'Get pairing code', 'On your phone', 'Enter the code'];

function PairStatus({ phase, connected }) {
  if (phase === 'requesting') return <StatusIndicator status="warn" label="Generating pairing code…" pulse className="anim-pulse" />;
  if (phase === 'waiting') return <StatusIndicator status="warn" label="Connecting…" pulse />;
  if (phase === 'done') {
    if (connected) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: 'var(--good)' }} role="status" aria-live="polite">
          <Icons.CheckCircle size={16} /> Connected
        </span>
      );
    }
    return <StatusIndicator status="warn" label="Waiting for pairing" pulse />;
  }
  if (phase === 'error') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: 'var(--bad)' }} role="status" aria-live="polite">
        <Icons.AlertCircle size={16} /> Failed
      </span>
    );
  }
  return null;
}

export default function PairingPanel() {
  const [authed, setAuthed] = useState(null); // null | true | false
  const [data, setData] = useState(null);     // { plan, maxDevices, endDate, devices, plans }

  // which bot
  const [bots, setBots] = useState([]);
  const [botId, setBotId] = useState('');

  // pairing wizard
  const [pairNumber, setPairNumber] = useState('');
  const [pairPhase, setPairPhase] = useState('idle'); // idle | requesting | waiting | done | error
  const [pairCode, setPairCode] = useState('');
  const [pairError, setPairError] = useState('');
  const [requestedNumber, setRequestedNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const pollPairRef = useRef(null);

  // management
  const [busyNum, setBusyNum] = useState(null);
  const [buying, setBuying] = useState(null);
  const [notice, setNotice] = useState(null); // { kind, text }
  const [confirm, setConfirm] = useState(null); // { device, action }

  const selectedBot = bots.find((b) => b.id === botId) || bots[0] || null;
  const botKey = selectedBot ? selectedBot.id : '';
  const multipleBots = bots.length > 1;
  const botName = (id) => (id && bots.find((b) => b.id === id) ? bots.find((b) => b.id === id).name : id);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (!r.ok) { setAuthed(false); return; }
        setAuthed(true);
        loadBots();
        loadDevices();
      })
      .catch(() => setAuthed(false));
  }, []);

  const loadBots = async () => {
    try {
      const res = await fetch('/api/pair/bots', { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();
      if (d && Array.isArray(d.bots) && d.bots.length) {
        setBots(d.bots);
        setBotId((prev) => (d.bots.some((b) => b.id === prev) ? prev : d.bots[0].id));
      }
    } catch { /* selector is optional */ }
  };

  const loadDevices = async () => {
    try {
      const res = await fetch('/api/pair/devices', { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } catch { /* list refreshes on next action */ }
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
            setPairError('Pairing finished but no code came back. Please try again.');
          }
          return;
        }
        if (d.status === 'failed') {
          clearInterval(pollPairRef.current);
          setPairPhase('error');
          setPairError(humaniseError(d.error || 'Pairing failed. Please try again.'));
          return;
        }
      } catch { /* transient — keep polling */ }
      if (attempts >= 40) {
        clearInterval(pollPairRef.current);
        setPairPhase('error');
        setPairError('That took longer than expected. Please try again in a moment.');
      }
    };
    check();
    pollPairRef.current = setInterval(check, 3000);
  };

  // While a code is on screen, quietly watch the device list so the status can
  // flip to a genuine "Connected" instead of guessing.
  useEffect(() => {
    if (pairPhase !== 'done' || !requestedNumber) return;
    let n = 0;
    const t = setInterval(() => {
      n++;
      loadDevices();
      if (n >= 20) clearInterval(t);
    }, 6000);
    return () => clearInterval(t);
  }, [pairPhase, requestedNumber]);

  useEffect(() => () => { if (pollPairRef.current) clearInterval(pollPairRef.current); }, []);

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
    setCopied(false);
    setRequestedNumber(digits);
    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // bot is omitted when there is only one — an untargeted row stays
        // claimable by any bot, which is what this posted before.
        body: JSON.stringify({ number: digits, bot: botKey || undefined }),
      });
      const d = await res.json();
      if (!res.ok) {
        setPairPhase('error');
        setPairError(humaniseError(d.error || 'Failed to start pairing.'));
        return;
      }
      setPairPhase('waiting');
      pollPair(d.requestId);
    } catch (e) {
      setPairPhase('error');
      setPairError(humaniseError(e));
    }
  };

  const resetPair = () => {
    if (pollPairRef.current) clearInterval(pollPairRef.current);
    setPairPhase('idle');
    setPairError('');
    setPairCode('');
    setCopied(false);
    setRequestedNumber('');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(pairCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* clipboard unavailable — the code is still readable */ }
  };

  const manageDevice = async () => {
    if (!confirm) return;
    const { device, action } = confirm;
    const number = device.number;
    const targetBot = device.bot || botKey || undefined;
    setBusyNum(number);
    setNotice(null);
    try {
      const res = await fetch('/api/pair/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, action, bot: targetBot }),
      });
      const d = await res.json();
      setConfirm(null);
      if (!res.ok) { setNotice({ kind: 'error', text: humaniseError(d.error || 'We could not start that action.') }); setBusyNum(null); return; }
      const label = { unlink: 'Logging out', delete: 'Deleting' }[action] || 'Processing';
      setNotice({ kind: 'success', text: `${label} ${number}… the list refreshes in a few seconds.` });
      // the bot picks it up within ~15s — refresh after that
      setTimeout(() => { setBusyNum(null); loadDevices(); }, 14000);
    } catch (e) {
      setConfirm(null);
      setNotice({ kind: 'error', text: humaniseError(e) });
      setBusyNum(null);
    }
  };

  const buyPlan = async (key) => {
    setBuying(key);
    setNotice(null);
    try {
      const res = await fetch('/api/pair/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: key }),
      });
      const d = await res.json();
      if (!res.ok) {
        setNotice({ kind: 'error', text: humaniseError(d.error || 'Failed to buy plan.') });
        setBuying(null);
        return;
      }
      setNotice({ kind: 'success', text: `Plan activated: ${planLabel(d.plan)} — you can now link up to ${d.maxDevices >= 999 ? 'unlimited' : d.maxDevices} devices.` });
      loadDevices();
    } catch (e) {
      setNotice({ kind: 'error', text: humaniseError(e) });
    }
    setBuying(null);
  };

  // ── not logged in ─────────────────────────────────────────────────────────
  if (authed === false) {
    return (
      <Card className="anim-fade-up">
        <EmptyState
          icon={<Icons.Shield size={26} />}
          title="Sign in to pair from the website"
          description="Create a free account to get your pairing code right here — no Telegram needed."
          action={<Button href="/login">Sign in</Button>}
          secondaryAction={<Button href="/signup" variant="ghost">Create account</Button>}
        />
      </Card>
    );
  }

  if (authed === null) {
    return (
      <Card>
        <div className="empty" role="status" aria-live="polite">
          <span className="spinner" />
          <p style={{ margin: 0, color: 'var(--muted)' }}>Loading the pairing panel…</p>
        </div>
      </Card>
    );
  }

  const devices = data?.devices || [];
  const maxDevices = data?.maxDevices || 1;
  const unlimited = maxDevices >= 999;
  const plan = data?.plan || 'FREE';
  const limitReached = !unlimited && devices.length >= maxDevices;
  const stepsPct = unlimited ? 0 : Math.min(100, Math.round((devices.length / Math.max(1, maxDevices)) * 100));
  const busyPair = pairPhase === 'requesting' || pairPhase === 'waiting';
  const connected = !!requestedNumber && devices.some((d) => String(d.number) === String(requestedNumber));

  const stepIndex =
    pairPhase === 'requesting' ? 1
      : pairPhase === 'waiting' ? 2
        : pairPhase === 'done' ? 3
          : 0;

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      {/* ── Pairing wizard ── */}
      <Card className="anim-fade-up">
        <CardHeader
          title="Pair a new number"
          description="Enter the WhatsApp number you want the bot to run on — your pairing code appears here in seconds."
          icon={<Icons.WhatsApp size={18} />}
          action={<PairStatus phase={pairPhase} connected={connected} />}
        />

        <WizardSteps steps={WIZARD_STEPS} current={stepIndex} />

        {/* STEP 1 — number */}
        {(pairPhase === 'idle' || pairPhase === 'error') && (
          <div>
            {multipleBots && (
              <div style={{ marginBottom: 16 }}>
                <p className="label" style={{ marginBottom: 8 }}>Bot</p>
                <div className="grid-2-responsive" style={{ gap: 10 }}>
                  {bots.map((b) => {
                    const active = selectedBot ? selectedBot.id === b.id : false;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBotId(b.id)}
                        aria-pressed={active}
                        className={`option-card ${active ? 'is-selected' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <BotMark name={b.name} compact />
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: b.online ? 'var(--good)' : 'var(--dim)', fontWeight: 600 }}>
                          <span className={`dot ${b.online ? 'dot-online' : 'dot-offline'}`} aria-hidden="true" />
                          {b.online ? 'Online' : b.known ? 'Offline' : 'Never seen'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: 8 }}>
              <label className="label" htmlFor="pair-number">WhatsApp number</label>
              <input
                id="pair-number"
                value={pairNumber}
                onChange={(e) => setPairNumber(e.target.value.replace(/[^\d+]/g, ''))}
                placeholder="+254XXXXXXXXX"
                inputMode="tel"
                autoComplete="tel"
                className="input mono"
                style={{ width: '100%', letterSpacing: '0.04em' }}
              />
              <p className="field-hint">International format — country code first, no spaces. Kenyan numbers look like 254712345678.</p>
            </div>

            {pairPhase === 'error' && (
              <div style={{ marginTop: 14 }}>
                <Alert kind="error" title="We couldn’t start pairing">{pairError}</Alert>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <Button onClick={startPair} block disabled={!pairNumber.trim()} icon={<Icons.Zap size={16} />}>
                Get pairing code
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 — generating */}
        {pairPhase === 'requesting' && (
          <div style={{ textAlign: 'center', padding: '18px 0' }} role="status" aria-live="polite">
            <span className="spinner" style={{ margin: '0 auto 14px' }} />
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }} className="anim-pulse">Generating pairing code…</p>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13.5 }}>Asking {selectedBot?.name || 'the bot'} for a fresh code.</p>
          </div>
        )}

        {/* STEP 3 — instructions */}
        {pairPhase === 'waiting' && (
          <div>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
              {[
                'Open WhatsApp on the phone you’re linking.',
                'Go to Settings → Linked Devices.',
                'Tap Link a Device, then “Link with phone number”.',
                'Your code appears here in a few seconds — enter it on the phone.',
              ].map((s, i) => (
                <li key={s} style={{ display: 'flex', gap: 12 }}>
                  <span className="step-num" aria-hidden="true" style={{ background: 'var(--brand-tint)', color: 'var(--brand)' }}>{i + 1}</span>
                  <span style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{s}</span>
                </li>
              ))}
            </ol>
            <div style={{ marginTop: 16 }}>
              <Alert kind="info">
                Keep this page open — we’re waiting for the code{selectedBot?.name ? ` from ${selectedBot.name}` : ''}. Nothing is frozen; you can leave it.
              </Alert>
            </div>
            <div style={{ marginTop: 14 }}>
              <Button variant="ghost" size="sm" onClick={resetPair}>Cancel</Button>
            </div>
          </div>
        )}

        {/* STEP 4 — code */}
        {pairPhase === 'done' && (
          <div>
            <div style={{ textAlign: 'center', padding: '6px 0 4px' }}>
              <p className="label" style={{ marginBottom: 8 }}>Your pairing code</p>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  padding: '18px 16px', background: 'var(--surface-2)',
                  border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', flexWrap: 'wrap',
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 'clamp(1.6rem, 7vw, 2.2rem)', fontWeight: 800, letterSpacing: '0.18em', color: 'var(--brand)', wordBreak: 'break-all' }}
                >
                  {pairCode}
                </span>
                <Button size="sm" variant="dark" onClick={copyCode} icon={copied ? <Icons.Check size={15} /> : <Icons.Copy size={15} />} aria-label="Copy pairing code">
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              {copied && (
                <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--good)' }} role="status" aria-live="polite">
                  Copied to your clipboard.
                </p>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <Alert kind={connected ? 'success' : 'info'} title={connected ? 'Your number is connected' : 'Now enter the code on your phone'}>
                {connected
                  ? 'WhatsApp accepted the code — this number is now linked and the bot is running on it.'
                  : 'On the phone: WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number, then type the code above. We’ll switch this to “Connected” automatically.'}
              </Alert>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <Button variant="ghost" onClick={resetPair}>Pair another number</Button>
              <Button variant="ghost" href="/devices" icon={<Icons.Phone size={16} />}>Manage devices</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Plan + allowance ── */}
      <Card className="anim-fade-up d1">
        <CardHeader
          title="Your plan"
          description={`${devices.length} of ${unlimited ? 'unlimited' : maxDevices} device${maxDevices === 1 ? '' : 's'} in use`}
          icon={<Icons.Sparkles size={18} />}
          action={<Badge tone="brand">{planLabel(plan)}</Badge>}
        />
        {!unlimited && <ProgressBar value={stepsPct} />}
        <p style={{ margin: '10px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>
          {data?.endDate ? `Plan expires ${new Date(data.endDate).toLocaleDateString()}.` : 'Free plan — never expires.'}
        </p>

        {limitReached && (
          <div style={{ marginTop: 14 }}>
            <Alert kind="warn" title="All device slots are in use">
              Upgrade to link more numbers. <Link className="link" href="/subscription">See plans</Link>
            </Alert>
          </div>
        )}

        <div className="grid-cards" style={{ marginTop: 16 }}>
          {(data?.plans || []).map((p) => {
            const isCurrent = plan === p.key;
            return (
              <div key={p.key} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>{planLabel(p.key)}</p>
                  {isCurrent && <Badge tone="brand">Current</Badge>}
                </div>
                <p className="stat-num tnum" style={{ margin: 0, fontSize: '1.3rem', color: isCurrent ? 'var(--brand)' : 'var(--good)' }}>
                  {fmtKes(p.priceKsh)}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--dim)' }}>
                  {p.maxDevices >= 999 ? 'Unlimited devices' : `${p.maxDevices} devices`} · {p.days} days
                </p>
                {isCurrent ? (
                  <Button variant="ghost" size="sm" disabled block icon={<Icons.Check size={15} />}>Active</Button>
                ) : (
                  <Button variant="dark" size="sm" block onClick={() => buyPlan(p.key)} loading={buying === p.key} loadingText="Buying…">
                    Buy with wallet
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ margin: '14px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>
          Paid from your wallet balance. Need more funds?{' '}
          <Link className="link" href="/wallet">Deposit now</Link>
        </p>
      </Card>

      {/* ── Linked devices ── */}
      <Card className="anim-fade-up d2">
        <CardHeader
          title="Your linked devices"
          description={`${devices.length} connected`}
          icon={<Icons.Phone size={18} />}
          action={<Button variant="ghost" size="sm" href="/devices">Open devices</Button>}
        />

        {notice && (
          <div style={{ marginBottom: 14 }} role="status" aria-live="polite">
            <Alert kind={notice.kind}>{notice.text}</Alert>
          </div>
        )}

        {devices.length === 0 ? (
          <EmptyState
            icon={<Icons.WhatsApp size={26} />}
            title="No devices linked yet."
            description="Pair your first number with the wizard above."
          />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {devices.map((d) => (
              <div
                key={d.number}
                style={{
                  display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p className="mono" style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>{d.number}</p>
                    <Badge tone="good" dot>Active</Badge>
                    {multipleBots && d.bot && <Badge tone="blue">{botName(d.bot)}</Badge>}
                  </div>
                  <p className="mono" style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {d.connectedAt ? `linked ${new Date(d.connectedAt).toLocaleDateString()}` : 'linked'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button size="sm" variant="ghost" disabled={busyNum === d.number} onClick={() => setConfirm({ device: d, action: 'unlink' })} icon={<Icons.LogOut size={15} />}>
                    Logout
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busyNum === d.number} onClick={() => setConfirm({ device: d, action: 'delete' })} icon={<Icons.Trash size={15} />} style={{ color: 'var(--bad)' }}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={manageDevice}
        tone="danger"
        title={confirm?.action === 'delete' ? 'Delete this device?' : 'Log out this device?'}
        description={
          confirm?.action === 'delete'
            ? `${confirm?.device?.number} will be logged out and its session wiped. You can pair it again later.`
            : `${confirm?.device?.number} will be logged out of WhatsApp. It can be paired again later.`
        }
        confirmLabel={confirm?.action === 'delete' ? 'Delete device' : 'Log out'}
      />
    </div>
  );
}
