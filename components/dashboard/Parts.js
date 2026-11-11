import Link from 'next/link';
import { Icons } from '@/components/ui';

// MZAZI TECH — small presentational pieces shared by the dashboard pages.
// Server components on purpose: no state, no bundle.

export function PageHead({ eyebrow, title, sub, actions }) {
  return (
    <header className="dash-head">
      <div style={{ minWidth: 0 }}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="dash-title">{title}</h1>
        {sub && <p className="dash-sub">{sub}</p>}
      </div>
      {actions && <div className="dash-head-actions">{actions}</div>}
    </header>
  );
}

export function Kpi({ label, value, note, Icon, href, tone }) {
  const body = (
    <>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {Icon && <span className="kpi-ico"><Icon size={13} /></span>}
      </div>
      <p className={`kpi-value ${tone ? `is-${tone}` : ''}`}>{value}</p>
      {note && <p className="kpi-note">{note}</p>}
    </>
  );
  return href
    ? <Link href={href} className="kpi kpi-link">{body}</Link>
    : <div className="kpi">{body}</div>;
}

const TONES = {
  active: 'good', success: 'good', done: 'good', online: 'good',
  pending: 'warn', processing: 'warn', suspended: 'warn',
  failed: 'bad', expired: 'bad', revoked: 'bad', abandoned: 'bad', terminated: 'bad',
};

export function Status({ value }) {
  const key = String(value || 'unknown').toLowerCase();
  return <span className={`pill-status is-${TONES[key] || 'muted'}`}>{value || 'unknown'}</span>;
}

export function Panel({ title, sub, action, children, pad = true }) {
  return (
    <section className="card dash-panel">
      <div className="dash-panel-head">
        <div style={{ minWidth: 0 }}>
          <h2 className="dash-panel-title">{title}</h2>
          {sub && <p className="dash-panel-sub">{sub}</p>}
        </div>
        {action}
      </div>
      <div className={pad ? 'dash-panel-body' : ''}>{children}</div>
    </section>
  );
}

export function Empty({ title, body, href, label = 'Browse', Icon = Icons.Box }) {
  return (
    <div className="dash-empty">
      <span className="dash-empty-ico"><Icon size={18} /></span>
      <p className="dash-empty-title">{title}</p>
      {body && <p className="dash-empty-body">{body}</p>}
      {href && <Link href={href} className="btn btn-primary" style={{ marginTop: 10 }}>{label}</Link>}
    </div>
  );
}

export function Line({ label, value, note, right }) {
  return (
    <div className="dash-line">
      <div style={{ minWidth: 0 }}>
        <p className="dash-line-label">{label}</p>
        {note && <p className="dash-line-note">{note}</p>}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>{right || <span className="dash-line-value">{value}</span>}</div>
    </div>
  );
}
