'use client';

// MZAZI TECH — Connected Devices.
//
// One job: show every WhatsApp number the account is running, how close the
// account is to its plan limit, and let the owner reconnect / log out / delete a
// number without ever hitting a raw error.
//
// Only endpoints already in the product are used:
//   GET  /api/auth/me         → session gate
//   GET  /api/pair/devices    → plan, maxDevices, endDate, devices[]
//   GET  /api/pair/bots       → id → name for the bot a device runs on
//   POST /api/pair/unlink     → { number, action: 'unlink' | 'delete', bot }

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBackground, PageHeader, Button, Card, CardHeader, DeviceCard, Badge,
  EmptyState, ErrorState, SkeletonCards, ProgressBar, ConfirmDialog, Alert,
  planLabel, humaniseError, Icons,
} from '@/components/ui';

const HOW_TO = [
  { title: 'Open the pairing wizard', body: 'Go to the WhatsApp bot page and enter the number you want to connect — include the country code, e.g. 254712345678.' },
  { title: 'Get your pairing code', body: 'Tap “Get pairing code”. Our bot generates an 8-character code, usually within a few seconds.' },
  { title: 'Link it in WhatsApp', body: 'On the phone open WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number, then type the code.' },
  { title: 'It appears here', body: 'Once WhatsApp accepts the code the number shows up on this page as Connected. Reconnect or remove it any time.' },
];

