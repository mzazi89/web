'use client';

// Global error boundary — professional error state instead of a white screen
export default function GlobalError({ error, reset }) {
  return (
    <div className="container-site py-28 sm:py-36 text-center" style={{ minHeight: '70vh' }}>
      <p className="mono text-[11px] uppercase tracking-[0.2em] mb-6" style={{ color: '#E5484D' }}>
        System fault
      </p>
      <h1 className="headline" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)' }}>
        Something went wrong<span className="accent">.</span>
      </h1>
      <p className="lede max-w-md mx-auto mt-5">
        An unexpected error occurred. Please try again — if it keeps happening, contact our support team.
      </p>
      <div className="flex flex-wrap justify-center gap-3 mt-9">
        <button onClick={() => reset()}
          className="btn btn-primary" style={{ cursor: 'pointer' }}>
          Try again
        </button>
        <a href="/" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Back to home</a>
      </div>
    </div>
  );
}
