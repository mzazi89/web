'use client';

// MZAZI TECH — Help & Support.
//
// A short, genuinely useful FAQ (collapsed with <details> so it never crowds)
// plus a real support form wired to the existing POST /api/inquiries endpoint.
//
// Endpoints used (pre-existing):
//   GET  /api/auth/me        → whether the visitor can send a message
//   POST /api/inquiries      → { subject, message }

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AppBackground, PageHeader, Button, Card, CardHeader, Field, Input, Textarea,
  Alert, humaniseError, Icons,
} from '@/components/ui';

const FAQ = [
  {
    q: 'How do I connect a WhatsApp number?',
    a: 'Open the WhatsApp bot page and enter your number in international format (country code first, no + or spaces — e.g. 254712345678 for Kenya). Tap “Get pairing code”, then follow the on-screen steps. Your number appears under Connected devices once WhatsApp accepts it.',
  },
  {
    q: 'Where do I get the pairing code?',
    a: 'The code is generated for you on the WhatsApp bot page — tap “Get pairing code” and it appears within a few seconds. Each code is single-use and valid for roughly an hour. If it expires, just generate a new one.',
  },
  {
    q: 'How many devices can I connect?',
    a: 'It depends on your plan — the Free plan covers 1 number, and paid plans cover 5, 10, 20 or unlimited numbers. Your current allowance and usage are always shown at the top of the Connected devices page.',
  },
  {
    q: 'How do upgrades and billing work?',
    a: 'Plans are paid from your wallet balance, so there is no separate card charge. Add money to your wallet, then choose a plan on the Subscription page. Upgrades apply immediately, and the allowance is usable straight away.',
  },
  {
    q: 'My device shows as offline — what should I do?',
    a: 'Give it a minute: the bot reconnects automatically after a brief network blip. If it stays offline, open Connected devices and use Reconnect to re-pair the number. If it still fails, send us a message below and we will look at the session.',
  },
];

export default function HelpPage() {
  const [authed, setAuthed] = useState(null); // null | true | false
  const [form, setForm] = useState({ subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.subject.trim()) next.subject = 'Please add a short subject.';
    if (!form.message.trim()) next.message = 'Please describe your issue.';
    else if (form.message.trim().length < 10) next.message = 'Please add a little more detail (at least 10 characters).';
    setErrors(next);
    setFailure('');
    if (Object.keys(next).length) return;

    setSending(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: form.subject.trim(), message: form.message.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setSent(true);
        setForm({ subject: '', message: '' });
        return;
      }
      if (res.status === 401) {
        setFailure('Please sign in to send us a message.');
      } else {
        setFailure(humaniseError(d.error || 'We could not send your message. Please try again.'));
      }
    } catch (e) {
      setFailure(humaniseError(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <AppBackground variant="dashboard">
      <div className="container-site" style={{ paddingTop: 26, paddingBottom: 90, maxWidth: 900 }}>
        <PageHeader
          title="Help & support"
          description="Quick answers about pairing, device limits and billing — and a direct line to our team."
          icon={<Icons.Help size={20} />}
          actions={
            <Button href="https://t.me/mzazitech" variant="ghost" icon={<Icons.Send size={16} />}>
              Telegram support
            </Button>
          }
          breadcrumb={['Support']}
        />

        {/* ── FAQ ── */}
        <Card className="anim-fade-up" style={{ marginBottom: 22 }}>
          <CardHeader
            title="Frequently asked questions"
            description="Tap a question to expand it."
            icon={<Icons.Info size={18} />}
          />
          <div style={{ display: 'grid', gap: 10 }}>
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="card"
                style={{ padding: '14px 16px', background: 'var(--surface-2)' }}
              >
                <summary
                  style={{
                    cursor: 'pointer', fontWeight: 700, color: 'var(--ink)',
                    fontSize: 14.5, listStyle: 'none', display: 'flex',
                    alignItems: 'center', gap: 10, minHeight: 24,
                  }}
                >
                  <Icons.ChevronRight size={15} />
                  {item.q}
                </summary>
                <p style={{ margin: '10px 0 2px 25px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Card>

        {/* ── Support form ── */}
        <Card className="anim-fade-up d1" style={{ marginBottom: 22 }}>
          <CardHeader
            title="Still stuck? Send us a message"
            description="Tell us what happened and we’ll reply within about 2 hours."
            icon={<Icons.Send size={18} />}
          />

          {sent ? (
            <Alert kind="success" title="Message sent">
              Thanks — we’ve received your message and will reply by email. You can also reach us on{' '}
              <a className="link" href="https://t.me/mzazitech" target="_blank" rel="noopener noreferrer">Telegram</a>.
              <div style={{ marginTop: 12 }}>
                <Button size="sm" variant="ghost" onClick={() => setSent(false)}>Send another</Button>
              </div>
            </Alert>
          ) : (
            <form onSubmit={submit} noValidate>
              {failure && (
                <div style={{ marginBottom: 16 }}>
                  <Alert kind="error">{failure}</Alert>
                </div>
              )}

              <Field label="Subject" id="help-subject" required error={errors.subject}>
                <Input
                  id="help-subject"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. Device shows offline after pairing"
                  maxLength={255}
                  error={errors.subject}
                />
              </Field>

              <Field label="Message" id="help-message" required error={errors.message} hint="Include the number or plan involved if relevant.">
                <Textarea
                  id="help-message"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Describe what happened, and what you expected…"
                  error={errors.message}
                />
              </Field>

              {authed === false && (
                <div style={{ marginBottom: 14 }}>
                  <Alert kind="info">
                    You’ll need an account to send a message.{' '}
                    <Link className="link" href="/login">Sign in</Link> or{' '}
                    <Link className="link" href="/signup">create one</Link>.
                  </Alert>
                </div>
              )}

              <Button type="submit" loading={sending} loadingText="Sending…" icon={<Icons.Send size={16} />}>
                Send message
              </Button>
            </form>
          )}
        </Card>

        {/* ── Other ways to reach us ── */}
        <Card className="anim-fade-up d2">
          <CardHeader title="Other ways to reach us" icon={<Icons.ExternalLink size={18} />} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Button href="https://t.me/mzazitech" variant="dark" icon={<Icons.Send size={16} />}>
              Telegram — t.me/mzazitech
            </Button>
            <Button href="/contact" variant="ghost" icon={<Icons.Help size={16} />}>
              Contact page
            </Button>
          </div>
        </Card>
      </div>
    </AppBackground>
  );
}
