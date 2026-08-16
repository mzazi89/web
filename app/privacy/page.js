import Link from 'next/link';

const SECTIONS = [
  { id: 'collect', title: '1. What We Collect', body: (
    <>
      <p><strong style={{ color: '#E9E7E2' }}>Account data:</strong> name, email, and password (hashed).{' '}
      <strong style={{ color: '#E9E7E2' }}>Payment data:</strong> handled by Paystack — we never store card details.{' '}
      <strong style={{ color: '#E9E7E2' }}>Usage data:</strong> API requests, panel usage, and wallet transactions for billing and analytics.{' '}
      <strong style={{ color: '#E9E7E2' }}>WhatsApp bot data:</strong> session tokens only — never your messages or contacts.</p>
    </>
  ) },
  { id: 'use', title: '2. How We Use It', body: (
    <p>To provide and improve our services, process payments, prevent fraud and abuse, and communicate service updates. We do not sell your personal data to third parties.</p>
  ) },
  { id: 'keys', title: '3. API Keys & Security', body: (
    <p>MZAZI API keys are stored as secure hashes — plaintext keys are shown only once at creation. Passwords are bcrypt-hashed. We enforce HTTPS, rate limiting, and access controls on all customer data.</p>
  ) },
  { id: 'cookies', title: '4. Cookies', body: (
    <p>We use essential cookies for authentication sessions. No advertising or third-party tracking cookies are used.</p>
  ) },
  { id: 'retention', title: '5. Data Retention', body: (
    <p>We retain account and transaction records as required for billing and legal compliance. You may request deletion of your account data by contacting support.</p>
  ) },
  { id: 'rights', title: '6. Your Rights', body: (
    <p>You may request access to, correction of, or deletion of your personal data. To exercise these rights, <Link href="/contact" className="link">contact us</Link>.</p>
  ) },
  { id: 'contact', title: '7. Contact', body: (
    <p>Privacy questions: <Link href="/contact" className="link">contact our support team</Link>.</p>
  ) },
];

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)', minHeight: '70vh' }}>
      <section className="relative overflow-hidden" style={{ paddingTop: 64, paddingBottom: 40 }}>
        <div className="absolute inset-0 pointer-events-none grid-bg" style={{ maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)' }} />
        <div className="container-site relative">
          <div className="max-w-3xl">
            <Link href="/" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A', textDecoration: 'none' }}>← Back to home</Link>
            <p className="eyebrow mt-8">Legal</p>
            <h1 className="headline mt-4" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.2rem)' }}>
              Privacy policy<span className="accent">.</span>
            </h1>
            <p className="mono text-[10px] uppercase tracking-[0.14em] mt-4" style={{ color: '#4C535B' }}>
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 24, paddingBottom: 110 }}>
        <div className="container-site max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-10">
            {/* TOC */}
            <aside className="lg:col-span-3">
              <div className="card p-5 lg:sticky lg:top-32">
                <p className="mono text-[10px] uppercase tracking-[0.18em] mb-4" style={{ color: '#4C535B' }}>Contents</p>
                <div className="space-y-0.5">
                  {SECTIONS.map(s => (
                    <a key={s.id} href={`#${s.id}`}
                      className="mono block text-[11px] py-1.5 px-2"
                      style={{ color: '#79818A', textDecoration: 'none' }}>
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            </aside>

            {/* Body */}
            <div className="lg:col-span-9">
              {SECTIONS.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-32" style={{ padding: '26px 8px', borderTop: i === 0 ? 'none' : '1px solid #1B2026' }}>
                  <div className="grid sm:grid-cols-12 gap-4">
                    <span className="mono text-[11px] sm:col-span-2" style={{ color: '#F2A93B', paddingTop: 3 }}>{String(i + 1).padStart(2, '0')}</span>
                    <div className="sm:col-span-10">
                      <h2 className="section-title text-xl mb-3" style={{ color: '#E9E7E2' }}>{s.title.replace(/^\d+\.\s/, '')}</h2>
                      <div className="text-sm leading-relaxed space-y-3" style={{ color: '#AEB5BD' }}>{s.body}</div>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
