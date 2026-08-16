import Link from 'next/link';
import AuthSwap from '@/components/AuthSwap';
import { fmtMtc, fmtMtcValue, mtcToKsh } from '@/lib/currency';

const values = [
  { num: '01', title: 'Speed First', desc: 'Deploy servers in under 2 minutes. No waiting, no friction — just instant results.' },
  { num: '02', title: 'Security', desc: 'Enterprise-grade security with encrypted connections and isolated server environments.' },
  { num: '03', title: 'Worldwide', desc: 'Built for everyone. Mobile money (M-Pesa), card payments, global support, MTC coin pricing.' },
  { num: '04', title: '24/7 Support', desc: 'Our team is always available via Telegram to help you with any issue.' },
];

const STORY_STATS = [
  { n: '500+', l: 'Active panels' },
  { n: '1000+', l: 'Happy clients' },
  { n: '99.9%', l: 'Uptime SLA' },
  { n: '24/7', l: 'Support hours' },
];

const API_STATS = [
  { n: '200+', l: 'Live endpoints' },
  { n: '15+', l: 'Categories' },
  { n: '2', l: 'Providers' },
  { n: '24/7', l: 'Availability' },
];

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: 'rgba(15,18,21,0.35)' }}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none grid-bg" style={{ maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent 80%)' }} />
        <div className="absolute top-10 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(242,169,59,0.07) 0%, transparent 70%)', filter: 'blur(56px)' }} />
        <div className="container-site relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="eyebrow">About us</p>
            <h1 className="headline mt-5" style={{ fontSize: 'clamp(2.1rem, 5vw, 3.6rem)' }}>
              We power the world&apos;s digital infrastructure<span className="accent">.</span>
            </h1>
            <p className="lede mt-6 max-w-2xl">
              MZAZI TECH INC is a global tech company specializing in game server hosting, WhatsApp
              automation, public APIs, and digital infrastructure solutions. We believe powerful
              technology should be affordable and accessible to everyone, everywhere.
            </p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-14 pt-10" style={{ borderTop: '1px solid #1B2026' }}>
            {STORY_STATS.map(s => (
              <div key={s.l}>
                <div className="stat-num" style={{ color: '#F2A93B' }}>{s.n}</div>
                <div className="stat-label">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section" style={{ background: 'rgba(255,255,255,0.014)' }}>
        <div className="container-site grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Mission</p>
            <h2 className="section-title text-3xl mt-4" style={{ color: '#E9E7E2' }}>
              Infrastructure for everyone
              <span className="bar" />
            </h2>
            <blockquote className="border-l-2 pl-6 py-2 mt-8" style={{ borderColor: '#F2A93B' }}>
              <p className="display text-xl font-semibold leading-snug" style={{ color: '#E9E7E2' }}>
                “Power your digital world.”
              </p>
              <footer className="mono text-[10px] uppercase tracking-[0.18em] mt-3" style={{ color: '#4C535B' }}>
                The Mzazi motto
              </footer>
            </blockquote>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <p className="lede">
              To democratize access to powerful cloud infrastructure for businesses and individuals
              worldwide. We offer enterprise-level Pterodactyl panel hosting at prices anyone can
              afford — starting from just 5 MTC/month.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#79818A' }}>
              From small WhatsApp bots to large-scale game servers and Pterodactyl panels for
              WhatsApp bots, we provide the infrastructure backbone so you can focus on what
              matters — building your product.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#79818A' }}>
              We also run <strong style={{ color: '#E9E7E2' }}>MZAZI API</strong> — a developer
              platform with 200+ live endpoints for downloads, AI, search, tools and more, powered
              by multiple upstream providers and secured with API-key authentication and usage
              analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container-site">
          <div className="max-w-3xl mb-12">
            <p className="eyebrow">What we stand for</p>
            <h2 className="section-title text-3xl sm:text-4xl mt-4" style={{ color: '#E9E7E2' }}>
              Our values
              <span className="bar" />
            </h2>
          </div>

          <div>
            {values.map(v => (
              <div key={v.title} className="row-item">
                <span className="row-num">/{v.num}</span>
                <div>
                  <h3 style={{ color: '#E9E7E2' }}>{v.title}</h3>
                  <p>{v.desc}</p>
                </div>
                <span className="row-tag" style={{ color: '#4C535B' }}>—</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MZAZI API */}
      <section className="section" style={{ background: 'rgba(255,255,255,0.014)' }}>
        <div className="container-site">
          <div className="card card-pad relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #14181D 0%, #0F1215 100%)' }}>
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 85% 15%, rgba(242,169,59,0.08) 0%, transparent 55%)' }} />
            <div className="relative grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <p className="eyebrow">Developer platform</p>
                <h2 className="section-title text-3xl mt-4" style={{ color: '#E9E7E2' }}>
                  MZAZI API<span className="bar" /></h2>
                <p className="text-sm sm:text-base leading-relaxed mt-6 max-w-xl" style={{ color: '#AEB5BD' }}>
                  One API. Multiple services. Downloads, AI chat, image generation, search, games,
                  news and tools — exposed through a single key, a single JSON envelope, with rate
                  limits and usage analytics.
                </p>
                <div className="flex flex-wrap gap-4 mt-8">
                  <Link href="/api" className="btn btn-primary" style={{ textDecoration: 'none' }}>Explore the API</Link>
                  <Link href="/api/docs" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Documentation</Link>
                </div>
              </div>
              <div className="lg:col-span-5">
                <div className="grid grid-cols-2 gap-px card overflow-hidden" style={{ background: '#262C33' }}>
                  {API_STATS.map(s => (
                    <div key={s.l} className="card p-5" style={{ background: '#14181D' }}>
                      <div className="stat-num" style={{ fontSize: '1.7rem', color: '#F2A93B' }}>{s.n}</div>
                      <div className="stat-label">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ paddingBottom: 110 }}>
        <div className="container-site">
          <div className="text-center max-w-2xl mx-auto">
            <p className="eyebrow center">Join us</p>
            <h2 className="headline mt-6" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
              Ready to get started<span className="accent">?</span>
            </h2>
            <p className="text-sm mt-4 mb-8" style={{ color: '#79818A' }}>
              Join hundreds of customers worldwide already using MZAZI TECH for their hosting needs.
            </p>
            <AuthSwap
              signedOut={
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/signup" className="btn btn-primary" style={{ textDecoration: 'none' }}>Get started</Link>
                  <Link href="/contact" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Contact us</Link>
                </div>
              }
              signedIn={
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/dashboard" className="btn btn-primary" style={{ textDecoration: 'none' }}>Go to dashboard</Link>
                  <Link href="/api/dashboard" className="btn btn-ghost" style={{ textDecoration: 'none' }}>Open API dashboard</Link>
                </div>
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
