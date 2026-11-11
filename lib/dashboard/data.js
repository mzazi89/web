// MZAZI TECH — dashboard read layer.
//
// Every function takes `userId` and filters on it in SQL. Nothing here accepts
// an id from the client, which is what makes "customers only see their own
// records" a property of the data layer instead of a promise in a comment.
//
// Tables are the ones the rest of the platform already writes:
//   wallet / wallet_transactions   payments (web + Paystack webhook)
//   panels                         Pterodactyl hosting
//   vps_instances                  VPS orders (sold_to)
//   api_keys / api_requests        developer API
//   "User"/"Subscription"/"WhatsAppSession"  bot runtime (Prisma mirror)

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

const ok = async (fn, fallback) => {
  try {
    return await fn();
  } catch (e) {
    console.error('[dashboard] query failed:', e.message);
    return fallback;
  }
};

export const money = (n) =>
  `KES ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const shortDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export async function getWallet(userId) {
  return ok(async () => {
    const [rows, tx] = await Promise.all([
      sql`SELECT balance, updated_at FROM wallet WHERE user_id = ${userId} LIMIT 1`,
      sql`
        SELECT id, type, amount, bonus_amount, status, description, payment_method,
               reference, created_at, paid_at
        FROM wallet_transactions
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
      `,
    ]);
    return { balance: Number(rows[0]?.balance || 0), updatedAt: rows[0]?.updated_at || null, transactions: tx };
  }, { balance: 0, updatedAt: null, transactions: [] });
}

export async function getPanels(userId) {
  return ok(async () => {
    const rows = await sql`
      SELECT id, package_name, package_price, status, created_at, expires_at,
             ptero_username, ptero_server_id
      FROM panels
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return rows;
  }, []);
}

export async function getVps(userId) {
  return ok(async () => {
    const rows = await sql`
      SELECT id, hostname, host, region, os, cpu, status, order_ref, sold_at, created_at
      FROM vps_instances
      WHERE sold_to = ${userId}
      ORDER BY created_at DESC
    `;
    return rows;
  }, []);
}

const PLAN_LABEL = {
  FREE: 'Free',
  PLAN_5: '5 devices',
  PLAN_10: '10 devices',
  PLAN_20: '20 devices',
  UNLIMITED: 'Unlimited',
};

export const planLabel = (plan) => PLAN_LABEL[plan] || String(plan || 'Free').replace(/_/g, ' ');

export async function getBot(userId) {
  return ok(async () => {
    const account = await sql`SELECT id FROM "User" WHERE "telegramId" = ${userId} LIMIT 1`;
    if (!account[0]) return { plan: 'FREE', maxDevices: 1, endDate: null, status: null, devices: [] };

    const [sub, devices] = await Promise.all([
      sql`SELECT plan, "maxDevices", "endDate", status FROM "Subscription" WHERE "userId" = ${account[0].id} LIMIT 1`,
      sql`
        SELECT "phoneNumber", "connectedAt", status
        FROM "WhatsAppSession"
        WHERE "userId" = ${account[0].id} AND status = 'ACTIVE'
        ORDER BY id DESC
      `,
    ]);

    const s = sub[0];
    const live = s && s.status === 'ACTIVE' && (!s.endDate || new Date(s.endDate) > new Date());
    const plan = live ? s.plan : 'FREE';
    return {
      plan,
      planLabel: planLabel(plan),
      maxDevices: live && plan !== 'FREE' ? Number(s.maxDevices) : 1,
      endDate: live ? s.endDate : null,
      status: s?.status || null,
      devices,
    };
  }, { plan: 'FREE', planLabel: 'Free', maxDevices: 1, endDate: null, status: null, devices: [] });
}

