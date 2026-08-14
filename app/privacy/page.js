import Link from 'next/link';
import TypingHeading from '@/components/TypingHeading';

export default function PrivacyPage() {
  return (
    <div className="container-site py-12 max-w-3xl" style={{ minHeight: '70vh' }}>
      <Link href="/" className="text-xs font-semibold" style={{ color: '#475569', textDecoration: 'none' }}>← Back to Home</Link>
      <h1 className="text-3xl font-extrabold mt-3 mb-6"><TypingHeading as="span" text="Privacy Policy" speed={45} className="gradient-text" /></h1>
      <p className="text-xs mb-8" style={{ color: '#64748b' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="space-y-6 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>1. What We Collect</h2>
          <p><strong style={{ color: '#cbd5e1' }}>Account data:</strong> name, email, and password (hashed). <strong style={{ color: '#cbd5e1' }}>Payment data:</strong> handled by Paystack — we never store card details. <strong style={{ color: '#cbd5e1' }}>Usage data:</strong> API requests, panel usage, and wallet transactions for billing and analytics. <strong style={{ color: '#cbd5e1' }}>WhatsApp bot data:</strong> session tokens only — never your messages or contacts.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>2. How We Use It</h2>
          <p>To provide and improve our services, process payments, prevent fraud and abuse, and communicate service updates. We do not sell your personal data to third parties.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>3. API Keys & Security</h2>
          <p>MZAZI API keys are stored as secure hashes — plaintext keys are shown only once at creation. Passwords are bcrypt-hashed. We enforce HTTPS, rate limiting, and access controls on all customer data.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>4. Cookies</h2>
          <p>We use essential cookies for authentication sessions. No advertising or third-party tracking cookies are used.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>5. Data Retention</h2>
          <p>We retain account and transaction records as required for billing and legal compliance. You may request deletion of your account data by contacting support.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>6. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data. To exercise these rights, <Link href="/contact" style={{ color: '#60a5fa' }}>contact us</Link>.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f4ff' }}>7. Contact</h2>
          <p>Privacy questions: <Link href="/contact" style={{ color: '#60a5fa' }}>contact our support team</Link>.</p>
        </section>
      </div>
    </div>
  );
}
