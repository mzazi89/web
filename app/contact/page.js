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
    color: '#0088cc', title: 'Telegram', desc: 'Replies within minutes.',
    action: 'Open Telegram', href: 'https://t.me/mzazitech',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25d366', title: 'WhatsApp', desc: 'Chat with support team.',
    action: 'Chat on WhatsApp', href: 'https://wa.me/254108595201',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    color: '#3b82f6', title: 'Email', desc: 'Billing & formal inquiries.',
    action: 'Send Email', href: 'mailto:mzazitechinc@gmail.com',
  },
];

const STATUS_COLOR = { open: '#fb923c', replied: '#4ade80', closed: '#64748b' };

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
    if (r.ok) { const d = await r.json(); setThreads(d.inquiries || []); }
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
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', text: '✅ Inquiry sent! Our team will reply within 2 hours.' });
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
    <div style={{ backgroundColor: '#0a0a0f', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section className="relative py-14 sm:py-20" style={{ background: 'linear-gradient(180deg,#071428 0%,#0a0a0f 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)' }}>
            💬 24/7 Support Available
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-3" style={{ color: '#f0f4ff' }}>Contact Us</h1>
          <p className="text-sm sm:text-lg" style={{ color: '#64748b' }}>
            Reach out through any channel or message us directly below.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12">

        {/* ── Quick channels ── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-8">
          {channels.map(c => (
            <a key={c.title} href={c.href} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center p-3 sm:p-5 rounded-2xl transition-all hover:scale-[1.02] text-center no-underline"
              style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-2 sm:mb-3"
                style={{ backgroundColor: `${c.color}18`, color: c.color, border: `1px solid ${c.color}30` }}>
                {c.icon}
              </div>
              <p className="font-bold text-xs sm:text-sm mb-0.5 sm:mb-1" style={{ color: '#f0f4ff' }}>{c.title}</p>
              <p className="text-xs hidden sm:block mb-3" style={{ color: '#64748b' }}>{c.desc}</p>
              <span className="text-xs font-semibold px-2 py-1 rounded-lg hidden sm:inline-block"
                style={{ backgroundColor: `${c.color}18`, color: c.color, border: `1px solid ${c.color}30` }}>
                {c.action}
              </span>
            </a>
          ))}
        </div>

        {/* ── Chat Section ── */}
        {authLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
          </div>
        ) : !user ? (
          <div className="rounded-2xl p-8 sm:p-10 text-center" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
            <div className="text-5xl mb-4">🔒</div>
            <p className="font-bold text-lg mb-2" style={{ color: '#f0f4ff' }}>Login to Send Inquiries</p>
            <p className="text-sm mb-6" style={{ color: '#64748b' }}>Log in to chat with our support team directly from here.</p>
            <div className="flex justify-center gap-3">
              <Link href="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>Log In</Link>
              <Link href="/signup" className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#1e2d4a', color: '#94a3b8', textDecoration: 'none' }}>Sign Up</Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>

            {/* ─────────── MOBILE layout ─────────── */}
            <div className="block md:hidden" style={{ height: 'calc(100dvh - 280px)', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>

              {mobileView === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Mobile list header */}
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1e2d4a', backgroundColor: '#0a0c16', flexShrink: 0 }}>
                    <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Support Chat</p>
                    <button onClick={openCompose}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.25)', cursor: 'pointer' }}>
                      ✏️ New
                    </button>
                  </div>
                  {/* Thread list */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {threads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                        <div className="text-4xl">💬</div>
                        <p className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>No conversations yet</p>
                        <p className="text-xs" style={{ color: '#475569' }}>Tap New to start a conversation with support.</p>
                        <button onClick={openCompose}
                          className="px-4 py-2 rounded-xl text-sm font-bold text-white mt-2"
                          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', cursor: 'pointer' }}>
                          Start Chat
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
              <div style={{ width: '300px', minWidth: '240px', borderRight: '1px solid #1e2d4a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1e2d4a', backgroundColor: '#0a0c16', flexShrink: 0 }}>
                  <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Support Chat</p>
                  <button onClick={openCompose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                    style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.25)', cursor: 'pointer' }}
                    title="New Inquiry">✏️</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
                      <div className="text-4xl">💬</div>
                      <p className="text-xs" style={{ color: '#475569' }}>No conversations yet. Start one!</p>
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
                    <div className="text-6xl">💬</div>
                    <div className="text-center">
                      <p className="font-bold mb-1" style={{ color: '#f0f4ff' }}>Your Support Chats</p>
                      <p className="text-sm mb-5" style={{ color: '#64748b' }}>Select a conversation or start a new one.</p>
                      <button onClick={openCompose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', cursor: 'pointer' }}>
                        ✏️ New Inquiry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </section>
    </div>
  );
}

/* ── Shared sub-components ─────────────────────────────────────────────────── */

function ThreadRow({ t, active, onClick, fmtDate }) {
  const color = STATUS_COLOR[t.status] || '#fb923c';
  return (
    <button onClick={onClick} className="w-full text-left px-4 py-3 transition-all"
      style={{
        backgroundColor: active ? 'rgba(37,99,235,0.1)' : 'transparent',
        borderBottom: '1px solid rgba(30,45,74,0.5)',
        borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
        cursor: 'pointer',
      }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: '#f0f4ff' }}>{t.subject}</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#475569' }}>
            {t.last_sender === 'admin' ? '🛡 Admin: ' : 'You: '}
            {(t.last_message || t.message || '').slice(0, 38)}{(t.last_message || t.message || '').length > 38 ? '…' : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <p className="text-xs" style={{ color: '#374151' }}>{fmtDate(t.updated_at || t.created_at)}</p>
          <span className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}30` }}>
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
        style={{ borderBottom: '1px solid #1e2d4a', backgroundColor: '#0a0c16', flexShrink: 0 }}>
        <button onClick={onBack}
          className="flex items-center gap-1 text-sm"
          style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← {desktop ? 'Back' : 'Back'}
        </button>
        <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>New Inquiry</p>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px', gap: '12px', overflowY: 'auto' }}>
        {alert && (
          <div className="p-3 rounded-xl text-sm"
            style={{
              backgroundColor: alert.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${alert.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: alert.type === 'success' ? '#4ade80' : '#f87171',
            }}>{alert.text}</div>
        )}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>Subject</label>
          <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)}
            placeholder="e.g. Panel not starting, Billing issue…"
            required className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#1e2d4a'}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>Message</label>
          <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
            placeholder="Describe your issue in detail…"
            required rows={5} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff', width: '100%' }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#1e2d4a'}
          />
        </div>
        <button type="submit" disabled={sending}
          className="w-full py-3 rounded-xl font-bold text-sm text-white"
          style={{ background: sending ? '#1e2d4a' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: sending ? 'not-allowed' : 'pointer', border: 'none' }}>
          {sending ? 'Sending…' : '📨 Send Inquiry'}
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
        style={{ borderBottom: '1px solid #1e2d4a', backgroundColor: '#0a0c16', flexShrink: 0 }}>
        {showBack && (
          <button onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
            style={{ color: '#60a5fa', backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', cursor: 'pointer' }}>
            ←
          </button>
        )}
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff' }}>A</div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm truncate" style={{ color: '#f0f4ff' }}>{thread.subject}</p>
          <p className="text-xs" style={{ color: thread.status === 'replied' ? '#4ade80' : thread.status === 'open' ? '#fb923c' : '#64748b' }}>
            {thread.status === 'replied' ? '● Replied' : thread.status === 'open' ? '⏳ Awaiting reply' : '● Closed'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {msgLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="text-3xl">💬</div>
            <p className="text-xs" style={{ color: '#374151' }}>No messages yet</p>
          </div>
        ) : messages.map((msg, i) => {
          const isUser = msg.sender === 'user';
          const showDate = i === 0 || fmtDate(messages[i - 1].created_at) !== fmtDate(msg.created_at);
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="text-xs px-3 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(30,45,74,0.8)', color: '#475569' }}>
                    {fmtDate(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
                {!isUser && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mr-2 flex-shrink-0 self-end"
                    style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff' }}>A</div>
                )}
                <div className="px-3 py-2 text-sm leading-relaxed"
                  style={{
                    maxWidth: 'min(75%, 360px)',
                    background: isUser ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#1a2640',
                    color: '#fff',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: isUser ? '0 2px 8px rgba(37,99,235,0.25)' : '0 1px 4px rgba(0,0,0,0.3)',
                  }}>
                  <p className="whitespace-pre-wrap break-words text-sm">{msg.message}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>
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
      <div className="px-3 py-3" style={{ borderTop: '1px solid #1e2d4a', backgroundColor: '#0a0c16', flexShrink: 0 }}>
        {thread.status === 'closed' ? (
          <p className="text-xs text-center py-1" style={{ color: '#475569' }}>
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
              className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none"
              style={{
                backgroundColor: '#111827', border: '1px solid #1e2d4a', color: '#f0f4ff',
                resize: 'none', maxHeight: '100px', lineHeight: '1.5',
              }}
            />
            <button type="submit" disabled={sending || !newMsg.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: sending || !newMsg.trim() ? '#1e2d4a' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                cursor: sending || !newMsg.trim() ? 'not-allowed' : 'pointer', border: 'none',
              }}>
              {sending
                ? <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
