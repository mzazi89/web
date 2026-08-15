'use client';
import { useState, useRef, useEffect } from 'react';

// Floating MZAZI AI assistant — answers questions instantly; the user can
// still send the message to the admin instead (button in the widget).
export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const d = await res.json();
      setMessages((m) => [...m, { role: 'ai', text: d.response || d.error || 'Sorry, I could not answer right now.' }]);
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Ask MZAZI AI"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm text-white"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', cursor: 'pointer', boxShadow: '0 8px 30px rgba(37,99,235,0.5)' }}
      >
        {open ? '✕ Close' : '🤖 Ask MZAZI AI'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl overflow-hidden flex flex-col"
          style={{ height: 'min(480px, 70vh)', backgroundColor: '#060b16', border: '1px solid #1e3a8a', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'rgba(37,99,235,0.12)', borderBottom: '1px solid #1e3a8a' }}>
            <div>
              <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>🤖 MZAZI AI</p>
              <p className="text-[11px]" style={{ color: '#64748b' }}>Instant answers — no waiting</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
              style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
              Online
            </span>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5" style={{ backgroundColor: 'rgba(2,4,9,0.45)' }}>
            {messages.length === 0 && (
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                👋 Hi! Ask me anything about MZAZI TECH — accounts, payments, WhatsApp bot pairing, panel servers, API keys…
                <br />If you&apos;d rather talk to a person, use the <b style={{ color: '#94a3b8' }}>contact form → Send to Admin</b>.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap"
                  style={
                    m.role === 'user'
                      ? { backgroundColor: 'rgba(37,99,235,0.25)', border: '1px solid rgba(59,130,246,0.4)', color: '#f0f4ff' }
                      : { backgroundColor: '#0a0e1a', border: '1px solid #1e3a8a', color: '#cbd5e1' }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: '#0a0e1a', border: '1px solid #1e3a8a', color: '#64748b' }}>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, verticalAlign: 'middle', display: 'inline-block', marginRight: 8 }} />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-2.5 flex items-center gap-2" style={{ borderTop: '1px solid #1e3a8a' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask the AI…"
              className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: '#02040a', border: '1px solid #1e3a8a', color: '#f0f4ff' }}
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="px-3.5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
