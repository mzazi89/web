import Link from 'next/link';

const UPDATED = '11 November 2026';

const SECTIONS = [
  { id: 'acceptance', title: 'Acceptance of Terms', body: (
    <p>By accessing or using MZAZI TECH INC services — including panel hosting, WhatsApp automation bots, the MZAZI API platform, wallet, and temporary number tools — you agree to these Terms of Service. If you do not agree, please do not use the services.</p>
  ) },
  { id: 'accounts', title: 'Accounts', body: (
    <p>You must provide accurate information when creating an account and keep your credentials secure. You are responsible for all activity under your account. We may suspend or terminate accounts that violate these terms or applicable law.</p>
  ) },
  { id: 'services', title: 'Services', body: (
    <>
      <p><strong style={{ color: 'var(--ink)' }}>Panel hosting:</strong> paid hosting plans billed monthly in KES.{' '}
      <strong style={{ color: 'var(--ink)' }}>WhatsApp bots:</strong> automation tools — you are responsible for complying with WhatsApp&apos;s Terms of Service and applicable messaging laws.{' '}
      <strong style={{ color: 'var(--ink)' }}>MZAZI API:</strong> developer APIs subject to fair-use rate limits per your plan.{' '}
      <strong style={{ color: 'var(--ink)' }}>Temporary numbers:</strong> provided for legitimate verification purposes only — not for fraud, spam, or unlawful activity.</p>
    </>
  ) },
  { id: 'bot-messages', title: 'WhatsApp bots and message content',
    body: (
      <>
        <p>
          You link a bot the same way you link WhatsApp Web: as a device on your own
          account. The bot receives the messages addressed to that number only in order to
          run the command contained in them, and that content is processed in memory.
        </p>
        <p>
          We do not store message text, chat history, contact lists or media, and we do not
          read conversations for support, advertising or any other purpose. We do not ask
          for your WhatsApp password or two-step verification code, and you should never
          share either with anyone, including us. The{' '}
          <Link href="/privacy#messages" className="link">privacy policy</Link> sets out
          exactly what is kept.
        </p>
        <p>
          Removing the device in WhatsApp ends our access immediately. You are responsible
          for the commands you enable — particularly anything that sends messages to other
          people — and for complying with WhatsApp&apos;s terms and local law while using
          them.
        </p>
      </>
    ) },

  { id: 'payments', title: 'Payments & Refunds', body: (
    <p>Payments are processed via Paystack (M-Pesa/card). Wallet balances are non-refundable except where required by law. Unused hosting periods may be refunded at our discretion within 7 days of purchase for qualifying service issues.</p>
  ) },
  { id: 'acceptable-use', title: 'Acceptable Use', body: (
    <p>You agree not to: use services for illegal activity, spam, phishing, or fraud; reverse-engineer or abuse the API beyond your rate limits; resell services without authorization; or interfere with other users&apos; service availability.</p>
  ) },
  { id: 'liability', title: 'Limitation of Liability', body: (
    <p>Services are provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, MZAZI TECH INC shall not be liable for indirect, incidental, or consequential damages arising from use of the services.</p>
  ) },
  { id: 'changes', title: 'Changes', body: (
    <p>We may update these terms from time to time. Continued use after changes constitutes acceptance. Material changes will be communicated on this page.</p>
  ) },
  { id: 'contact', title: 'Contact', body: (
    <p>Questions about these terms? <Link href="/contact" className="link">Contact our support team</Link>.</p>
  ) },
];

export const metadata = {
  title: 'Terms of Service',
  description: 'The agreement covering your use of MZAZI TECH hosting, bots and wallet.',
  alternates: { canonical: 'https://www.mzazi.shop/terms' },
};

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: 'var(--page-tint)', minHeight: '70vh' }}>
      <section className="relative overflow-hidden" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="container-site relative">
          <div className="max-w-3xl">
            <Link href="/" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--muted)', textDecoration: 'none' }}>← Back to home</Link>
            <p className="eyebrow mt-5">Legal</p>
            <h1 className="headline mt-4" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.2rem)' }}>
              Terms of service<span className="accent">.</span>
            </h1>
            <p className="mono text-[10px] uppercase tracking-[0.14em] mt-4" style={{ color: 'var(--dim)' }}>
              Last updated: {UPDATED}
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 17, paddingBottom: 24 }}>
        <div className="container-site max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-4">
            {/* TOC */}
            <aside className="lg:col-span-3">
              <div className="card p-5 lg:sticky lg:top-32">
                <p className="mono text-[10px] uppercase tracking-[0.18em] mb-4" style={{ color: 'var(--dim)' }}>Contents</p>
                <div className="space-y-0.5">
                  {SECTIONS.map(s => (
                    <a key={s.id} href={`#${s.id}`}
                      className="mono block text-[11px] py-1.5 px-2"
                      style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                      {s.title}
                    </a>
                  ))}
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>
                  <Link href="/privacy" className="mono block text-[11px] py-1.5 px-2" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                    Privacy policy →
                  </Link>
                </div>
              </div>
            </aside>

            {/* Body */}
            <div className="lg:col-span-9">
              {SECTIONS.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-32" style={{ padding: '19px 8px', borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)' }}>
                  <div className="grid sm:grid-cols-12 gap-4">
                    <span className="mono text-[11px] sm:col-span-2" style={{ color: 'var(--brand)', paddingTop: 3 }}>{String(i + 1).padStart(2, '0')}</span>
                    <div className="sm:col-span-10">
                      <h2 className="section-title text-lg mb-3" style={{ color: 'var(--ink)' }}>{s.title}</h2>
                      <div className="text-sm leading-relaxed space-y-3" style={{ color: 'var(--ink-2)' }}>{s.body}</div>
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
