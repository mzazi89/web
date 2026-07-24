'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [reply, setReply]         = useState('');
  const [replying, setReplying]   = useState(false);
  const [filter, setFilter]       = useState('all');
  const bottomRef = useRef(null);
  const router    = useRouter();

  useEffect(() => {
    fetch('/api/admin/me').then(r => {
      if (!r.ok) { router.replace('/admin/login'); return; }
      loadInquiries();
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadInquiries = async () => {
    const r = await fetch('/api/admin/inquiries');
    if (r.ok) { const d = await r.json(); setInquiries(d.inquiries || []); }
    setLoading(false);
  };

  const openThread = async (inq) => {
    setSelected(inq);
    setReply('');
    setMsgLoading(true);
    try {
      const r = await fetch(`/api/admin/inquiries/${inq.id}/messages`);
      if (r.ok) {
        const d = await r.json();
        if (d.messages && d.messages.length > 0) {
          setMessages(d.messages);
        } else {
          // Legacy fallback
          const legacy = [{ id: 'lg-user', sender: 'user', message: inq.message, created_at: inq.created_at }];
          if (inq.admin_reply) {
            legacy.push({ id: 'lg-admin', sender: 'admin', message: inq.admin_reply, created_at: inq.replied_at || inq.created_at });
          }
          setMessages(legacy);
        }
      }
    } finally { setMsgLoading(false); }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setReplying(true);
    const res = await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, admin_reply: reply, status: 'replied' }),
    });
    if (res.ok) {
      // Add optimistically
      const newMsg = { id: Date.now(), sender: 'admin', message: reply, created_at: new Date().toISOString() };
      setMessages(m => [...m, newMsg]);
      setReply('');
      await loadInquiries();
      setSelected(prev => ({ ...prev, admin_reply: reply, status: 'replied' }));
    }
    setReplying(false);
  };

  const closeInquiry = async () => {
    await fetch('/api/admin/inquiries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id }),
    });
    await loadInquiries();
    setSelected(prev => ({ ...prev, status: 'closed' }));
  };

  const logout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); };
  const filtered = inquiries.filter(i => filter === 'all' || i.status === filter);

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
  };

  const statusColor = { open: '#fb923c', replied: '#4ade80', closed: '#64748b' };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060810' }}>
      {/* Top nav */}
      <div style={{ backgroundColor: '#0a0c14', borderBottom: '1px solid #1e2030' }} className="sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Admin Panel</span>
          </div>
          <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', background: 'none', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Sub-nav */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { href: '/admin/dashboard', label: 'Overview' },
            { href: '/admin/users', label: 'Users' },
            { href: '/admin/transactions', label: 'Transactions' },
            { href: '/admin/inquiries', label: 'Inquiries', active: true },
            { href: '/admin/packages', label: 'Packages' },
          ].map(n => (
            <Link key={n.href} href={n.href} className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: n.active ? 'rgba(220,38,38,0.15)' : 'rgba(30,32,48,0.5)',
                color: n.active ? '#f87171' : '#64748b',
                border: n.active ? '1px solid rgba(220,38,38,0.3)' : '1px solid #1e2030',
                textDecoration: 'none',
              }}>
              {n.label}
              {n.active && inquiries.filter(i => i.status === 'open').length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: '#dc2626', color: '#fff' }}>
                  {inquiries.filter(i => i.status === 'open').length}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-xl font-extrabold" style={{ color: '#f0f4ff' }}>Member Inquiries</h1>
          <div className="flex gap-2">
            {['all', 'open', 'replied', 'closed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium capitalize"
                style={{
                  backgroundColor: filter === f ? 'rgba(59,130,246,0.15)' : '#0a0c14',
                  color: filter === f ? '#60a5fa' : '#64748b',
                  border: filter === f ? '1px solid rgba(59,130,246,0.3)' : '1px solid #1e2030',
                  cursor: 'pointer',
                }}>
                {f}{f === 'open' ? ` (${inquiries.filter(i => i.status === 'open').length})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* WhatsApp-style layout */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0a0c14', border: '1px solid #1e2030', height: '580px', display: 'flex' }}>

          {/* Left: thread list */}
          <div className="flex flex-col" style={{ width: '280px', minWidth: '220px', borderRight: '1px solid #1e2030', flexShrink: 0 }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e2030', backgroundColor: '#060810' }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#475569' }}>
                {filtered.length} Conversation{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs" style={{ color: '#374151' }}>No inquiries</p>
                </div>
              ) : filtered.map(inq => (
                <button key={inq.id} onClick={() => openThread(inq)}
                  className="w-full text-left px-4 py-3 transition-all"
                  style={{
                    backgroundColor: selected?.id === inq.id ? 'rgba(37,99,235,0.1)' : 'transparent',
                    borderBottom: '1px solid rgba(30,32,48,0.7)',
                    borderLeft: selected?.id === inq.id ? '3px solid #3b82f6' : '3px solid transparent',
                    cursor: 'pointer',
                  }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {inq.status === 'open' && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#fb923c' }} />
                        )}
                        <p className="text-xs font-bold truncate" style={{ color: '#f0f4ff' }}>{inq.user_name || inq.user_email || 'Unknown'}</p>
                      </div>
                      <p className="text-xs truncate" style={{ color: '#64748b' }}>{inq.subject}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#374151' }}>
                        {inq.last_sender === 'admin' ? '🛡 ' : ''}
                        {(inq.last_message || inq.message || '').slice(0, 35)}…
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="text-xs" style={{ color: '#374151' }}>
                        {formatDate(inq.updated_at || inq.created_at)}
                      </p>
                      <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${statusColor[inq.status] || '#fb923c'}1a`,
                          color: statusColor[inq.status] || '#fb923c',
                        }}>
                        {inq.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: chat window */}
          <div className="flex-1 flex flex-col min-w-0">
            {selected ? (
              <>
                {/* Thread header */}
                <div className="px-5 py-3 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid #1e2030', backgroundColor: '#060810' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }}>
                      {(selected.user_name || selected.user_email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: '#f0f4ff' }}>{selected.user_name || selected.user_email}</p>
                      <p className="text-xs truncate" style={{ color: '#64748b' }}>{selected.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${statusColor[selected.status] || '#fb923c'}1a`, color: statusColor[selected.status] || '#fb923c', border: `1px solid ${statusColor[selected.status] || '#fb923c'}30` }}>
                      {selected.status}
                    </span>
                    {selected.status !== 'closed' && (
                      <button onClick={closeInquiry}
                        className="text-xs px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)', cursor: 'pointer' }}>
                        Close
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
                  style={{ backgroundColor: '#060810' }}>
                  {msgLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.map((msg, i) => {
                    const isAdmin = msg.sender === 'admin';
                    const showDate = i === 0 || formatDate(messages[i-1].created_at) !== formatDate(msg.created_at);
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-3">
                            <span className="text-xs px-3 py-1 rounded-full"
                              style={{ backgroundColor: 'rgba(30,32,48,0.9)', color: '#475569' }}>
                              {formatDate(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-1`}>
                          {!isAdmin && (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mr-2 flex-shrink-0 self-end"
                              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }}>
                              {(selected.user_name || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div
                            className="max-w-xs lg:max-w-sm px-4 py-2.5 text-sm leading-relaxed"
                            style={{
                              background: isAdmin ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : '#1a2640',
                              color: '#fff',
                              borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              boxShadow: isAdmin ? '0 2px 8px rgba(220,38,38,0.3)' : '0 1px 4px rgba(0,0,0,0.4)',
                            }}>
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>
                              {formatTime(msg.created_at)}{isAdmin ? ' ✓✓' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Reply box */}
                <div className="px-4 py-3" style={{ borderTop: '1px solid #1e2030', backgroundColor: '#060810' }}>
                  {selected.status === 'closed' ? (
                    <p className="text-xs text-center py-2" style={{ color: '#374151' }}>This inquiry is closed.</p>
                  ) : (
                    <div className="flex items-end gap-2">
                      <textarea
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                        placeholder="Type your reply as admin… (Enter to send)"
                        rows={1}
                        className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none resize-none"
                        style={{ backgroundColor: '#111827', border: '1px solid #1e2030', color: '#f0f4ff', maxHeight: '100px' }}
                      />
                      <button
                        onClick={handleReply}
                        disabled={replying || !reply.trim()}
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: replying || !reply.trim() ? '#1e2030' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
                          cursor: replying || !reply.trim() ? 'not-allowed' : 'pointer',
                          border: 'none',
                        }}>
                        {replying ? (
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
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="text-5xl">💬</div>
                <p className="font-bold" style={{ color: '#f0f4ff' }}>Select a conversation</p>
                <p className="text-sm" style={{ color: '#374151' }}>Click any inquiry on the left to view the chat.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
