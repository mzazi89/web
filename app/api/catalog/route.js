// MZAZI API — GET /api/catalog
//
// One shelf for everything MZAZI sells: panels (packages), VPS (vps_packages),
// WhatsApp bot plans (the matrix the pairing API charges against), the developer
// API and custom engineering.
//
// Nothing here is invented: a product only appears if a table row or an
// enforced price backs it. VPS stock is currently configured per order, so that
// entry carries a null price and hands off to /vps instead of pretending to be
// a fixed SKU.

import { NextResponse } from 'next/server';
import sql from '../../../lib/database';
import { ensurePanelCatalog } from '@/lib/panel-catalog';
import { PLANS } from '@/lib/pairApi';

export const dynamic = 'force-dynamic';

// Admin-entered VPS sizes are free text: "4gb", "8 GB", 4096. Never glue a unit
// onto a value that already carries one.
const size = (v, fallbackUnit = 'MB') => {
  const s = String(v ?? '').trim();
  if (!s) return '—';
  if (/[a-z]/i.test(s)) return s;
  const n = Number(s);
  return Number.isFinite(n) ? `${n} ${fallbackUnit}` : s;
};

const opts = { fetchOptions: { cache: 'no-store' } };

export async function GET() {
  try {
    await ensurePanelCatalog(sql);

    const [panels, vps, endpointRow] = await Promise.all([
      sql`
        SELECT id, name, price, cpu, ram, disk, description, popular, accent,
               expires_after_hours, category, discount_percent
        FROM packages
        WHERE active = true
        ORDER BY sort_order ASC, id ASC
      `,
      sql`
        SELECT id, name, price, cpu, ram, disk, bandwidth, location
        FROM vps_packages
        WHERE active IS NOT FALSE
        ORDER BY price ASC
      `.catch(() => []),
      sql`SELECT COUNT(*)::int AS n FROM endpoints WHERE is_active = true`.catch(() => [{ n: 0 }]),
    ]);

    const items = [];

    for (const p of panels) {
      items.push({
        id: `panel-${p.id}`,
        kind: 'panel',
        ref: p.id,
        category: p.category || 'pterodactyl',
        name: p.name,
        description: p.description || '',
        price: Number(p.price),
        discount_percent: Number(p.discount_percent || 0),
        popular: Number(p.popular) === 1 || p.popular === true,
        specs: { ram: p.ram, cpu: p.cpu, disk: p.disk },
        href: '/products',
      });
    }

    for (const v of vps) {
      items.push({
        id: `vps-${v.id}`,
        kind: 'vps',
        ref: v.id,
        category: 'vps',
        name: v.name || 'VPS instance',
        description: `${size(v.ram)} RAM · ${size(v.cpu, '%')} CPU · ${size(v.disk)} NVMe${v.location ? ` · ${v.location}` : ''}`,
        price: Number(v.price),
        discount_percent: 0,
        specs: { ram: v.ram, cpu: v.cpu, disk: v.disk, bandwidth: v.bandwidth, location: v.location },
        href: '/vps',
      });
    }

    // No published VPS stock yet — still list the line so the catalogue is
    // honest about what exists, and route to the configure page.
    if (vps.length === 0) {
      items.push({
        id: 'vps-custom',
        kind: 'vps',
        category: 'vps',
        name: 'VPS hosting',
        description: 'NVMe KVM instances with root access, built to your spec. Tell us the size and we provision it.',
        price: null,
        discount_percent: 0,
        specs: { location: 'Nairobi / EU', disk: 'NVMe', access: 'root' },
        href: '/vps',
      });
    }

    for (const plan of Object.values(PLANS)) {
      items.push({
        id: `bot-${plan.key}`,
        kind: 'bot',
        ref: plan.key,
        category: 'bot',
        name: `WhatsApp bot · ${plan.name}`,
        description: plan.maxDevices >= 999
          ? 'Unlimited devices on one number, all 1,269 commands, priority pairing.'
          : `${plan.name} on one WhatsApp number with the full command set and group tools.`,
        price: plan.priceKsh,
        discount_percent: 0,
        specs: { devices: plan.maxDevices >= 999 ? 'Unlimited' : plan.maxDevices, days: plan.days },
        href: '/subscription',
      });
    }

    items.push({
      id: 'api-platform',
      kind: 'api',
      category: 'api',
      name: 'Developer API',
      description: `${endpointRow[0]?.n || 0} live endpoints behind one key — free tier, daily quotas, full request logs.`,
      price: 0,
      discount_percent: 0,
      specs: { endpoints: endpointRow[0]?.n || 0, free: '250 calls/day' },
      href: '/api/docs',
    });

    items.push({
      id: 'custom-build',
      kind: 'service',
      category: 'service',
      name: 'Custom engineering',
      description: 'Bots, integrations and internal tools built to spec — scoped per project.',
      price: null,
      discount_percent: 0,
      specs: { delivery: 'Scoped', support: 'Direct' },
      href: '/contact',
    });

    const seen = new Set();
    const unique = items.filter((i) => {
      const key = `${i.kind}|${i.name}|${i.price}|${i.description}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ items: unique }, opts);
  } catch (e) {
    console.error('[catalog] failed:', e.message);
    return NextResponse.json({ error: 'The catalogue is unavailable right now.' }, { status: 500 });
  }
}
