'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Icons, Ring } from '@/components/ui';

// MZAZI TECH — disposable inbox.
//
// One job: hand somebody an address they can paste into a signup form, then show
// what arrives. The list refreshes itself while the tab is visible and stops
// when it is not — polling a hidden tab burns other people's quota for nothing.
//
// Nothing here is decorative: every control creates, refreshes, copies, opens or
// deletes something real.

const POLL_MS = 8000;

const clock = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const left = (expiresAt) => {
  if (!expiresAt) return '';
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const m = Math.floor(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m left` : `${m}m left`;
};

export default function TempMailPage() {
  const [box, setBox] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/temp-mail', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) { setNote(data?.error || 'Could not reach the mail service.'); return; }
      setBox(data.address ? { address: data.address, expiresAt: data.expiresAt } : null);
      setMessages(data.messages || []);
    } catch {
      setNote('Network error — retrying automatically.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll only while the tab is in front, and re-check on return.
  useEffect(() => {
    if (!box) return undefined;
    const tick = () => { if (!document.hidden) load(); };
    timer.current = setInterval(tick, POLL_MS);
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer.current); document.removeEventListener('visibilitychange', onVisible); };
  }, [box, load]);

  async function create() {
    setBusy(true); setNote('');
    try {
      const res = await fetch('/api/temp-mail', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setNote(data?.error || 'Could not create an inbox.'); return; }
      setBox({ address: data.address, expiresAt: data.expiresAt });
      setMessages(data.messages || []);
    } catch {
      setNote('Network error — try again.');
    } finally { setBusy(false); }
  }

  async function destroy() {
    setBusy(true);
    try {
      await fetch('/api/temp-mail', { method: 'DELETE' });
      setBox(null); setMessages([]); setOpen(null); setNote('');
    } finally { setBusy(false); }
  }

  async function copy() {
    if (!box) return;
    try {
      await navigator.clipboard.writeText(box.address);
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    } catch { setNote('Copy failed — select the address and copy it manually.'); }
  }

  async function openMessage(id) {
    setOpen({ loading: true, id });
    try {
      const res = await fetch(`/api/temp-mail/${id}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) { setOpen({ error: data?.error || 'Could not open that message.' }); return; }
      setOpen({ ...data, loading: false });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, seen: true } : m)));
    } catch { setOpen({ error: 'Network error.' }); }
  }

  const unread = useMemo(() => messages.filter((m) => !m.seen).length, [messages]);

  return (
    <div className="wrap" style={{ paddingTop: 22, paddingBottom: 40 }}>
      <section className="anim-fade-up d1">
        <p className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--dim)' }}>Free tool</p>
        <h1 className="section-title" style={{ marginTop: 6 }}>Temporary email</h1>
        <p className="lede mt-3" style={{ maxWidth: 620 }}>
          An address that receives real mail and disappears in an hour. Use it for one signup,
          a download wall, or anything that will send you newsletters forever.
        </p>
      </section>

      {note && <p className="tm-note">{note}</p>}

      {loading ? (
        <div className="tm-loading"><Ring size={26} /><span>Opening…</span></div>
      ) : !box ? (
        <Card className="tm-hero anim-fade-up d2">
          <div className="tm-hero-ico"><Icons.Mail size={22} /></div>
          <h2>No address yet</h2>
          <p>Create one and it is ready to receive in a second. No account, no password, no phone number.</p>
          <Button onClick={create} loading={busy} icon={<Icons.Plus size={16} />}>Create an inbox</Button>
          <ul className="tm-facts">
            <li><Icons.Check size={13} /> Receives real mail, not a mock</li>
            <li><Icons.Check size={13} /> Deleted after 60 minutes</li>
            <li><Icons.Check size={13} /> Plain text only — HTML is stripped</li>
          </ul>
        </Card>
      ) : (
        <>
          <Card className="tm-address anim-fade-up d2">
            <div className="tm-addr-main">
              <span className="tm-label">Your address</span>
              <code className="tm-code">{box.address}</code>
              <span className="tm-expiry"><Icons.Clock size={12} /> {left(box.expiresAt)}</span>
            </div>
            <div className="tm-addr-actions">
              <Button size="sm" variant="ghost" onClick={copy} icon={<Icons.Copy size={14} />}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button size="sm" variant="ghost" onClick={load} icon={<Icons.Refresh size={14} />}>Refresh</Button>
              <Button size="sm" variant="ghost" onClick={destroy} loading={busy} icon={<Icons.Trash size={14} />}>Delete</Button>
            </div>
          </Card>

          <div className="tm-inbox-head">
            <h2>Inbox {unread > 0 && <span className="tm-badge">{unread} new</span>}</h2>
            <span className="tm-hint">Refreshes every 8 seconds</span>
          </div>

          {messages.length === 0 ? (
            <div className="tm-empty">
              <Icons.Mail size={26} />
              <p>Waiting for the first message.</p>
              <span>Anything sent to <strong>{box.address}</strong> appears here.</span>
            </div>
          ) : (
            <ul className="tm-list">
              {messages.map((m) => (
                <li key={m.id}>
                  <button type="button" className={`tm-row ${m.seen ? '' : 'is-new'}`} onClick={() => openMessage(m.id)}>
                    <span className="tm-row-av">{(m.fromName || m.from || '?').slice(0, 1).toUpperCase()}</span>
                    <span className="tm-row-body">
                      <span className="tm-row-top">
                        <strong>{m.fromName || m.from}</strong>
                        <time>{clock(m.at)}</time>
                      </span>
                      <span className="tm-row-subject">{m.subject}</span>
                      <span className="tm-row-intro">{m.intro}</span>
                    </span>
                    {!m.seen && <span className="tm-dot" aria-label="unread" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {open && (
        <div className="tm-modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="tm-sheet">
            <div className="tm-sheet-head">
              <div>
                <strong>{open.loading ? 'Opening…' : open.subject}</strong>
                <span>{open.loading ? '' : `${open.fromName || open.from} · ${clock(open.at)}`}</span>
              </div>
              <button type="button" onClick={() => setOpen(null)} aria-label="Close">×</button>
            </div>
            {open.loading ? (
              <div className="tm-loading"><Ring size={22} /></div>
            ) : open.error ? (
              <p className="tm-note">{open.error}</p>
            ) : (
              <pre className="tm-body">{open.text || '(This message has no text body.)'}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
