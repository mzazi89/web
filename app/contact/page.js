'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const channels = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: '#0088cc',
    title: 'Telegram Support',
    desc: 'Fastest response — our team replies within minutes.',
    action: 'Open Telegram',
    href: 'https://t.me/mzazitech',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25d366',
    title: 'WhatsApp',
    desc: 'Chat directly with our support team.',
    action: 'Chat on WhatsApp',
    href: 'https://wa.me/254108595201',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    color: '#3b82f6',
    title: 'Email',
    desc: 'For billing, partnerships, and formal inquiries.',
    action: 'mzazitechinc@gmail.com',
    href: 'mailto:mzazitechinc@gmail.com',
  },
];

const STATUS_STYLE = {
  open:     { bg: 'rgba(251,146,60,0.12)', color: '#fb923c', border: 'rgba(251,146,60,0.25)' },
  replied:  { bg: 'rgba(74,222,128,0.1)',  color: '#4ade80', border: 'rgba(74,222,128,0.25)' },
  closed:   { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' },
};

export default function ContactPage() {
  const [user, setUser]         = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [inquiries, setInquiries] = useState([]);
  const [form, setForm]         = useState({ subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert]       = useState(null); // { type, text }
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) { setUser(d.user); loadInquiries(); } })
      .finally(() => setAuthLoading(false));
  }, []);

  const loadInquiries = async () => {
    const r = await fetch('/api/inquiries');
    if (r.ok) { const d = await r.json(); setInquiries(d.inquiries || []); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', text: '✅ Your inquiry has been sent! Our team will respond soon.' });
        setForm({ subject: '', message: '' });
        await loadInquiries();
      } else {
        setAlert({ type: 'error', text: data.error || 'Failed to send inquiry. Please try again.' });
      }
    } catch {
      setAlert({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

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
            We're here to help. Reach out through any channel or send a direct inquiry below.
          </p>
        </div>
      </section>

      {/* ── Quick channels ── */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
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

        {/* ── Inquiry form ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Form (3/5) */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl p-7" style={{ backgroundColor: '#0f1629', border: '1px solid rgba(37,99,235,0.25)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: '#f0f4ff' }}>Send an Inquiry</h2>
                  <p className="text-xs" style={{ color: '#475569' }}>Goes directly to our admin team</p>
                </div>
              </div>

              {/* Alert */}
              {alert && (
                <div className="mb-5 p-3 rounded-xl text-sm" style={{
                  backgroundColor: alert.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${alert.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: alert.type === 'success' ? '#4ade80' : '#f87171',
                }}>
                  {alert.text}
                </div>
              )}

              {authLoading ? (
                <div className="flex items-center gap-3 py-6">
                  <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
                  <span className="text-sm" style={{ color: '#64748b' }}>Checking account...</span>
                </div>
              ) : !user ? (
                /* Not logged in */
                <div className="py-8 text-center">
                  <div className="text-5xl mb-4">🔒</div>
                  <p className="font-semibold mb-2" style={{ color: '#f0f4ff' }}>Login Required</p>
                  <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                    You need to be logged in to send an inquiry. This lets our team reply directly to your account.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link href="/login" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                      Log In
                    </Link>
                    <Link href="/signup" className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ backgroundColor: '#1e2d4a', color: '#94a3b8', border: '1px solid #1e2d4a' }}>
                      Create Account
                    </Link>
                  </div>
                </div>
              ) : (
                /* Inquiry form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl mb-2"
                    style={{ backgroundColor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }}>
                      {(user.firstname || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>
                        {user.firstname ? `${user.firstname} ${user.lastname || ''}`.trim() : user.fullname || 'Member'}
                      </p>
                      <p className="text-xs" style={{ color: '#475569' }}>{user.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#475569' }}>Subject</label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="e.g. Panel not starting, Billing issue, Feature request..."
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                      style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                      onFocus={e => e.target.style.borderColor = '#2563eb'}
                      onBlur={e => e.target.style.borderColor = '#1e2d4a'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#475569' }}>Message</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Describe your issue or question in detail. Include any relevant server names, transaction references, or error messages."
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors resize-none"
                      style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                      onFocus={e => e.target.style.borderColor = '#2563eb'}
                      onBlur={e => e.target.style.borderColor = '#1e2d4a'}
                    />
                  </div>

                  <button type="submit" disabled={submitting}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
                    style={{ background: submitting ? '#1e2d4a' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Sending...
                      </span>
                    ) : 'Send Inquiry to Admin'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar (2/5) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Response time */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: '#f0f4ff' }}>Response Times</h3>
              {[
                { channel: 'Telegram', time: '< 15 min', color: '#0088cc' },
                { channel: 'WhatsApp', time: '< 30 min', color: '#25d366' },
                { channel: 'Inquiry Form', time: '< 2 hours', color: '#3b82f6' },
                { channel: 'Email', time: '< 24 hours', color: '#8b5cf6' },
              ].map(r => (
                <div key={r.channel} className="flex items-center justify-between py-2.5"
                  style={{ borderBottom: '1px solid rgba(30,45,74,0.5)' }}>
                  <span className="text-sm" style={{ color: '#94a3b8' }}>{r.channel}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${r.color}18`, color: r.color, border: `1px solid ${r.color}30` }}>
                    {r.time}
                  </span>
                </div>
              ))}
            </div>

            {/* Warranty notice */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)' }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: '#60a5fa' }}>Panel Warranty</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                    Pterodactyl panel replacement warranty is valid for <strong style={{ color: '#93c5fd' }}>2 weeks</strong> from the date of purchase. Contact support within this period for a free replacement.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: '#f0f4ff' }}>Quick Links</h3>
              {[
                { label: 'Deploy a Panel',     href: '/products',     icon: '🖥️' },
                { label: 'WhatsApp Bot Setup', href: '/whatsapp-bot', icon: '🤖' },
                { label: 'Top Up Wallet',      href: '/wallet',       icon: '💳' },
                { label: 'My Dashboard',       href: '/dashboard',    icon: '📊' },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="flex items-center gap-3 py-2.5 transition-colors"
                  style={{ borderBottom: '1px solid rgba(30,45,74,0.5)', color: '#94a3b8', textDecoration: 'none' }}>
                  <span>{l.icon}</span>
                  <span className="text-sm hover:text-blue-400 transition-colors">{l.label}</span>
                  <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── My Inquiries (shown when logged in) ── */}
        {user && (
          <div className="mt-10 rounded-2xl p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-lg" style={{ color: '#f0f4ff' }}>My Inquiries</h2>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Track replies from our admin team</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1e2d4a', color: '#64748b' }}>
                {inquiries.length} total
              </span>
            </div>

            {inquiries.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm" style={{ color: '#64748b' }}>No inquiries yet. Send one above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map(inq => {
                  const s = STATUS_STYLE[inq.status] || STATUS_STYLE.open;
                  const isOpen = expanded === inq.id;
                  return (
                    <div key={inq.id}
                      className="rounded-xl overflow-hidden"
                      style={{ border: `1px solid ${inq.status === 'replied' ? 'rgba(74,222,128,0.2)' : '#1e2d4a'}` }}>
                      {/* Row */}
                      <button
                        onClick={() => setExpanded(isOpen ? null : inq.id)}
                        className="w-full flex items-start gap-4 p-4 text-left transition-colors"
                        style={{ backgroundColor: isOpen ? 'rgba(37,99,235,0.04)' : 'transparent' }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm" style={{ color: '#f0f4ff' }}>{inq.subject}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                              {inq.status}
                            </span>
                            {inq.status === 'replied' && (
                              <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
                                ✉️ Reply received
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-1 truncate" style={{ color: '#475569' }}>
                            {new Date(inq.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}
                            {inq.message.substring(0, 80)}{inq.message.length > 80 ? '…' : ''}
                          </p>
                        </div>
                        <svg className="w-4 h-4 flex-shrink-0 transition-transform mt-0.5"
                          style={{ color: '#475569', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Expanded detail */}
                      {isOpen && (
                        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid #1e2d4a' }}>
                          <div className="pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Your message</p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#cbd5e1' }}>{inq.message}</p>
                          </div>

                          {inq.admin_reply ? (
                            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                  style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff' }}>A</div>
                                <p className="text-xs font-semibold" style={{ color: '#4ade80' }}>Admin Reply</p>
                                {inq.replied_at && (
                                  <p className="text-xs ml-auto" style={{ color: '#475569' }}>
                                    {new Date(inq.replied_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#d1fae5' }}>{inq.admin_reply}</p>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl text-xs" style={{ backgroundColor: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', color: '#fb923c' }}>
                              ⏳ Awaiting admin reply — we'll respond within 2 hours.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
