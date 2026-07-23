'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/me').then(r => {
      if (!r.ok) { router.replace('/admin/login'); return; }
      loadInquiries();
    });
  }, []);

  const loadInquiries = async () => {
    const r = await fetch('/api/admin/inquiries');
    if (r.ok) { const d = await r.json(); setInquiries(d.inquiries); }
    setLoading(false);
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    setReplying(true);
    const res = await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, admin_reply: reply, status: 'replied' }),
    });
    if (res.ok) {
      await loadInquiries();
      setSelected(prev => ({ ...prev, admin_reply: reply, status: 'replied' }));
      setReply('');
    }
    setReplying(false);
  };

  const logout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); };
  const filtered = inquiries.filter(i => filter === 'all' || i.status === filter);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060810' }}>
      <div style={{ backgroundColor: '#0a0c14', borderBottom: '1px solid #1e2030' }} className="sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Admin Panel</span>
          </div>
          <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>Sign Out</button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {[{ href: '/admin/dashboard', label: 'Overview' }, { href: '/admin/users', label: 'Users' }, { href: '/admin/transactions', label: 'Transactions' }, { href: '/admin/inquiries', label: 'Inquiries', active: true }].map(n => (
            <Link key={n.href} href={n.href} className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: n.active ? 'rgba(220,38,38,0.15)' : 'rgba(30,32,48,0.5)', color: n.active ? '#f87171' : '#64748b', border: n.active ? '1px solid rgba(220,38,38,0.3)' : '1px solid #1e2030' }}>
              {n.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-extrabold" style={{ color: '#f0f4ff' }}>Member Inquiries</h1>
          <div className="flex space-x-2">
            {['all', 'open', 'replied'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className="px-4 py-2 rounded-xl text-sm font-medium capitalize"
                style={{ backgroundColor: filter === f ? 'rgba(59,130,246,0.15)' : '#0a0c14', color: filter === f ? '#60a5fa' : '#64748b', border: filter === f ? '1px solid rgba(59,130,246,0.3)' : '1px solid #1e2030' }}>
                {f}{f === 'open' ? ` (${inquiries.filter(i => i.status === 'open').length})` : ''}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length > 0 ? filtered.map(inq => (
              <button key={inq.id} onClick={() => { setSelected(inq); setReply(inq.admin_reply || ''); }}
                className="w-full text-left p-4 rounded-2xl transition-all"
                style={{ backgroundColor: selected?.id === inq.id ? 'rgba(37,99,235,0.1)' : '#0f1117', border: selected?.id === inq.id ? '1px solid rgba(37,99,235,0.4)' : '1px solid #1e2030' }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#f0f4ff' }}>{inq.subject}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>{inq.user_email || inq.user_name}</p>
                    <p className="text-xs mt-2 line-clamp-2" style={{ color: '#475569' }}>{inq.message}</p>
                  </div>
                  <span className="ml-3 text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: inq.status === 'open' ? 'rgba(251,146,60,0.15)' : 'rgba(74,222,128,0.1)', color: inq.status === 'open' ? '#fb923c' : '#4ade80' }}>
                    {inq.status}
                  </span>
                </div>
                <p className="text-xs mt-3" style={{ color: '#374151' }}>{new Date(inq.created_at).toLocaleString()}</p>
              </button>
            )) : (
              <div className="text-center py-20 rounded-2xl" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }}>
                <p className="text-sm" style={{ color: '#374151' }}>No inquiries found</p>
              </div>
            )}
          </div>
          {selected ? (
            <div className="rounded-2xl p-6 sticky top-20 self-start" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }}>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold" style={{ color: '#f0f4ff' }}>{selected.subject}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: selected.status === 'open' ? 'rgba(251,146,60,0.15)' : 'rgba(74,222,128,0.1)', color: selected.status === 'open' ? '#fb923c' : '#4ade80' }}>{selected.status}</span>
                </div>
                <p className="text-xs mb-1" style={{ color: '#64748b' }}>From: {selected.user_email || selected.user_name}</p>
                <p className="text-xs" style={{ color: '#374151' }}>{new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl mb-5" style={{ backgroundColor: '#0a0c14', border: '1px solid #1e2030' }}>
                <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{selected.message}</p>
              </div>
              {selected.admin_reply && (
                <div className="p-4 rounded-xl mb-5" style={{ backgroundColor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#3b82f6' }}>Your Previous Reply</p>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>{selected.admin_reply}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Reply to Member</label>
                <textarea rows={4} value={reply} onChange={e => setReply(e.target.value)}
                  placeholder="Type your reply here..." className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ backgroundColor: '#0a0c14', border: '1px solid #1e2030', color: '#f0f4ff' }} />
                <button onClick={handleReply} disabled={replying || !reply.trim()}
                  className="mt-3 w-full py-3 rounded-xl font-semibold text-sm text-white"
                  style={{ background: replying || !reply.trim() ? '#1e2030' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', cursor: replying || !reply.trim() ? 'not-allowed' : 'pointer' }}>
                  {replying ? 'Sending Reply...' : 'Send Reply'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030', minHeight: '300px' }}>
              <p className="text-sm" style={{ color: '#374151' }}>Select an inquiry to view and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
