import Link from 'next/link';
import { Icons } from '@/components/ui';
import { getViewer } from '@/lib/dashboard/session';
import { getPackages, getPurchases, money, shortDate } from '@/lib/dashboard/data';
import { PLANS } from '@/lib/pairApi';
import { PageHead, Panel, Empty, Status, Line } from '@/components/dashboard/Parts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Marketplace' };

// MZAZI TECH — marketplace.
//
// Prices come from the live catalogue tables (`packages`, `vps_packages`) and
// the plan matrix the pairing API charges against, so the shelf can never quote
// a price the checkout will not honour. Buying hands off to the existing
// checkout pages rather than re-implementing payment here.

export default async function MarketplacePage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const [{ panels, vps }, orders] = await Promise.all([getPackages(), getPurchases(viewer.id)]);
  const botPlans = Object.values(PLANS).filter((p) => p.id !== 'FREE').sort((a, b) => a.price - b.price);

  return (
    <>
      <PageHead
        eyebrow="Catalogue"
        title="Marketplace"
        sub="Prices are live from the catalogue — what you see is what the wallet is charged."
        actions={<Link href="/dashboard/wallet" className="btn btn-ghost"><Icons.Wallet size={14} /> Wallet</Link>}
      />

      <Panel title="Pterodactyl panels" sub="Game and app servers, provisioned with credentials" action={<Link href="/products" className="dash-mini-link">Full page <Icons.ArrowUpRight size={12} /></Link>}>
        {panels.length === 0 ? (
          <Empty Icon={Icons.Server} title="No packages live" body="The catalogue is empty right now. Check back shortly." href="/contact" label="Ask us" />
        ) : (
          <div className="shelf">
            {panels.map((p) => (
              <div className={`shelf-card ${Number(p.popular) ? 'is-popular' : ''}`} key={p.id}>
                {Number(p.popular) ? <span className="price-tag">Popular</span> : null}
                <span className="shelf-name">{p.name}</span>
                <p className="shelf-price">{money(p.price)}<small> / month</small></p>
                <p className="shelf-specs">
                  {(p.ram ? `${(p.ram / 1024).toFixed(p.ram % 1024 ? 1 : 0)} GB RAM` : 'Unmetered RAM')} ·{' '}
                  {(p.disk ? `${(p.disk / 1024).toFixed(0)} GB disk` : 'Unmetered disk')}
                </p>
                {p.description && <p className="shelf-desc">{p.description}</p>}
                <Link href="/products" className="btn btn-primary" style={{ marginTop: 'auto' }}>Deploy</Link>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="WhatsApp bot plans" sub="Billed per 30 days from your wallet" action={<Link href="/subscription" className="dash-mini-link">Compare <Icons.ArrowUpRight size={12} /></Link>}>
        <div className="shelf">
          {botPlans.map((plan) => (
            <div className="shelf-card" key={plan.id}>
              <span className="shelf-name">{plan.label || plan.id}</span>
              <p className="shelf-price">{money(plan.price)}<small> / 30 days</small></p>
              <p className="shelf-specs">{plan.maxDevices >= 999 ? 'Unlimited devices' : `${plan.maxDevices} devices`}</p>
              <Link href="/subscription" className="btn btn-ghost" style={{ marginTop: 'auto' }}>Choose</Link>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="VPS hosting" sub="NVMe KVM with root access" action={<Link href="/vps" className="dash-mini-link">Configure <Icons.ArrowUpRight size={12} /></Link>}>
        {vps.length === 0 ? (
          <Empty Icon={Icons.Cpu} title="VPS stock is configured per order" body="Tell us the specs you need and we provision the instance." href="/vps" label="Open VPS" />
        ) : (
          <div className="shelf">
            {vps.map((v) => (
              <div className="shelf-card" key={v.id}>
                <span className="shelf-name">{v.name}</span>
                <p className="shelf-price">{money(v.price)}<small> / month</small></p>
                <p className="shelf-specs">{v.ram} MB RAM · {v.cpu} CPU · {v.disk} MB · {v.region || v.location || 'KE'}</p>
                <Link href="/vps" className="btn btn-ghost" style={{ marginTop: 'auto' }}>Order</Link>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Order history" sub="What this account has bought">
        {orders.length === 0 ? (
          <Empty Icon={Icons.Receipt} title="No orders yet" body="Purchases show up here with their status and date." href="/dashboard/marketplace" label="Browse" />
        ) : orders.map((o) => (
          <Line
            key={o.id}
            label={o.item}
            note={`${o.kind} · ${shortDate(o.date)}`}
            right={
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                {o.amount ? <b className="dash-amount">{money(o.amount)}</b> : null}
                <Status value={o.status} />
              </span>
            }
          />
        ))}
      </Panel>
    </>
  );
}
