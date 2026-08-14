import Link from 'next/link';
import TypingHeading from '@/components/TypingHeading';

export default function TermsPage() {
  return (
    <div className="container-site py-12 max-w-3xl" style={{ minHeight: '70vh' }}>
      <Link href="/" className="text-xs font-semibold" style={{ color: '#475569', textDecoration: 'none' }}>← Back to Home</Link>
      <h1 className="text-3xl font-extrabold mt-3 mb-6"><TypingHeading as="span" text="Terms of Service" speed={45} className="gradient-text" /></h1>
      <p className="text-xs mb-8" style={{ color: '#64748b' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="space-y-6 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>1. Acceptance of Terms</h2>
          <p>By accessing or using MZAZI TECH INC services — including panel hosting, WhatsApp automation bots, the MZAZI API platform, wallet, and temporary number tools — you agree to these Terms of Service. If you do not agree, please do not use the services.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>2. Accounts</h2>
          <p>You must provide accurate information when creating an account and keep your credentials secure. You are responsible for all activity under your account. We may suspend or terminate accounts that violate these terms or applicable law.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>3. Services</h2>
          <p><strong style={{ color: '#cbd5e1' }}>Panel hosting:</strong> paid hosting plans billed monthly in MTC coins. <strong style={{ color: '#cbd5e1' }}>WhatsApp bots:</strong> automation tools — you are responsible for complying with WhatsApp's Terms of Service and applicable messaging laws. <strong style={{ color: '#cbd5e1' }}>MZAZI API:</strong> developer APIs subject to fair-use rate limits per your plan. <strong style={{ color: '#cbd5e1' }}>Temporary numbers:</strong> provided for legitimate verification purposes only — not for fraud, spam, or unlawful activity.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>4. Payments & Refunds</h2>
          <p>Payments are processed via Paystack (M-Pesa/card). Wallet balances are non-refundable except where required by law. Unused hosting periods may be refunded at our discretion within 7 days of purchase for qualifying service issues.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>5. Acceptable Use</h2>
          <p>You agree not to: use services for illegal activity, spam, phishing, or fraud; reverse-engineer or abuse the API beyond your rate limits; resell services without authorization; or interfere with other users' service availability.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>6. Limitation of Liability</h2>
          <p>Services are provided "as is" without warranties of any kind. To the maximum extent permitted by law, MZAZI TECH INC shall not be liable for indirect, incidental, or consequential damages arising from use of the services.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>7. Changes</h2>
          <p>We may update these terms from time to time. Continued use after changes constitutes acceptance. Material changes will be communicated on this page.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>8. Contact</h2>
          <p>Questions about these terms? <Link href="/contact" style={{ color: '#60a5fa' }}>Contact our support team</Link>.</p>
        </section>
      </div>
    </div>
  );
}
