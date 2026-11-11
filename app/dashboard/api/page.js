import Link from 'next/link';
import { Icons } from '@/components/ui';
import { getViewer } from '@/lib/dashboard/session';
import { getApiKeys, getApiUsage, shortDate } from '@/lib/dashboard/data';
import { PageHead, Panel, Kpi, Line, Status, Empty } from '@/components/dashboard/Parts';
import ApiKeys from '@/components/dashboard/ApiKeys';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'API management' };

// MZAZI TECH — API management.
//
// Keys are read from `api_keys` for this user only; the raw secret is never
// stored, so this page can only ever show the prefix. Create / regenerate /
// revoke go through the existing /api/api-keys endpoints, which hash with the
// platform pepper and enforce the per-user key cap.

export default async function ApiPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const [keys, usage] = await Promise.all([getApiKeys(viewer.id), getApiUsage(viewer.id)]);
  const active = keys.filter((k) => String(k.status).toLowerCase() === 'active').length;
  const rate = usage.total > 0 ? Math.round((usage.success / usage.total) * 100) : 100;

  return (
    <>
      <PageHead
        eyebrow="Developers"
        title="API management"
        sub="525 endpoints behind one key. Keys are hashed — we can show the prefix, never the secret."
        actions={<Link href="/api/docs" className="btn btn-ghost"><Icons.ExternalLink size={14} /> Documentation</Link>}
      />

      <div className="kpi-grid">
        <Kpi label="Calls today" value={usage.today} note="resets at midnight EAT" Icon={Icons.Activity} />
        <Kpi label="Lifetime calls" value={usage.total.toLocaleString()} note={usage.total > 0 ? `${rate}% success` : 'no calls yet'} Icon={Icons.Code} />
        <Kpi label="Active keys" value={active} note={`${keys.length} total`} Icon={Icons.Key} href="/dashboard/api" />
        <Kpi label="Endpoints" value="525" note="marketplace catalogue" Icon={Icons.Globe} href="/api/docs" />
      </div>

      <Panel title="API keys" sub="Create, rotate and revoke access">
        <ApiKeys initial={keys} />
      </Panel>

      <Panel title="Recent requests" sub="Last six calls from your keys" action={<Link href="/api/docs" className="dash-mini-link">Reference <Icons.ArrowUpRight size={12} /></Link>}>
        {usage.recent.length === 0 ? (
          <Empty Icon={Icons.Activity} title="No calls yet" body="Point a key at any endpoint and the traffic shows up here within a second." href="/api/docs" label="Read the docs" />
        ) : usage.recent.map((r, i) => (
          <Line
            key={`${r.endpoint}-${i}`}
            label={`${r.method} ${r.endpoint}`}
            note={`${shortDate(r.created_at)} · ${r.response_time_ms ? `${r.response_time_ms} ms` : 'timing n/a'}`}
            right={<Status value={r.status_code < 400 ? 'success' : 'failed'} />}
          />
        ))}
      </Panel>

      <Panel title="Limits & quotas" sub="Enforced per key, per day">
        <div className="note-grid">
          <div className="note"><Icons.Shield size={14} /><p><b>Free</b> — 250 calls/day per key. Enough to build against the whole catalogue.</p></div>
          <div className="note"><Icons.Zap size={14} /><p><b>Paid plans</b> — raised daily ceilings on the same key; the limit is checked before the upstream call, so you never pay for a rejected request.</p></div>
          <div className="note"><Icons.Activity size={14} /><p><b>Visibility</b> — every call is logged with status and latency. Revoking a key stops traffic immediately.</p></div>
        </div>
      </Panel>
    </>
  );
}
