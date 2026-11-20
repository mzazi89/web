import Link from 'next/link';

// MZAZI TECH — site-wide footer.
//
// This exists for one reason: ownership and contact details have to be PUBLIC
// and crawlable. A founder card on /about is easy to miss; the footer is on
// every page, it is plain HTML (no JavaScript needed), and the same facts are
// mirrored in the Organization JSON-LD in app/layout.js, which is what a search
// engine actually reads.
//
// The number is written twice on purpose — once as display text, once inside
// the wa.me href — because a human copies the first and a phone dials the
// second. Both are the same digits in international form, which is the only
// form that works from outside Kenya.

export const CONTACT = {
  owner: 'Dominic Mokua Kerubo',
  role: 'Founder & Chief Executive Officer',
  whatsapp: '254741388986',
  whatsappDisplay: '+254 741 388 986',
  email: 'mzazitechinc@gmail.com',
};

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer no-print" aria-label="Site information">
      <div className="container-site">
        <div className="site-footer-grid">
          <div>
            <div className="site-footer-brand">MZAZI TECH <span>INC</span></div>
            <p className="site-footer-owner">
              MZAZI TECH INC is owned and operated by{' '}
              <strong>{CONTACT.owner}</strong>, {CONTACT.role}.
            </p>
            <p className="site-footer-note">
              Registered in Kenya · Nairobi. Every product on this site is built and
              operated by him.
            </p>
          </div>

          <div>
            <div className="site-footer-head">Talk to the CEO</div>
            <ul className="site-footer-links">
              <li>
                <a
                  href={`https://wa.me/${CONTACT.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Message ${CONTACT.owner} on WhatsApp at ${CONTACT.whatsappDisplay}`}
                >
                  WhatsApp <span className="site-footer-mono">{CONTACT.whatsappDisplay}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} aria-label={`Email ${CONTACT.email}`}>
                  Email <span className="site-footer-mono">{CONTACT.email}</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="site-footer-head">Company</div>
            <ul className="site-footer-links">
              <li><Link href="/about">About &amp; founder</Link></li>
              <li><Link href="/contact">Contact &amp; support</Link></li>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
            </ul>
          </div>
        </div>

        <div className="site-footer-base">
          <span>© {year} MZAZI TECH INC. All rights reserved.</span>
          <span className="site-footer-mono">Founder &amp; CEO: Dominic Mokua Kerubo</span>
        </div>
      </div>
    </footer>
  );
}
