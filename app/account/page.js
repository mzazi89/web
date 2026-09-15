'use client';

// MZAZI TECH — Account.
//
// Everything here is read from real endpoints and shown honestly. There is no
// profile-update API, so the name/email are displayed (not faked as editable);
// the page says so plainly instead of offering a form that cannot save.
//
// Endpoints used (all pre-existing):
//   GET  /api/auth/me          → { user }
//   GET  /api/auth/security    → { question }
//   POST /api/auth/security    → { question, answer }
//   GET  /api/wallet/balance   → { balance, transactions[] }
//   GET  /api/pair/devices     → { plan, maxDevices, endDate, devices[] }
//   POST /api/auth/logout

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBackground, PageHeader, Button, Card, CardHeader, Badge, Field, Select, Input,
  ThemeToggle, Alert, ErrorState, SkeletonText, humaniseError, planLabel, planTone,
  Icons,
} from '@/components/ui';
import { fmtKes } from '@/lib/currency';

const QUESTIONS = [
  "What is your mother's maiden name?",
  'What was the name of your first pet?',
  'What city were you born in?',
  'What was the name of your primary school?',
  'What is your favourite food?',
];

export default function AccountPage() {
  const router = useRouter();
  const [state, setState] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);
  const [plan, setPlan] = useState(null);

  const [secQuestion, setSecQuestion] = useState(null); // null unknown, '' not set
  const [secForm, setSecForm] = useState({ question: '', answer: '' });
  const [secSaving, setSecSaving] = useState(false);
  const [secNotice, setSecNotice] = useState(null); // { kind, text }
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const me = await fetch('/api/auth/me');
      if (!me.ok) { router.push('/login'); return; }
      const md = await me.json();
      setUser(md.user);

      const [bres, dres] = await Promise.all([
        fetch('/api/wallet/balance'),
        fetch('/api/pair/devices', { cache: 'no-store' }),
      ]);
      if (bres.ok) setBalance((await bres.json()).balance || 0);
      if (dres.ok) setPlan(await dres.json());
      setState('ready');

      try {
        const sres = await fetch('/api/auth/security', { cache: 'no-store' });
        if (sres.ok) {
          const sd = await sres.json();
          setSecQuestion(sd.question || '');
        }
      } catch { /* question is optional */ }
    } catch (e) {
      setErrorMsg(humaniseError(e, 'We could not load your account. Please try again.'));
      setState('error');
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const saveSecurity = async () => {
    if (!secForm.question || secForm.answer.trim().length < 2) {
      setSecNotice({ kind: 'error', text: 'Choose a question and enter an answer (at least 2 characters).' });
      return;
    }
    setSecSaving(true);
    setSecNotice(null);
    try {
      const res = await fetch('/api/auth/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secForm),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSecNotice({ kind: 'error', text: humaniseError(d.error || 'We could not save that. Please try again.') });
        return;
      }
      setSecQuestion(secForm.question);
      setSecForm({ question: '', answer: '' });
      setSecNotice({ kind: 'success', text: 'Security question saved. You can use it to reset your password.' });
    } catch (e) {
      setSecNotice({ kind: 'error', text: humaniseError(e) });
    } finally {
      setSecSaving(false);
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* signing out locally regardless */ }
    router.push('/');
  };

  const displayName = user?.fullname
    || [user?.firstname, user?.lastname].filter(Boolean).join(' ')
    || user?.email
    || 'Member';
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  return (
    <AppBackground variant="dashboard">
      <div className="container-site" style={{ paddingTop: 26, paddingBottom: 90, maxWidth: 1000 }}>
        <PageHeader
          title="Account"
          description="Your profile, security and appearance settings."
          icon={<Icons.User size={20} />}
          breadcrumb={['Dashboard', 'Account']}
        />

        {state === 'loading' && (
          <Card><SkeletonText lines={5} /></Card>
        )}

        {state === 'error' && (
          <Card>
            <ErrorState title="We couldn’t load your account" message={errorMsg} onRetry={() => load()} />
          </Card>
        )}

        {state === 'ready' && (
          <div className="grid-2-responsive">
            <div style={{ display: 'grid', gap: 22 }}>
              {/* ── Profile ── */}
              <Card className="anim-fade-up">
                <CardHeader title="Profile" description="Shown on your account and receipts." icon={<Icons.User size={18} />} />
                <dl style={{ margin: 0, display: 'grid', gap: 14 }}>
                  <div>
                    <dt className="stat-label" style={{ marginBottom: 3 }}>Name</dt>
                    <dd style={{ margin: 0, fontSize: 15.5, fontWeight: 600, color: 'var(--ink)' }}>{displayName}</dd>
                  </div>
                  <div>
                    <dt className="stat-label" style={{ marginBottom: 3 }}>Email</dt>
                    <dd style={{ margin: 0, fontSize: 15, color: 'var(--ink-2)', wordBreak: 'break-word' }}>{user?.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="stat-label" style={{ marginBottom: 3 }}>Member since</dt>
                    <dd style={{ margin: 0, fontSize: 15, color: 'var(--ink-2)' }}>{memberSince || '—'}</dd>
                  </div>
                </dl>
                <p style={{ margin: '16px 0 0', fontSize: 12.5, color: 'var(--dim)', lineHeight: 1.6 }}>
                  Your name and email can’t be edited here yet. To change them, message support from the{' '}
                  <a className="link" href="/help">Help page</a>.
                </p>
              </Card>

              {/* ── Security ── */}
              <Card className="anim-fade-up d1">
                <CardHeader
                  title="Security question"
                  description="Answer it correctly to reset your password if you ever forget it."
                  icon={<Icons.Shield size={18} />}
                />

                {secQuestion ? (
                  <div style={{ marginBottom: 14 }}>
                    <Alert kind="brand" title="Currently set">“{secQuestion}”</Alert>
                  </div>
                ) : secQuestion === '' ? (
                  <div style={{ marginBottom: 14 }}>
                    <Alert kind="info">Not set yet — add one below so you can recover your password.</Alert>
                  </div>
                ) : null}

                <Field label="Question" id="acct-q">
                  <Select
                    id="acct-q"
                    value={secForm.question}
                    onChange={(e) => setSecForm((f) => ({ ...f, question: e.target.value }))}
                  >
                    <option value="">Choose a question…</option>
                    {QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                  </Select>
                </Field>

                <Field label="Answer" id="acct-a" hint="Stored securely — we never show it again.">
                  <Input
                    id="acct-a"
                    type="text"
                    value={secForm.answer}
                    onChange={(e) => setSecForm((f) => ({ ...f, answer: e.target.value }))}
                    placeholder="Your answer"
                    autoComplete="off"
                  />
                </Field>

                {secNotice && (
                  <div style={{ marginBottom: 14 }} role="status" aria-live="polite">
                    <Alert kind={secNotice.kind}>{secNotice.text}</Alert>
                  </div>
                )}

                <Button onClick={saveSecurity} loading={secSaving} loadingText="Saving…" variant="dark">
                  {secQuestion ? 'Update security question' : 'Set security question'}
                </Button>
              </Card>
            </div>

            <div style={{ display: 'grid', gap: 22, alignContent: 'start' }}>
              {/* ── Appearance ── */}
              <Card className="anim-fade-up d1">
                <CardHeader title="Appearance" description="Choose how the site looks to you." icon={<Icons.Sun size={18} />} />
                <ThemeToggle variant="segmented" />
                <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'var(--dim)' }}>
                  “System” follows your device’s light/dark setting.
                </p>
              </Card>

              {/* ── Wallet summary ── */}
              <Card className="anim-fade-up d2">
                <CardHeader title="Wallet" description="Used to pay for plans." icon={<Icons.Wallet size={18} />} />
                <p className="stat-num tnum" style={{ margin: 0, color: 'var(--brand)' }}>
                  {balance === null ? '—' : fmtKes(balance)}
                </p>
                <p className="stat-label" style={{ marginTop: 4 }}>Available balance</p>
                <div style={{ marginTop: 14 }}>
                  <Button href="/wallet" variant="ghost" block icon={<Icons.Wallet size={16} />}>Open wallet</Button>
                </div>
              </Card>

              {/* ── Plan summary ── */}
              <Card className="anim-fade-up d3">
                <CardHeader title="Plan" description="Your WhatsApp bot subscription." icon={<Icons.Sparkles size={18} />} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Badge tone={planTone(plan?.plan)}>{planLabel(plan?.plan)}</Badge>
                  <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                    {plan?.maxDevices >= 999 ? 'Unlimited devices' : `${plan?.maxDevices ?? 1} device${(plan?.maxDevices ?? 1) === 1 ? '' : 's'}`}
                  </span>
                </div>
                <p style={{ margin: '10px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>
                  {plan?.endDate ? `Expires ${new Date(plan.endDate).toLocaleDateString()}` : 'Never expires'}
                </p>
                <div style={{ marginTop: 14 }}>
                  <Button href="/subscription" variant="ghost" block icon={<Icons.Sparkles size={16} />}>Manage plan</Button>
                </div>
              </Card>

              {/* ── Sign out ── */}
              <Card className="anim-fade-up d3">
                <CardHeader title="Sign out" description="End this session on this device." icon={<Icons.LogOut size={18} />} />
                <Button variant="danger" onClick={signOut} loading={signingOut} loadingText="Signing out…" icon={<Icons.LogOut size={16} />}>
                  Sign out
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppBackground>
  );
}
