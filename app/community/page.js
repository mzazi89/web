'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AppBackground, Card, Badge, Icons, Button } from '@/components/ui';

// ── MOCK DATA ──
const GROUP_MESSAGES = [
  { id: 1, sender: 'Dominic (Founder)', text: 'Welcome everyone to the MZAZI TECH Early Access group! 🚀', time: '09:00 AM', isSystem: false, isAdmin: true },
  { id: 2, sender: 'System', text: 'Dominic Mokua Kerubo added you to the group', time: '10:00 AM', isSystem: true },
  { id: 3, sender: 'Alex', text: 'Excited to be here! When is the next bot update?', time: '10:05 AM', isSystem: false },
  { id: 4, sender: 'Dominic (Founder)', text: 'Next week! We are adding support for automated Pterodactyl node management.', time: '10:07 AM', isSystem: false, isAdmin: true },
  { id: 5, sender: 'Sarah', text: 'The new MZAZI XMD pairing flow is so smooth. Loving the "Unpair" feature.', time: '10:15 AM', isSystem: false },
  { id: 6, sender: 'Dominic (Founder)', text: 'Thanks Sarah! We worked hard on that to fix the DB conflict issues.', time: '10:16 AM', isSystem: false, isAdmin: true },
];

export default function CommunityPage() {
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState(GROUP_MESSAGES);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (joined) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [joined, messages]);

  const handleJoin = () => {
    setJoined(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'You',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: false,
      isMe: true
    };

    setMessages([...messages, newMsg]);
    setInput('');
  };

  return (
    <AppBackground
      image="https://clouddisk.alibaba.com/sa/download?filePath=saFile/0612387aa62af8104ffb6679b7b95a19.png&fileSuffix=png&userId=4500117644369"
      imageOpacity={0.4}
      scrim={0.65}
      orbs
    >
      <div className="container-site" style={{ paddingTop: 100, paddingBottom: 100, minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
        
        {!joined ? (
          /* ── JOIN SCREEN ── */
          <div className="flex-1 flex items-center justify-center anim-fade-up">
            <Card accent hover style={{ padding: 60, textAlign: 'center', maxWidth: 600, background: 'var(--surface)' }}>
              <div style={{ width: 80, height: 80, marginInline: 'auto', display: 'grid', placeItems: 'center', background: 'var(--brand-tint)', color: 'var(--brand)', borderRadius: '50%', marginBottom: 24 }}>
                <Icons.Users size={40} />
              </div>
              <Badge tone="brand" style={{ marginBottom: 16 }}>Early Access</Badge>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 20 }}>MZAZI TECH <br /> <span className="gradient-text">Inner Circle</span>.</h1>
              <p className="lede mb-10" style={{ color: 'var(--muted)' }}>
                Join our exclusive community waitlist. Get early access to new automation tools, 
                private betas, and direct mentorship from Dominic.
              </p>
              <Button onClick={handleJoin} className="btn-lg w-full" style={{ paddingBlock: 20, fontSize: '1.25rem' }}>
                Join the Waitlist & Chat
              </Button>
              <p style={{ marginTop: 24, fontSize: 13, color: 'var(--dim)' }}>
                By joining, you agree to receive community updates and early access invites.
              </p>
            </Card>
          </div>
        ) : (
          /* ── WHATSAPP UI SCREEN ── */
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
              <Link href="/community" onClick={() => setJoined(false)} style={{ color: 'var(--muted)', cursor: 'pointer' }}>
                <Icons.ChevronLeft size={24} />
              </Link>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-tint)', color: 'var(--brand)', display: 'grid', placeItems: 'center' }}>
                <Icons.Zap size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  MZAZI TECH — Early Access
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
              {messages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifySelf: 'center', marginInline: 'auto' }}>
                      <span style={{ 
                        fontSize: 11, 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        background: 'var(--surface-3)', 
                        padding: '4px 12px', 
                        borderRadius: 'r-pill', 
                        color: 'var(--dim)',
                        border: '1px solid var(--line-soft)'
                      }}>
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignSelf: msg.isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}>
                    {!msg.isMe && (
                      <span style={{ fontSize: 12, fontWeight: 800, color: msg.isAdmin ? 'var(--brand)' : 'var(--blue)', marginLeft: 4, marginBottom: 2 }}>
                        {msg.sender}
                      </span>
                    )}
                    <div style={{ 
                      background: msg.isMe ? 'var(--brand)' : 'var(--surface)', 
                      color: msg.isMe ? '#FFF' : 'var(--ink)',
                      padding: '8px 12px',
                      borderRadius: msg.isMe ? '12px 0 12px 12px' : '0 12px 12px 12px',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative'
                    }}>
                      <p style={{ fontSize: 14.5, lineHeight: 1.5 }}>{msg.text}</p>
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
                        {msg.time}
                        {msg.isMe && <span>✓✓</span>}
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
                placeholder="Type a message..."
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
        )}
      </div>
    </AppBackground>
  );
}
