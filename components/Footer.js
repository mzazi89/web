// MZAZI TECH — site footer.
//
// Deliberately one line. The link columns that used to live here duplicated the
// main navigation, so they were removed: the navbar is the directory, this is
// only the mark and the year.

export default function Footer() {
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
          padding: '13px 16px',
          textAlign: 'center',
          fontSize: 11.5,
          letterSpacing: '0.01em',
          color: 'var(--dim)',
        }}
      >
        © {new Date().getFullYear()} Mzazi Tech
      </p>
    </footer>
  );
}
