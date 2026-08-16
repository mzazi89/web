import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-site py-28 sm:py-36" style={{ minHeight: '70vh' }}>
      <div className="grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-5">
          <p className="eyebrow">Error 404</p>
          <div className="watermark" style={{ fontSize: 'clamp(6rem, 18vw, 11rem)', marginTop: 16 }}>
            404
          </div>
        </div>
        <div className="lg:col-span-7">
          <h1 className="headline" style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)' }}>
            Page not found<span className="accent">.</span>
          </h1>
          <p className="lede mt-5 max-w-lg">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>
          <div className="flex flex-wrap gap-3 mt-9">
            <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Back to home</Link>
            <Link href="/api" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Explore the API</Link>
            <Link href="/contact" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Contact support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
