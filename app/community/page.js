'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AppBackground, Card, Badge, Icons, Button } from '@/components/ui';

export default function CommunityPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const chatEndRef = useRef(null);
  const lastIdRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setUser(d.user); });
    
    // Initial load
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const r = await fetch(`/api/community/messages?lastId=${lastIdRef.current}`);
      if (r.ok) {
        const d = await r.json();
        if (d.messages?.length > 0) {
          const newMessages = d.messages;
          const lastMsg = newMessages[newMessages.length - 1];
          
          // Play notification if someone else sent a message
          if (lastIdRef.current > 0) {
            const hasOtherMsg = newMessages.some(m => m.user_id !== user?.id);
            if (hasOtherMsg && audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
          }

          setMessages(prev => [...prev, ...newMessages]);
          lastIdRef.current = lastMsg.id;
        }
      }
    } catch (err) {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!user) {
      window.location.href = '/login?redirect=/community';
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() }),
      });
      if (res.ok) {
        setInput('');
        loadMessages();
      }
    } finally {
      setLoading(false);
    }
  };

  const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <AppBackground
      image="https://clouddisk.alibaba.com/sa/download?filePath=saFile/0612387aa62af8104ffb6679b7b95a19.png&fileSuffix=png&userId=4500117644369"
      imageOpacity={0.4}
      scrim={0.65}
      orbs
    >
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" preload="auto" />
      <div className="container-site" style={{ paddingTop: 100, paddingBottom: 100, minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
        
        {/* ── WHATSAPP UI SCREEN ── */}
        <div className="flex-1 flex flex-col anim-fade-up" style={{ maxWidth: 800, marginInline: 'auto', width: '100%', height: '700px', maxHeight: '80vh' }}>
          
          {/* ── Chat Header ── */}
          <div style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--line)', 
            borderBottom: 'none',
            borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 10
          }}>
            <Link href="/" style={{ color: 'var(--muted)', cursor: 'pointer' }}>
              <Icons.ChevronLeft size={24} />
            </Link>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-tint)', color: 'var(--brand)', display: 'grid', placeItems: 'center' }}>
              <Icons.Zap size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                MZAZI TECH — Community
                <Icons.CheckCircle size={14} style={{ color: 'var(--brand)' }} />
              </h3>
              <p style={{ fontSize: 12, color: 'var(--good)', fontWeight: 600 }}>Dominic, Sarah, Alex, +492 others</p>
            </div>
            <div style={{ color: 'var(--muted)' }}>
              <Icons.MoreVertical size={20} />
            </div>
          </div>

          {/* ── Message List (WhatsApp Style) ── */}
          <div style={{ 
            flex: 1, 
            background: 'rgba(4, 6, 13, 0.4)', 
            backgroundImage: 'radial-gradient(var(--brand-tint) 1px, transparent 0)',
            backgroundSize: '24px 24px',
            borderInline: '1px solid var(--line)',
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', justifySelf: 'center', marginInline: 'auto', marginTop: 40 }}>
                <span style={{ fontSize: 12, color: 'var(--dim)', background: 'var(--surface-2)', padding: '6px 16px', borderRadius: '20px' }}>
                  Welcome to the Community! Start the conversation.
                </span>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.user_id === user?.id;
              const isAdmin = msg.role === 'admin';

              return (
                <div key={msg.id} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}>
                  {!isMe && (
                    <span style={{ fontSize: 12, fontWeight: 800, color: isAdmin ? 'var(--brand)' : 'var(--blue)', marginLeft: 4, marginBottom: 2 }}>
                      {msg.user_name}
                    </span>
                  )}
                  <div style={{ 
                    background: isMe ? 'var(--brand)' : 'var(--surface)', 
                    color: isMe ? '#FFF' : 'var(--ink)',
                    padding: '8px 12px',
                    borderRadius: isMe ? '12px 0 12px 12px' : '0 12px 12px 12px',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative'
                  }}>
                    <p style={{ fontSize: 14.5, lineHeight: 1.5 }}>{msg.message}</p>
                    <div style={{ 
                      fontSize: 10, 
                      opacity: 0.7, 
                      textAlign: 'right', 
                      marginTop: 4,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 4
                    }}>
                      {fmtTime(msg.created_at)}
                      {isMe && <span>✓✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* ── Input Area ── */}
          <form onSubmit={handleSend} style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--line)', 
            borderTop: 'none',
            borderRadius: '0 0 var(--r-lg) var(--r-lg)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ color: 'var(--muted)', cursor: 'pointer' }}>
              <Icons.Plus size={24} />
            </div>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={user ? "Type a message..." : "Log in to join the conversation"}
              style={{
                flex: 1,
                background: 'var(--bg-2)',
                border: '1px solid var(--line-soft)',
                borderRadius: 'var(--r-pill)',
                padding: '10px 20px',
                color: 'var(--ink)',
                outline: 'none',
                fontSize: 14.5
              }}
            />
            <button 
              type="submit" 
              style={{ 
                width: 44, 
                height: 44, 
                borderRadius: '50%', 
                background: 'var(--brand)', 
                color: '#FFF', 
                display: 'grid', 
                placeItems: 'center',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'default',
                opacity: input.trim() ? 1 : 0.5,
                transition: '0.2s ease'
              }}
            >
              <Icons.Send size={20} />
            </button>
          </form>
          
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--dim)', fontWeight: 600 }}>
            End-to-end encrypted. Standard MZAZI TECH security applies.
          </p>
        </div>
      </div>
    </AppBackground>
  );
}

