import Link from 'next/link';

const SECTIONS = [
  { id: 'acceptance', title: '1. Acceptance of Terms', body: (
    <p>By accessing or using MZAZI TECH INC services — including panel hosting, WhatsApp automation bots, the MZAZI API platform, wallet, and temporary number tools — you agree to these Terms of Service. If you do not agree, please do not use the services.</p>
  ) },
  { id: 'accounts', title: '2. Accounts', body: (
    <p>You must provide accurate information when creating an account and keep your credentials secure. You are responsible for all activity under your account. We may suspend or terminate accounts that violate these terms or applicable law.</p>
  ) },
  { id: 'services', title: '3. Services', body: (
    <>
      <p><strong style={{ color: '#E9E7E2' }}>Panel hosting:</strong> paid hosting plans billed monthly in MTC coins.{' '}
      <strong style={{ color: '#E9E7E2' }}>WhatsApp bots:</strong> automation tools — you are responsible for complying with WhatsApp&apos;s Terms of Service and applicable messaging laws.{' '}
      <strong style={{ color: '#E9E7E2' }}>MZAZI API:</strong> developer APIs subject to fair-use rate limits per your plan.{' '}
      <strong style={{ color: '#E9E7E2' }}>Temporary numbers:</strong> provided for legitimate verification purposes only — not for fraud, spam, or unlawful activity.</p>
    </>
  ) },
  { id: 'payments', title: '4. Payments & Refunds', body: (
    <p>Payments are processed via Paystack (M-Pesa/card). Wallet balances are non-refundable except where required by law. Unused hosting periods may be refunded at our discretion within 7 days of purchase for qualifying service issues.</p>
  ) },
  { id: 'acceptable-use', title: '5. Acceptable Use', body: (
    <p>You agree not to: use services for illegal activity, spam, phishing, or fraud; reverse-engineer or abuse the API beyond your rate limits; resell services without authorization; or interfere with other users&apos; service availability.</p>
  ) },
  { id: 'liability', title: '6. Limitation of Liability', body: (
    <p>Services are provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, MZAZI TECH INC shall not be liable for indirect, incidental, or consequential damages arising from use of the services.</p>
  ) },
  { id: 'changes', title: '7. Changes', body: (
    <p>We may update these terms from time to time. Continued use after changes constitutes acceptance. Material changes will be communicated on this page.</p>
  ) },
  { id: 'contact', title: '8. Contact', body: (
    <p>Questions about these terms? <Link href="/contact" className="link">Contact our support team</Link>.</p>
  ) },
];

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)', minHeight: '70vh' }}>
      <section className="relative overflow-hidden" style={{ paddingTop: 64, paddingBottom: 40 }}>
        <div className="absolute inset-0 pointer-events-none grid-bg" style={{ maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)' }} />
        <div className="container-site relative">
          <div className="max-w-3xl">
            <Link href="/" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: '#79818A', textDecoration: 'none' }}>← Back to home</Link>
            <p className="eyebrow mt-8">Legal</p>
            <h1 className="headline mt-4" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.2rem)' }}>
              Terms of service<span className="accent">.</span>
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
