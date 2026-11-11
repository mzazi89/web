import Link from 'next/link';

// MZAZI TECH — /privacy.
//
// The section order is not arbitrary: what we collect, then the one thing
// customers actually worry about (their chats), then everything else. The
// WhatsApp section carries a callout because it is the question support is
// asked most and the answer was previously buried in a clause.

const UPDATED = '11 November 2026';

const A = ({ href, children }) => (
  <Link href={href} className="link">{children}</Link>
);

const SECTIONS = [
  {
    id: 'collect',
    title: 'What we collect',
    body: (
      <>
        <p>
          <strong style={{ color: 'var(--ink)' }}>Account data:</strong> name, email, and a
          password we store only as a bcrypt hash.{' '}
          <strong style={{ color: 'var(--ink)' }}>Payment data:</strong> handled by Paystack —
          we store the transaction record and the phone number used, never card details.{' '}
          <strong style={{ color: 'var(--ink)' }}>Service data:</strong> wallet transactions,
          API request counts, panel and VPS assignments, and the bot devices you connect.
        </p>
      </>
    ),
  },

  {
    id: 'messages',
    title: 'Your WhatsApp messages',
    body: (
      <>
        <div
          className="card"
          style={{
            padding: '14px 16px',
            borderLeft: '3px solid var(--brand)',
            background: 'var(--brand-tint)',
            marginBottom: 4,
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>
            We cannot read the conversations of anyone who has linked a bot.
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--ink-2)' }}>
            There is no screen, export or support tool that shows us your chats, your
            contacts, or the messages of people talking to your bot. This is a limit of
            what we build, not a promise we ask you to take on faith.
          </p>
        </div>

        <p>
          A linked bot appears in WhatsApp under <em>Linked devices</em>, exactly like
          WhatsApp Web. That is what lets it reply: the message arrives on the device you
          linked and is handled in memory to run the command it contains.
        </p>

        <p>
          <strong style={{ color: 'var(--ink)' }}>What we store:</strong> the pairing
          credential that keeps the device linked, your plan, and the list of devices on
          your account. We do <strong style={{ color: 'var(--ink)' }}>not</strong> store
          message text, chat history, contact lists, or media. Message content that has to
          be held to run a feature — such as the short in-memory cache behind
          anti-delete — is discarded when the bot restarts, and never written to our
          database or to disk.
        </p>

        <p>
          <strong style={{ color: 'var(--ink)' }}>What we never do:</strong> read your
          chats for support, advertising or training; sell or share message content; or ask
          for your WhatsApp password or two-step verification code. Nobody at MZAZI TECH
          does, and nothing in our systems would let them.
        </p>

        <p>
          <strong style={{ color: 'var(--ink)' }}>You stay in control:</strong> removing the
          device in WhatsApp → <em>Linked devices</em> ends our access immediately, with or
          without telling us. If you ask us to unlink a bot, we delete its stored
          credential.
        </p>
      </>
    ),
  },

  {
    id: 'use',
    title: 'How we use what we hold',
    body: (
      <p>
        To run the services you bought, take payment, keep your session signed in, prevent
        fraud and abuse, and tell you about outages, renewals and changes that affect you.
        We do not sell personal data, and we do not use your content to train models.
      </p>
    ),
  },

  {
    id: 'ads',
    title: 'Advertising',
    body: (
      <>
        <p>
          The website loads Google AdSense and the Android app shows Google AdMob ads.
          Google may use cookies and, in the app, your device&apos;s advertising ID to
          choose and measure those ads. We do not give Google your name, email, phone
          number or wallet activity, and we never pass it anything you typed into the bot.
        </p>
        <p>
          Where the law requires it — the EEA, the UK and Switzerland — the app asks for
          your consent through Google&apos;s consent form before any ad is requested, and
          you can change or withdraw that choice at any time from the app&apos;s privacy
          settings. You can also reset or delete your advertising ID in Android settings.
        </p>
      </>
    ),
  },

  {
    id: 'cookies',
    title: 'Cookies',
    body: (
      <p>
        We set one essential cookie: the signed session token that keeps you logged in. We
        set no tracking cookies of our own. Google&apos;s advertising and analytics cookies
        are described in the section above and are governed by Google&apos;s own policies.
      </p>
    ),
  },

  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        Passwords are bcrypt-hashed. API keys are stored only as hashes and shown once, at
        creation. Traffic is HTTPS end to end, admin access is separately authenticated,
        and every customer query is scoped to the signed-in account rather than to an ID
        supplied by the browser.
      </p>
    ),
  },

  {
    id: 'sharing',
    title: 'Who processes data for us',
    body: (
      <p>
        Vercel (hosting), Neon (database), Paystack (payments), and Google (advertising).
        Each receives only what its job needs. We do not sell data, and we disclose it
        otherwise only where the law compels us.
      </p>
    ),
  },

  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <p>
        Account and transaction records are kept while your account is open and afterwards
        for as long as tax and accounting rules require. Bot pairing credentials are
        deleted when you unlink the device. Message content is never retained, so there is
        nothing to expire.
      </p>
    ),
  },

  {
    id: 'rights',
    title: 'Your rights',
    body: (
      <p>
        You can ask for a copy of your data, have it corrected, or have your account and
        personal data deleted. Email <A href="/contact">our team</A> from the address on the
        account and we will action it, subject to records we must keep by law.
      </p>
    ),
  },

  {
    id: 'children',
    title: 'Children',
    body: (
      <p>
        The services are for business and adult use. We do not knowingly collect data from
        anyone under 18; if you believe a child has created an account, contact us and we
        will remove it.
      </p>
    ),
  },

  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        When we change how data is handled we update this page and its date. Continuing to
        use the services after a change means you accept the updated policy.
      </p>
    ),
  },

  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p>
        Privacy questions and data requests: <A href="/contact">contact our support team</A>.
        The same terms govern your use of the service — see the{' '}
        <A href="/terms">Terms of Service</A>.
      </p>
    ),
  },
];

export const metadata = {
  title: 'Privacy Policy',
  description:
    'What MZAZI TECH collects, how it is used, and the one thing we will never see: the WhatsApp conversations of anyone who links a bot.',
  alternates: { canonical: 'https://www.mzazi.shop/privacy' },
};

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: 'var(--page-tint)', minHeight: '70vh' }}>
      <section className="relative overflow-hidden" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="container-site relative">
          <div className="max-w-3xl">
            <Link href="/" className="mono text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--muted)', textDecoration: 'none' }}>← Back to home</Link>
            <p className="eyebrow mt-5">Legal</p>
            <h1 className="headline mt-4" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.2rem)' }}>
              Privacy policy<span className="accent">.</span>
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
                  <Link href="/terms" className="mono block text-[11px] py-1.5 px-2" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                    Terms of service →
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
