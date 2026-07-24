'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

const channels = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: '#0088cc', title: 'Telegram Support',
    desc: 'Fastest response — our team replies within minutes.',
    action: 'Open Telegram', href: 'https://t.me/mzazitech',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25d366', title: 'WhatsApp',
    desc: 'Chat directly with our support team.',
    action: 'Chat on WhatsApp', href: 'https://wa.me/254108595201',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    color: '#3b82f6', title: 'Email',
    desc: 'For billing, partnerships, and formal inquiries.',
    action: 'mzazitechinc@gmail.com', href: 'mailto:mzazitechinc@gmail.com',
  },
];

export default function ContactPage() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [threads, setThreads]         = useState([]);
  const [activeThread, setActiveThread] = useState(null);   // { id, subject, ... }
  const [messages, setMessages]       = useState([]);
  const [msgLoading, setMsgLoading]   = useState(false);
  const [newMsg, setNewMsg]           = useState('');
  const [sending, setSending]         = useState(false);
  const [newSubject, setNewSubject]   = useState('');
  const [composing, setComposing]     = useState(false);   // new inquiry form visible
  const [alert, setAlert]             = useState(null);
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
    setMsgLoading(true);
    try {
      const r = await fetch(`/api/inquiries/${thread.id}`);
      if (r.ok) {
        const d = await r.json();
        // If no messages table entries yet, fall back to the legacy message + admin_reply
        if (d.messages && d.messages.length > 0) {
          setMessages(d.messages);
        } else {
          // Build legacy view
          const legacy = [{ id: 'legacy-user', sender: 'user', message: thread.message, created_at: thread.created_at }];
          if (thread.admin_reply) {
            legacy.push({ id: 'legacy-admin', sender: 'admin', message: thread.admin_reply, created_at: thread.replied_at || thread.created_at });
          }
          setMessages(legacy);
        }
      }
    } finally {
      setMsgLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
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
        const optimistic = { id: Date.now(), sender: 'user', message: newMsg.trim(), created_at: new Date().toISOString() };
        setMessages(m => [...m, optimistic]);
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
        setNewSubject('');
        setNewMsg('');
        setComposing(false);
        await loadThreads();
        // Auto-open the new thread
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

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const statusColor = { open: '#fb923c', replied: '#4ade80', closed: '#64748b' };

  return (
    <div style={{ backgroundColor: '#0a0a0f', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section className="relative py-20" style={{ background: 'linear-gradient(180deg, #071428 0%, #0a0a0f 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
            style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)' }}>
            💬 24/7 Support Available
          </div>
          <h1 className="text-5xl font-extrabold mb-4" style={{ color: '#f0f4ff' }}>Contact Us</h1>
          <p className="text-lg" style={{ color: '#64748b' }}>
            We're here to help. Reach out through any channel or message us directly below.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">

        {/* ── Quick channels ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {channels.map(c => (
            <div key={c.title} className="p-6 rounded-2xl transition-all hover:scale-[1.02]"
              style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${c.color}18`, color: c.color, border: `1px solid ${c.color}30` }}>
                {c.icon}
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: '#f0f4ff' }}>{c.title}</h3>
              <p className="text-sm mb-5" style={{ color: '#64748b' }}>{c.desc}</p>
              <a href={c.href} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ backgroundColor: `${c.color}18`, color: c.color, border: `1px solid ${c.color}30`, textDecoration: 'none' }}>
                {c.action}
              </a>
            </div>
          ))}
        </div>

        {/* ── Chat Section ── */}
        {authLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
          </div>
        ) : !user ? (
          <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
            <div className="text-5xl mb-4">🔒</div>
            <p className="font-bold text-lg mb-2" style={{ color: '#f0f4ff' }}>Login to Send Inquiries</p>
            <p className="text-sm mb-6" style={{ color: '#64748b' }}>Log in to chat with our support team directly from here.</p>
            <div className="flex justify-center gap-3">
              <Link href="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
                Log In
              </Link>
              <Link href="/signup" className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#1e2d4a', color: '#94a3b8', textDecoration: 'none' }}>
                Create Account
              </Link>
            </div>
          </div>
        ) : (
          /* ── WhatsApp-style Chat UI ── */
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a', height: '600px', display: 'flex' }}>

            {/* Left sidebar — thread list */}
            <div className="flex flex-col" style={{ width: '300px', minWidth: '240px', borderRight: '1px solid #1e2d4a', flexShrink: 0 }}>
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1e2d4a', backgroundColor: '#0a0c16' }}>
                <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Support Chat</p>
                <button
                  onClick={() => { setComposing(true); setActiveThread(null); setMessages([]); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-all"
                  style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.25)', cursor: 'pointer' }}
                  title="New Inquiry">
                  ✏️
                </button>
              </div>

              {/* Thread list */}
              <div className="flex-1 overflow-y-auto">
                {threads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
                    <div className="text-4xl">💬</div>
                    <p className="text-xs" style={{ color: '#475569' }}>No conversations yet. Start one!</p>
                  </div>
                ) : threads.map(t => (
                  <button
                    key={t.id}
                    onClick={() => openThread(t)}
                    className="w-full text-left px-4 py-3 transition-all"
                    style={{
                      backgroundColor: activeThread?.id === t.id ? 'rgba(37,99,235,0.1)' : 'transparent',
                      borderBottom: '1px solid rgba(30,45,74,0.5)',
                      borderLeft: activeThread?.id === t.id ? '3px solid #3b82f6' : '3px solid transparent',
                    }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: '#f0f4ff' }}>{t.subject}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#475569' }}>
                          {t.last_sender === 'admin' ? '🛡 Admin: ' : 'You: '}
                          {(t.last_message || t.message || '').slice(0, 40)}
                          {(t.last_message || t.message || '').length > 40 ? '…' : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="text-xs" style={{ color: '#374151' }}>
                          {formatDate(t.updated_at || t.created_at)}
                        </p>
                        <span className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${statusColor[t.status] || '#fb923c'}18`,
                            color: statusColor[t.status] || '#fb923c',
                            border: `1px solid ${statusColor[t.status] || '#fb923c'}30`,
                          }}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right — chat window */}
            <div className="flex-1 flex flex-col min-w-0">
              {composing ? (
                /* New inquiry form */
                <div className="flex flex-col h-full">
                  <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid #1e2d4a', backgroundColor: '#0a0c16' }}>
                    <button onClick={() => setComposing(false)} className="text-sm" style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
                    <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>New Inquiry</p>
                  </div>
                  <form onSubmit={startNewInquiry} className="flex flex-col h-full p-5 gap-4">
                    {alert && (
                      <div className="p-3 rounded-xl text-sm" style={{
                        backgroundColor: alert.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${alert.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        color: alert.type === 'success' ? '#4ade80' : '#f87171',
                      }}>
                        {alert.text}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>Subject</label>
                      <input
                        type="text"
                        value={newSubject}
                        onChange={e => setNewSubject(e.target.value)}
                        placeholder="e.g. Panel not starting, Billing issue..."
                        required
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                        onFocus={e => e.target.style.borderColor = '#2563eb'}
                        onBlur={e => e.target.style.borderColor = '#1e2d4a'}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>Message</label>
                      <textarea
                        value={newMsg}
                        onChange={e => setNewMsg(e.target.value)}
                        placeholder="Describe your issue in detail..."
                        required
                        className="w-full h-40 px-4 py-3 rounded-xl text-sm outline-none resize-none"
                        style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                        onFocus={e => e.target.style.borderColor = '#2563eb'}
                        onBlur={e => e.target.style.borderColor = '#1e2d4a'}
                      />
                    </div>
                    <button type="submit" disabled={sending}
                      className="py-3 rounded-xl font-bold text-sm text-white"
                      style={{ background: sending ? '#1e2d4a' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: sending ? 'not-allowed' : 'pointer' }}>
                      {sending ? 'Sending…' : '📨 Send Inquiry'}
                    </button>
                  </form>
                </div>
              ) : activeThread ? (
                /* Active chat thread */
                <div className="flex flex-col h-full">
                  {/* Thread header */}
                  <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid #1e2d4a', backgroundColor: '#0a0c16' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff' }}>
                      A
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: '#f0f4ff' }}>{activeThread.subject}</p>
                      <p className="text-xs" style={{ color: '#4ade80' }}>
                        {activeThread.status === 'replied' ? '● Online — replied' : activeThread.status === 'open' ? '⏳ Awaiting reply' : '● Closed'}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
                    style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(37,99,235,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.03) 0%, transparent 50%)' }}>
                    {msgLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <div className="text-3xl">💬</div>
                        <p className="text-xs" style={{ color: '#374151' }}>No messages yet</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, i) => {
                          const isUser  = msg.sender === 'user';
                          const isAdmin = msg.sender === 'admin';
                          // Date divider
                          const showDate = i === 0 || formatDate(messages[i-1].created_at) !== formatDate(msg.created_at);
                          return (
                            <div key={msg.id}>
                              {showDate && (
                                <div className="flex items-center justify-center my-3">
                                  <span className="text-xs px-3 py-1 rounded-full"
                                    style={{ backgroundColor: 'rgba(30,45,74,0.8)', color: '#475569' }}>
                                    {formatDate(msg.created_at)}
                                  </span>
                                </div>
                              )}
                              <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
                                {isAdmin && (
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mr-2 flex-shrink-0 self-end"
                                    style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff' }}>
                                    A
                                  </div>
                                )}
                                <div
                                  className="max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                                  style={{
                                    backgroundColor: isUser
                                      ? 'linear-gradient(135deg,#2563eb,#1d4ed8)'
                                      : undefined,
                                    background: isUser ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#1a2640',
                                    color: isUser ? '#fff' : '#e2e8f0',
                                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    boxShadow: isUser ? '0 2px 8px rgba(37,99,235,0.3)' : '0 1px 4px rgba(0,0,0,0.3)',
                                  }}>
                                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                  <p className="text-xs mt-1 text-right"
                                    style={{ color: isUser ? 'rgba(255,255,255,0.6)' : '#475569' }}>
                                    {formatTime(msg.created_at)}
                                    {isUser && ' ✓✓'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={bottomRef} />
                      </>
                    )}
                  </div>

                  {/* Message input */}
                  <div className="px-4 py-3" style={{ borderTop: '1px solid #1e2d4a', backgroundColor: '#0a0c16' }}>
                    {activeThread.status === 'closed' ? (
                      <p className="text-xs text-center py-2" style={{ color: '#475569' }}>
                        This inquiry is closed. Start a new one to contact support.
                      </p>
                    ) : (
                      <form onSubmit={sendMessage} className="flex items-end gap-2">
                        <textarea
                          ref={inputRef}
                          value={newMsg}
                          onChange={e => setNewMsg(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
                          placeholder="Type a message…"
                          rows={1}
                          className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none resize-none"
                          style={{
                            backgroundColor: '#111827',
                            border: '1px solid #1e2d4a',
                            color: '#f0f4ff',
                            maxHeight: '120px',
                            lineHeight: '1.5',
                          }}
                        />
                        <button
                          type="submit"
                          disabled={sending || !newMsg.trim()}
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            background: sending || !newMsg.trim() ? '#1e2d4a' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                            cursor: sending || !newMsg.trim() ? 'not-allowed' : 'pointer',
                            border: 'none',
                          }}>
                          {sending ? (
                            <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="text-6xl">💬</div>
                  <div className="text-center">
                    <p className="font-bold mb-1" style={{ color: '#f0f4ff' }}>Your Support Chats</p>
                    <p className="text-sm mb-5" style={{ color: '#64748b' }}>Select a conversation or start a new one.</p>
                    <button
                      onClick={() => setComposing(true)}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', cursor: 'pointer' }}>
                      ✏️ New Inquiry
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
