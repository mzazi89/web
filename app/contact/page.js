'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const channels = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: '#4C7DFC', title: 'Telegram', desc: 'Replies within minutes.',
    action: 'Open Telegram', href: 'https://t.me/mzazitech',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#3ECF8E', title: 'WhatsApp', desc: 'Chat with support team.',
    action: 'Chat on WhatsApp', href: 'https://wa.me/254108595201',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    color: '#F2A93B', title: 'Email', desc: 'Billing & formal inquiries.',
    action: 'Send Email', href: 'mailto:mzazitechinc@gmail.com',
  },
];

const STATUS_COLOR = { open: '#F2A93B', replied: '#3ECF8E', closed: '#79818A' };

function PenGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#F2A93B' }}>
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function ContactPage() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [threads, setThreads]         = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages]       = useState([]);
  const [msgLoading, setMsgLoading]   = useState(false);
  const [newMsg, setNewMsg]           = useState('');
  const [sending, setSending]         = useState(false);
  const [newSubject, setNewSubject]   = useState('');
  const [composing, setComposing]     = useState(false);
  const [alert, setAlert]             = useState(null);
  // Mobile: 'list' | 'chat' | 'compose'
  const [mobileView, setMobileView]   = useState('list');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) { setUser(d.user); loadThreads(); } })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadThreads = async () => {
    const r = await fetch('/api/inquiries');
    if (r.ok) {
      const d = await r.json();
      setThreads(Array.isArray(d.inquiries) ? d.inquiries : []);
    } else {
      setThreads([]);
    }
  };

  const openThread = async (thread) => {
    setActiveThread(thread);
    setComposing(false);
    setMobileView('chat');
    setMsgLoading(true);
    try {
      const r = await fetch(`/api/inquiries/${thread.id}`);
      if (r.ok) {
        const d = await r.json();
        if (d.messages && d.messages.length > 0) {
          setMessages(d.messages);
        } else if (!d.messages) {
          setMessages([]);
        } else {
          const legacy = [{ id: 'lu', sender: 'user', message: thread.message, created_at: thread.created_at }];
          if (thread.admin_reply) legacy.push({ id: 'la', sender: 'admin', message: thread.admin_reply, created_at: thread.replied_at || thread.created_at });
          setMessages(legacy);
        }
      }
    } finally {
      setMsgLoading(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const backToList = () => {
    setMobileView('list');
    setActiveThread(null);
    setComposing(false);
    setMessages([]);
  };

  const openCompose = () => {
    setComposing(true);
    setActiveThread(null);
    setMessages([]);
    setMobileView('compose');
    setAlert(null);
    setNewMsg('');
    setNewSubject('');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeThread) return;
    setSending(true);
    try {
      const res = await fetch(`/api/inquiries/${activeThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMsg.trim() }),
      });
      if (res.ok) {
        setMessages(m => [...m, { id: Date.now(), sender: 'user', message: newMsg.trim(), created_at: new Date().toISOString() }]);
        setNewMsg('');
        loadThreads();
      }
    } finally { setSending(false); }
  };

  const startNewInquiry = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMsg.trim()) return;
    setSending(true);
    setAlert(null);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newSubject.trim(), message: newMsg.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAlert({ type: 'success', text: 'Inquiry sent! Our team will reply within 2 hours.' });
        setNewSubject(''); setNewMsg('');
        await loadThreads();
        const r2 = await fetch('/api/inquiries');
        if (r2.ok) {
          const d2 = await r2.json();
          const latest = (d2.inquiries || [])[0];
          if (latest) openThread(latest);
        }
      } else {
        setAlert({ type: 'error', text: data.error || 'Failed to send inquiry.' });
      }
    } finally { setSending(false); }
  };

  const fmtTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : '';
  const fmtDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts), today = new Date(), yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ paddingTop: 64, paddingBottom: 40 }}>
        <div className="absolute inset-0 pointer-events-none grid-bg" style={{ maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)' }} />
        <div className="container-site relative">
          <div className="max-w-3xl">
            <span className="tag tag-amber"><span className="dot anim-pulse" /> 24/7 support available</span>
            <h1 className="headline mt-6" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.2rem)' }}>
              Talk to a human<span className="accent">.</span>
            </h1>
            <p className="lede mt-5 max-w-xl">
              Reach out through any channel or message us directly below. Reply within two hours, around the clock.
            </p>
          </div>

          {/* Quick channels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
            {channels.map(c => (
              <a key={c.title} href={c.href} target="_blank" rel="noopener noreferrer"
                className="glow-card card-pad flex items-start gap-4" style={{ textDecoration: 'none', padding: '22px' }}>
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                  style={{ background: `${c.color}14`, color: c.color, border: `1px solid ${c.color}35`, borderRadius: 3 }}>
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <p className="display font-bold text-base mb-0.5" style={{ color: '#E9E7E2' }}>{c.title}</p>
                  <p className="text-xs mb-3" style={{ color: '#79818A' }}>{c.desc}</p>
                  <span className="mono text-[10px] uppercase tracking-[0.12em]" style={{ color: c.color }}>
                    {c.action} →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chat Section ── */}
      <section className="section" style={{ paddingTop: 24, paddingBottom: 110 }}>
        <div className="container-site max-w-6xl">
          {authLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="spinner" />
            </div>
          ) : !user ? (
            <div className="card card-pad text-center py-14">
              <LockGlyph />
              <p className="display font-bold text-xl mt-5 mb-1" style={{ color: '#E9E7E2' }}>Login to send inquiries</p>
              <p className="text-sm mb-7" style={{ color: '#79818A' }}>Log in to chat with our support team directly from here.</p>
              <div className="flex justify-center gap-3">
                <Link href="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>Log in</Link>
                <Link href="/signup" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Sign up</Link>
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden" style={{ background: '#14181D' }}>

              {/* ─────────── MOBILE layout ─────────── */}
              <div className="block md:hidden" style={{ height: 'calc(100dvh - 280px)', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>

                {mobileView === 'list' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Mobile list header */}
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #262C33', background: '#0F1215', flexShrink: 0 }}>
                      <p className="display font-bold text-sm" style={{ color: '#E9E7E2' }}>Support chat</p>
                      <button onClick={openCompose}
                        className="mono flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-[0.1em]"
                        style={{ background: 'rgba(242,169,59,0.1)', color: '#F2A93B', border: '1px solid rgba(242,169,59,0.3)', borderRadius: 2, cursor: 'pointer' }}>
                        <PenGlyph /> New
                      </button>
                    </div>
                    {/* Thread list */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {threads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                          <p className="text-sm font-semibold" style={{ color: '#E9E7E2' }}>No conversations yet</p>
                          <p className="text-xs" style={{ color: '#4C535B' }}>Start a new conversation to contact support.</p>
                          <button onClick={openCompose}
                            className="btn btn-primary mt-2" style={{ padding: '11px 18px', fontSize: 11, cursor: 'pointer' }}>
                            Start chat
                          </button>
                        </div>
                      ) : threads.map(t => (
                        <ThreadRow key={t.id} t={t} active={false} onClick={() => openThread(t)} fmtDate={fmtDate} />
                      ))}
                    </div>
                  </div>
                )}

                {mobileView === 'compose' && (
                  <ComposeForm
                    newSubject={newSubject} setNewSubject={setNewSubject}
                    newMsg={newMsg} setNewMsg={setNewMsg}
                    sending={sending} alert={alert}
                    onBack={backToList} onSubmit={startNewInquiry}
                  />
                )}

                {mobileView === 'chat' && activeThread && (
                  <ChatWindow
                    thread={activeThread} messages={messages} msgLoading={msgLoading}
                    newMsg={newMsg} setNewMsg={setNewMsg}
                    sending={sending} onSend={sendMessage}
                    bottomRef={bottomRef} inputRef={inputRef}
                    fmtTime={fmtTime} fmtDate={fmtDate}
                    onBack={backToList}
                    showBack={true}
                  />
                )}
              </div>

              {/* ─────────── DESKTOP layout ─────────── */}
              <div className="hidden md:flex" style={{ height: '620px' }}>
                {/* Left: thread list */}
                <div style={{ width: '300px', minWidth: '240px', borderRight: '1px solid #262C33', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #262C33', background: '#0F1215', flexShrink: 0 }}>
                    <p className="display font-bold text-sm" style={{ color: '#E9E7E2' }}>Support chat</p>
                    <button onClick={openCompose}
                      className="flex items-center justify-center w-8 h-8"
                      style={{ background: 'rgba(242,169,59,0.1)', color: '#F2A93B', border: '1px solid rgba(242,169,59,0.3)', borderRadius: 2, cursor: 'pointer' }}
                      title="New Inquiry">
                      <PenGlyph />
                    </button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {threads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
                        <p className="text-xs" style={{ color: '#4C535B' }}>No conversations yet. Start one!</p>
                      </div>
                    ) : threads.map(t => (
                      <ThreadRow key={t.id} t={t} active={activeThread?.id === t.id && !composing} onClick={() => openThread(t)} fmtDate={fmtDate} />
                    ))}
                  </div>
                </div>

                {/* Right: chat or compose */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  {composing ? (
                    <ComposeForm
                      newSubject={newSubject} setNewSubject={setNewSubject}
                      newMsg={newMsg} setNewMsg={setNewMsg}
                      sending={sending} alert={alert}
                      onBack={() => { setComposing(false); setAlert(null); }}
                      onSubmit={startNewInquiry}
                      desktop
                    />
                  ) : activeThread ? (
                    <ChatWindow
                      thread={activeThread} messages={messages} msgLoading={msgLoading}
                      newMsg={newMsg} setNewMsg={setNewMsg}
                      sending={sending} onSend={sendMessage}
                      bottomRef={bottomRef} inputRef={inputRef}
                      fmtTime={fmtTime} fmtDate={fmtDate}
                      showBack={false}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <div className="text-center">
                        <p className="display font-bold text-lg mb-1" style={{ color: '#E9E7E2' }}>Your support chats</p>
                        <p className="text-sm mb-6" style={{ color: '#79818A' }}>Select a conversation or start a new one.</p>
                        <button onClick={openCompose}
                          className="btn btn-primary" style={{ cursor: 'pointer' }}>
                          <PenGlyph /> New inquiry
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ── Shared sub-components ─────────────────────────────────────────────────── */

function ThreadRow({ t, active, onClick, fmtDate }) {
  const color = STATUS_COLOR[t.status] || '#F2A93B';
  return (
    <button onClick={onClick} className="w-full text-left px-4 py-3 transition-all"
      style={{
        background: active ? 'rgba(242,169,59,0.06)' : 'transparent',
        borderBottom: '1px solid rgba(38,44,51,0.6)',
        borderLeft: active ? '3px solid #F2A93B' : '3px solid transparent',
        cursor: 'pointer',
      }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: '#E9E7E2' }}>{t.subject}</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#4C535B' }}>
            {t.last_sender === 'admin' ? 'Admin: ' : 'You: '}
            {(t.last_message || t.message || '').slice(0, 38)}{(t.last_message || t.message || '').length > 38 ? '…' : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <p className="mono text-[10px]" style={{ color: '#4C535B' }}>{fmtDate(t.updated_at || t.created_at)}</p>
          <span className="tag" style={{ color, borderColor: `${color}50`, background: `${color}12` }}>
            {t.status}
          </span>
        </div>
      </div>
    </button>
  );
}

function ComposeForm({ newSubject, setNewSubject, newMsg, setNewMsg, sending, alert, onBack, onSubmit, desktop }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3"
        style={{ borderBottom: '1px solid #262C33', background: '#0F1215', flexShrink: 0 }}>
        <button onClick={onBack}
          className="mono text-[11px] uppercase tracking-[0.1em]"
          style={{ color: '#79818A', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back
        </button>
        <p className="display font-bold text-sm" style={{ color: '#E9E7E2' }}>New inquiry</p>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px', gap: '12px', overflowY: 'auto' }}>
        {alert && (
          <div className="px-4 py-3 text-sm"
            style={{
              background: alert.type === 'success' ? 'rgba(62,207,142,0.08)' : 'rgba(229,72,77,0.08)',
              border: `1px solid ${alert.type === 'success' ? 'rgba(62,207,142,0.3)' : 'rgba(229,72,77,0.3)'}`,
              color: alert.type === 'success' ? '#3ECF8E' : '#E5484D',
            }}>{alert.text}</div>
        )}
        <div>
          <label className="label">Subject</label>
          <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)}
            placeholder="e.g. Panel not starting, Billing issue…"
            required className="input" />
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">Message</label>
          <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
            placeholder="Describe your issue in detail…"
            required rows={5} className="input resize-none" style={{ height: '100%', minHeight: 120 }} />
        </div>
        <button type="submit" disabled={sending}
          className="btn btn-primary w-full" style={{ cursor: sending ? 'not-allowed' : 'pointer' }}>
          {sending ? 'Sending…' : 'Send inquiry'}
        </button>
      </form>
    </div>
  );
}

function ChatWindow({ thread, messages, msgLoading, newMsg, setNewMsg, sending, onSend, bottomRef, inputRef, fmtTime, fmtDate, onBack, showBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid #262C33', background: '#0F1215', flexShrink: 0 }}>
        {showBack && (
          <button onClick={onBack}
            className="flex items-center justify-center w-8 h-8 flex-shrink-0"
            style={{ color: '#F2A93B', background: 'rgba(242,169,59,0.08)', border: '1px solid rgba(242,169,59,0.3)', borderRadius: 2, cursor: 'pointer' }}>
            ←
          </button>
        )}
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
          style={{ background: 'rgba(242,169,59,0.12)', border: '1px solid rgba(242,169,59,0.4)', color: '#F2A93B' }}>A</div>
        <div className="min-w-0 flex-1">
          <p className="display font-bold text-sm truncate" style={{ color: '#E9E7E2' }}>{thread.subject}</p>
          <p className="mono text-[10px] uppercase tracking-[0.12em] flex items-center gap-1.5"
            style={{ color: thread.status === 'replied' ? '#3ECF8E' : thread.status === 'open' ? '#F2A93B' : '#79818A' }}>
            <span className="dot" style={{ color: thread.status === 'replied' ? '#3ECF8E' : thread.status === 'open' ? '#F2A93B' : '#79818A' }} />
            {thread.status === 'replied' ? 'Replied' : thread.status === 'open' ? 'Awaiting reply' : 'Closed'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {msgLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-xs" style={{ color: '#4C535B' }}>No messages yet</p>
          </div>
        ) : messages.map((msg, i) => {
          const isUser = msg.sender === 'user';
          const showDate = i === 0 || fmtDate(messages[i - 1].created_at) !== fmtDate(msg.created_at);
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="mono text-[10px] px-3 py-1" style={{ background: '#0F1215', border: '1px solid #262C33', color: '#4C535B' }}>
                    {fmtDate(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
                {!isUser && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mr-2 flex-shrink-0 self-end"
                    style={{ background: 'rgba(242,169,59,0.12)', border: '1px solid rgba(242,169,59,0.4)', color: '#F2A93B' }}>A</div>
                )}
                <div className="px-3.5 py-2.5 text-sm leading-relaxed"
                  style={{
                    maxWidth: 'min(75%, 360px)',
                    background: isUser ? 'rgba(242,169,59,0.14)' : '#1A1F25',
                    border: isUser ? '1px solid rgba(242,169,59,0.4)' : '1px solid #262C33',
                    color: '#E9E7E2',
                    borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  }}>
                  <p className="whitespace-pre-wrap break-words text-sm">{msg.message}</p>
                  <p className="mono text-[10px] mt-1" style={{ color: isUser ? '#F2A93B' : '#4C535B', textAlign: 'right' }}>
                    {fmtTime(msg.created_at)}{isUser ? ' ✓✓' : ''}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid #262C33', background: '#0F1215', flexShrink: 0 }}>
        {thread.status === 'closed' ? (
          <p className="mono text-[10px] uppercase tracking-[0.12em] text-center py-1" style={{ color: '#4C535B' }}>
            This inquiry is closed. Start a new one to contact support.
          </p>
        ) : (
          <form onSubmit={onSend} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(e); } }}
              placeholder="Type a message…"
              rows={1}
              className="input flex-1"
              style={{
                resize: 'none', maxHeight: '100px', lineHeight: '1.5',
                background: '#14181D', padding: '11px 14px',
              }}
            />
            <button type="submit" disabled={sending || !newMsg.trim()}
              className="btn btn-primary flex-shrink-0"
              style={{ padding: '11px 16px', fontSize: 11, cursor: sending || !newMsg.trim() ? 'not-allowed' : 'pointer' }}>
              {sending
                ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, display: 'block' }} />
                : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ display: 'block' }}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
