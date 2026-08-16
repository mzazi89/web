'use client';

const contributors = [
  {
    name: 'DOMINIC MOKUA KERUBO',
    role: 'Founder',
    company: 'Mzazi Tech',
    initials: 'DM',
    code: '01',
  },
  {
    name: 'ANTONY OCHIENG',
    role: 'Founder',
    company: 'Blacklord Tech',
    initials: 'AO',
    code: '02',
  },
  {
    name: 'BIG BROTHER',
    role: 'Founder',
    company: 'Darknode XMD',
    initials: 'BB',
    code: '03',
  },
];

function ContributorCard({ c }) {
  return (
    <div
      className="card card-pad text-center transition-all duration-300 hover:-translate-y-1"
      style={{ padding: '32px 26px', background: '#14181D' }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '18px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'rgba(242,169,59,0.1)',
          border: '1px solid rgba(242,169,59,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', fontWeight: 800, color: '#F2A93B',
          fontFamily: 'var(--font-display)',
          margin: '0 auto',
        }}>
          {c.initials}
        </div>
        <span className="mono text-[9px] font-bold"
          style={{
            position: 'absolute', bottom: -4, right: -6,
            padding: '2px 6px', background: '#0F1215', border: '1px solid #262C33',
            color: '#4C535B', borderRadius: 2,
          }}>
          {c.code}
        </span>
      </div>

      <h3 className="display font-bold text-base mb-1.5" style={{ color: '#E9E7E2', lineHeight: 1.3 }}>
        {c.name}
      </h3>
      <p className="mono text-[10px] uppercase tracking-[0.14em] mb-1" style={{ color: '#F2A93B' }}>{c.role}</p>
      <p className="text-xs" style={{ color: '#4C535B' }}>{c.company}</p>
      <div style={{ width: '36px', height: '1px', margin: '18px auto 0', background: '#262C33' }} />
    </div>
  );
}

export default function Contributors() {
  return (
    <section className="section" style={{ paddingTop: 88, paddingBottom: 88 }}>
      <div className="container-site max-w-5xl">
        <div className="text-center mb-14">
          <span className="tag tag-amber mb-6">Project contributors</span>
          <h2 className="section-title text-3xl sm:text-4xl mt-4" style={{ color: '#E9E7E2' }}>
            Built by visionaries<span className="bar" style={{ margin: '14px auto 0' }} />
          </h2>
          <p className="text-sm mt-5 max-w-md mx-auto" style={{ color: '#79818A' }}>
            The founders and innovators who brought this platform to life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contributors.map(c => <ContributorCard key={c.name} c={c} />)}
        </div>
      </div>
    </section>
  );
}
