// MZAZI TECH — site footer.
//
// One line: the mark and the year. The link row (Terms, Privacy, App, Contact,
// Help) was removed on request — the navbar is the directory, and the legal
// pages remain published at /terms and /privacy with their sitemap entries
// intact.
//
// Note for whoever ships the Android build: Google Play's Data safety form and
// AdMob both expect the privacy policy to be reachable *from the app*. In the
// app that is satisfied by the in-app menu, not by this footer — but if the app
// wraps this page, the policy must be linked somewhere the user can see.

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="site-footer"
      style={{
        background: 'var(--bg-2)',
        borderTop: '1px solid var(--line)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <p
        style={{
          margin: 0,
          padding: '12px 16px 13px',
          textAlign: 'center',
          fontSize: 11.5,
          letterSpacing: '0.01em',
          color: 'var(--dim)',
        }}
      >
        © {year} Mzazi Tech
      </p>
    </footer>
  );
}