export default function DevicesPage() {
  const router = useRouter();
  const [state, setState] = useState('loading'); // loading | ready | error
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [botNames, setBotNames] = useState({});
  const [busyNumber, setBusyNumber] = useState(null);
  const [confirm, setConfirm] = useState(null); // { device, action }
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { kind, text }

  const load = useCallback(async (silent = false) => {
    if (!silent) setState('loading');
    try {
      const me = await fetch('/api/auth/me');
      if (!me.ok) { router.push('/login'); return; }

      const res = await fetch('/api/pair/devices', { cache: 'no-store' });
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error('Device request failed');
      setData(await res.json());
      setState('ready');

      // Bot names are cosmetic — never let them block the page.
      try {
        const bres = await fetch('/api/pair/bots', { cache: 'no-store' });
        if (bres.ok) {
          const bd = await bres.json();
          const map = {};
          (bd.bots || []).forEach((b) => { map[b.id] = b.name; });
          setBotNames(map);
        }
      } catch { /* names fall back to the raw id */ }
    } catch (e) {
      setErrorMsg(humaniseError(e, 'We could not load your devices. Please try again.'));
      setState('error');
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const runAction = async () => {
    if (!confirm) return;
    const { device, action } = confirm;
    setConfirmBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/pair/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: device.number, action, bot: device.bot || undefined }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ kind: 'error', text: humaniseError(d.error || 'We could not start that action. Please try again.') });
        setConfirm(null);
        setConfirmBusy(false);
        return;
      }
      setNotice({
        kind: 'success',
        text: action === 'delete'
          ? `Deleting ${device.number} — it disappears from this list in a few seconds.`
          : `Logging out ${device.number} — it disappears from this list in a few seconds.`,
      });
      setConfirm(null);
      setConfirmBusy(false);
      setBusyNumber(device.number);
      // The bot picks the request up within ~15s.
      setTimeout(() => { setBusyNumber(null); load(true); }, 15000);
    } catch (e) {
      setNotice({ kind: 'error', text: humaniseError(e) });
      setConfirm(null);
      setConfirmBusy(false);
    }
  };

  const devices = data?.devices || [];
  const maxDevices = data?.maxDevices ?? 1;
  const unlimited = maxDevices >= 999;
  const pct = unlimited ? 0 : Math.min(100, Math.round((devices.length / Math.max(1, maxDevices)) * 100));
  const full = !unlimited && devices.length >= maxDevices;

  const reconnect = (device) => {
    setNotice({ kind: 'info', text: `Re-pair ${device.number} from the WhatsApp bot page to bring it back online.` });
    router.push('/whatsapp-bot');
  };

  return (
    <AppBackground variant="dashboard" image="/images/dashboard-bg.webp" imageOpacity={0.45} scrim={0.55}>
      <div className="container-site" style={{ paddingTop: 26, paddingBottom: 90, maxWidth: 1100 }}>
        <PageHeader
          title="Connected devices"
          description="Every WhatsApp number your account is running, and how many slots your plan allows."
          icon={<Icons.Phone size={20} />}
          actions={<Button href="/whatsapp-bot" icon={<Icons.Plus size={16} />}>Connect WhatsApp</Button>}
          breadcrumb={['Dashboard', 'Devices']}
        />

        {state === 'loading' && <SkeletonCards count={3} height={210} />}

        {state === 'error' && (
          <Card>
            <ErrorState
              title="We couldn’t load your devices"
              message={errorMsg}
              onRetry={() => load()}
            />
          </Card>
        )}

        {state === 'ready' && (
          <>
            {/* ── Device allowance ── */}
            <Card className="anim-fade-up">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <p className="stat-label" style={{ margin: 0 }}>Devices connected</p>
                  <p className="stat-num tnum" style={{ margin: '4px 0 0' }}>
                    {devices.length}
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--muted)' }}>
                      {' '}of {unlimited ? 'Unlimited' : maxDevices}
                    </span>
                  </p>
                </div>
                <Badge tone={unlimited ? 'good' : 'brand'}>{planLabel(data?.plan)} plan</Badge>
              </div>

              {!unlimited && (
                <div className="anim-fade-up d1" style={{ marginTop: 14 }}>
                  <ProgressBar value={pct} />
                </div>
              )}

              {data?.endDate && (
                <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                  Plan renews / expires on {new Date(data.endDate).toLocaleDateString()}
                </p>
              )}

              {full && (
                <div style={{ marginTop: 14 }}>
                  <Alert kind="warn" title="You’ve used every device slot">
                    Upgrade your plan to connect more numbers.{' '}
                    <a className="link" href="/subscription">See plans</a>
                  </Alert>
                </div>
              )}
            </Card>

            {/* ── Feedback ── */}
            {notice && (
              <div style={{ marginTop: 16 }} role="status" aria-live="polite">
                <Alert kind={notice.kind === 'success' ? 'success' : notice.kind === 'error' ? 'error' : 'info'}>
                  {notice.text}
                </Alert>
              </div>
            )}

            {/* ── Device list ── */}
            <div style={{ marginTop: 26 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <h2 className="section-title" style={{ fontSize: '1.15rem', margin: 0 }}>Your numbers</h2>
                <Button variant="ghost" size="sm" onClick={() => load(true)} icon={<Icons.Refresh size={15} />}>
                  Refresh
                </Button>
              </div>

              {devices.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<Icons.WhatsApp size={26} />}
                    title="No WhatsApp devices connected yet."
                    description="Connect your first number to get started."
                    action={<Button href="/whatsapp-bot" icon={<Icons.WhatsApp size={16} />}>Connect WhatsApp</Button>}
                  />
                </Card>
              ) : (
                <div className="grid-cards">
                  {devices.map((d) => (
                    <DeviceCard
                      key={d.number}
                      device={d}
                      botName={d.bot ? (botNames[d.bot] || d.bot) : 'MZAZI bot'}
                      busy={busyNumber === d.number}
                      onReconnect={reconnect}
                      onLogout={(dev) => setConfirm({ device: dev, action: 'unlink' })}
                      onDelete={(dev) => setConfirm({ device: dev, action: 'delete' })}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── How to connect ── */}
            <Card style={{ marginTop: 26 }}>
              <CardHeader
                title="How to connect a number"
                description="Four steps, about two minutes. No QR code, no technical setup."
                icon={<Icons.Help size={18} />}
              />
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
                {HOW_TO.map((s, i) => (
                  <li key={s.title} style={{ display: 'flex', gap: 13 }}>
                    <span
                      aria-hidden="true"
                      className="step-num"
                      style={{ width: 24, height: 24, background: 'var(--brand-tint)', color: 'var(--brand)' }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>{s.title}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div style={{ marginTop: 18 }}>
                <Button href="/whatsapp-bot" variant="dark" icon={<Icons.WhatsApp size={16} />}>
                  Open the pairing wizard
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => { if (!confirmBusy) setConfirm(null); }}
        onConfirm={runAction}
        loading={confirmBusy}
        tone="danger"
        title={confirm?.action === 'delete' ? 'Delete this device?' : 'Log out this device?'}
        description={
          confirm?.action === 'delete'
            ? `${confirm?.device?.number} will be logged out of WhatsApp and its session wiped. You can pair it again later.`
            : `${confirm?.device?.number} will be logged out of WhatsApp. It can be paired again later.`
        }
        confirmLabel={confirm?.action === 'delete' ? 'Delete device' : 'Log out'}
      />
    </AppBackground>
  );
}