export async function getApiKeys(userId) {
  return ok(async () => {
    const rows = await sql`
      SELECT id, name, key_prefix, status, plan, created_at, last_used_at, expires_at
      FROM api_keys
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return rows;
  }, []);
}

export async function getApiUsage(userId) {
  return ok(async () => {
    const [totals, today, recent] = await Promise.all([
      sql`
        SELECT COUNT(*)::int AS total,
               COALESCE(SUM(CASE WHEN status_code < 400 THEN 1 ELSE 0 END), 0)::int AS success
        FROM api_requests WHERE user_id = ${userId}
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM api_requests WHERE user_id = ${userId} AND created_at >= CURRENT_DATE
      `,
      sql`
        SELECT endpoint, method, status_code, response_time_ms, created_at
        FROM api_requests WHERE user_id = ${userId}
        ORDER BY created_at DESC LIMIT 6
      `,
    ]);
    return {
      total: totals[0]?.total || 0,
      success: totals[0]?.success || 0,
      today: today[0]?.total || 0,
      recent,
    };
  }, { total: 0, success: 0, today: 0, recent: [] });
}

export async function getPurchases(userId) {
  const [panels, vps] = await Promise.all([getPanels(userId), getVps(userId)]);
  const rows = [
    ...panels.map((p) => ({
      id: `panel-${p.id}`,
      kind: 'Pterodactyl panel',
      item: p.package_name || 'Panel',
      amount: Number(p.package_price || 0),
      date: p.created_at,
      status: p.status,
      href: '/products',
    })),
    ...vps.map((v) => ({
      id: `vps-${v.id}`,
      kind: 'VPS',
      item: v.hostname || v.host || 'VPS instance',
      amount: null,
      date: v.sold_at || v.created_at,
      status: v.status,
      href: '/vps',
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  return rows;
}

// Notifications are derived, not stored: every row is something that actually
// happened to this account (a settled payment, an expiring service, an order),
// so the list can never invent an event or drift from the ledger.
export async function getNotifications(userId) {
  const [wallet, panels, vps, bot, announcements] = await Promise.all([
    getWallet(userId), getPanels(userId), getVps(userId), getBot(userId),
    ok(async () => sql`
      SELECT id, title, body, level, created_at
      FROM announcements
      WHERE active = true
      ORDER BY created_at DESC
      LIMIT 5
    `, []),
  ]);
  const now = Date.now();
  const items = [];

  for (const a of announcements) {
    items.push({
      id: `ann-${a.id}`,
      tone: a.level === 'warning' ? 'warn' : a.level === 'success' ? 'good' : 'brand',
      title: a.title,
      body: a.body || 'Announcement from MZAZI TECH',
      date: a.created_at,
      href: '/dashboard/notifications',
    });
  }

  for (const t of wallet.transactions.slice(0, 8)) {
    const settled = String(t.status).toLowerCase();
    if (settled === 'success' || settled === 'done') {
      items.push({
        id: `tx-${t.id}`,
        tone: 'good',
        title: t.type === 'deposit' ? 'Payment confirmed' : 'Payment completed',
        body: `${money(t.amount)} — ${t.description || 'wallet transaction'}`,
        date: t.paid_at || t.created_at,
        href: '/dashboard/wallet',
      });
    } else if (settled === 'failed' || settled === 'abandoned') {
      items.push({
        id: `tx-${t.id}`,
        tone: 'bad',
        title: 'Payment did not complete',
        body: `${money(t.amount)} — ${t.failure_reason || 'the charge was not settled'}`,
        date: t.created_at,
        href: '/dashboard/wallet',
      });
    }
  }

  for (const p of panels) {
    if (p.expires_at) {
      const days = Math.ceil((new Date(p.expires_at).getTime() - now) / 86400000);
      if (days <= 14) {
        items.push({
          id: `panel-${p.id}`,
          tone: days < 0 ? 'bad' : 'warn',
          title: days < 0 ? 'Panel expired' : `Panel expires in ${days} day${days === 1 ? '' : 's'}`,
          body: `${p.package_name || 'Panel'} · ${shortDate(p.expires_at)}`,
          date: p.expires_at,
          href: '/dashboard/services',
        });
      }
    }
  }

  if (bot.endDate) {
    const days = Math.ceil((new Date(bot.endDate).getTime() - now) / 86400000);
    if (days <= 14) {
      items.push({
        id: 'bot-plan',
        tone: days < 0 ? 'bad' : 'warn',
        title: days < 0 ? 'WhatsApp plan expired' : `WhatsApp plan renews in ${days} day${days === 1 ? '' : 's'}`,
        body: `${bot.plan} · ${bot.devices.length} device${bot.devices.length === 1 ? '' : 's'} · ${shortDate(bot.endDate)}`,
        date: bot.endDate,
        href: '/dashboard/services',
      });
    }
  }

  for (const v of vps.slice(0, 3)) {
    items.push({
      id: `vps-${v.id}`,
      tone: 'brand',
      title: 'VPS provisioned',
      body: `${v.hostname || v.host} · ${v.region || 'region pending'}`,
      date: v.sold_at || v.created_at,
      href: '/dashboard/services',
    });
  }

  return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
}

export async function getLogins(userId, limit = 8) {
  return ok(async () => {
    const rows = await sql`
      SELECT id, ip, user_agent, status, created_at
      FROM login_events
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows;
  }, []);
}

export async function getOverview(userId) {
  const [wallet, panels, vps, bot, keys, usage] = await Promise.all([
    getWallet(userId), getPanels(userId), getVps(userId), getBot(userId), getApiKeys(userId), getApiUsage(userId),
  ]);

  const activePanels = panels.filter((p) => String(p.status).toLowerCase() === 'active').length;
  const activeVps = vps.filter((v) => String(v.status || '').toLowerCase() !== 'terminated').length;
  const liveDevices = bot.devices.length;
  const activeKeys = keys.filter((k) => String(k.status).toLowerCase() === 'active').length;

  return {
    wallet, panels, vps, bot, keys, usage,
    services: {
      total: activePanels + activeVps + liveDevices + activeKeys,
      panels: activePanels,
      vps: activeVps,
      devices: liveDevices,
      keys: activeKeys,
    },
  };
}

export async function getPackages() {
  return ok(async () => {
    const [panels, vps] = await Promise.all([
      sql`
        SELECT id, name, price, cpu, ram, disk, description, popular
        FROM packages
        WHERE active IS NOT FALSE
        ORDER BY sort_order NULLS LAST, price ASC
      `,
      sql`
        SELECT id, name, price, ram, cpu, disk, bandwidth, location
        FROM vps_packages
        WHERE active IS NOT FALSE
        ORDER BY price ASC
      `,
    ]);
    return { panels, vps };
  }, { panels: [], vps: [] });
}
