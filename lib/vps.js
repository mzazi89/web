// ─────────────────────────────────────────────────────────────────────────────
// Shared server-side VPS store logic — packages, instance credential pool and
// orders. SERVER ONLY.
//
// How selling works:
//   1. Admin creates a VPS package + uploads a pool of REAL instances
//      (host / username / password / port) into vps_instances.
//   2. A buyer orders a package (Paystack, mirroring wallet deposits) — the
//      order row is created first with a VPS- reference.
//   3. On confirmed payment (webhook or status poll) fulfillVpsOrderIfPaid()
//      ATOMICALLY claims the next available instance of that package and
//      marks the order success in ONE statement — two webhooks can never
//      sell the same instance twice, and no paid order is ever lost.
//   4. Credentials are returned to the buyer and stay saved under their user.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto';
import { sql } from '@/lib/wallet';
import { verifyTransaction } from '@/lib/paystack';

let _schemaPromise = null;
export async function ensureVpsSchema() {
  if (!_schemaPromise) {
    _schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS vps_packages (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          price NUMERIC(10, 2) NOT NULL,
          ram TEXT DEFAULT '',
          cpu TEXT DEFAULT '',
          disk TEXT DEFAULT '',
          bandwidth TEXT DEFAULT '',
          location TEXT DEFAULT '',
          os TEXT DEFAULT '',
          description TEXT DEFAULT '',
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS vps_instances (
          id SERIAL PRIMARY KEY,
          package_id INTEGER NOT NULL REFERENCES vps_packages(id) ON DELETE CASCADE,
          host TEXT NOT NULL,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          port TEXT DEFAULT '22',
          droplet_id TEXT DEFAULT '',
          hostname TEXT DEFAULT '',
          region TEXT DEFAULT '',
          os TEXT DEFAULT '',
          cpu TEXT DEFAULT '',
          status TEXT DEFAULT 'available',
          sold_to INTEGER,
          order_ref TEXT,
          sold_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      // Upgrade any pre-existing table (idempotent)
      await sql`ALTER TABLE vps_instances ADD COLUMN IF NOT EXISTS droplet_id TEXT DEFAULT ''`;
      await sql`ALTER TABLE vps_instances ADD COLUMN IF NOT EXISTS hostname TEXT DEFAULT ''`;
      await sql`ALTER TABLE vps_instances ADD COLUMN IF NOT EXISTS region TEXT DEFAULT ''`;
      await sql`ALTER TABLE vps_instances ADD COLUMN IF NOT EXISTS os TEXT DEFAULT ''`;
      await sql`ALTER TABLE vps_instances ADD COLUMN IF NOT EXISTS cpu TEXT DEFAULT ''`;
      await sql`
        CREATE TABLE IF NOT EXISTS vps_orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          package_id INTEGER NOT NULL,
          instance_id INTEGER,
          amount NUMERIC(10, 2) NOT NULL,
          phone TEXT,
          payment_method TEXT DEFAULT 'card',
          reference TEXT NOT NULL UNIQUE,
          status TEXT DEFAULT 'pending',
          paid_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_vps_instances_pool ON vps_instances(package_id, status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_vps_orders_ref ON vps_orders(reference)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_vps_orders_user ON vps_orders(user_id, created_at DESC)`;
    })().catch((e) => {
      _schemaPromise = null;
      throw e;
    });
  }
  return _schemaPromise;
}

export function generateVpsReference(userId) {
  const rand = crypto.randomBytes(5).toString('hex');
  return `VPS-${userId}-${Date.now()}-${rand}`;
}

export async function getVpsOrderByReference(reference) {
  const rows = await sql`SELECT * FROM vps_orders WHERE reference = ${reference}`;
  return rows[0] || null;
}

export async function getVpsPackageById(id) {
  const rows = await sql`SELECT * FROM vps_packages WHERE id = ${id}`;
  return rows[0] || null;
}

export async function getVpsAvailableStock(packageId) {
  const rows = await sql`
    SELECT COUNT(*)::int AS stock
    FROM vps_instances
    WHERE package_id = ${packageId} AND status = 'available'
  `;
  return rows[0]?.stock || 0;
}

// Public listing: active packages + how many instances are still available.
export async function listPublicVpsPackages() {
  const rows = await sql`
    SELECT p.*,
           (SELECT COUNT(*) FROM vps_instances i
             WHERE i.package_id = p.id AND i.status = 'available')::int AS stock
    FROM vps_packages p
    WHERE p.active = TRUE
    ORDER BY p.price ASC
  `;
  return rows;
}

export async function markVpsOrderFailed(reference, reason) {
  await sql`
    UPDATE vps_orders
    SET status = 'failed', updated_at = NOW()
    WHERE reference = ${reference} AND status IN ('pending', 'processing')
  `;
}

// Load a fulfilled order joined with its assigned instance + package.
export async function getFulfilledVps(reference) {
  const rows = await sql`
    SELECT o.id AS order_id, o.user_id, o.amount, o.payment_method, o.reference, o.status,
           o.created_at AS ordered_at, o.paid_at,
           i.id AS instance_id, i.host, i.username, i.password, i.port, i.sold_at,
           i.droplet_id, i.hostname, i.region, i.os AS instance_os, i.cpu,
           p.id AS package_id, p.name AS package_name, p.ram, p.cpu AS pkg_cpu, p.disk, p.bandwidth,
           p.location, p.os AS pkg_os, p.description, p.price
    FROM vps_orders o
    JOIN vps_instances i ON i.id = o.instance_id
    JOIN vps_packages p ON p.id = o.package_id
    WHERE o.reference = ${reference}
  `;
  return rows[0] || null;
}

// ─── ATOMIC fulfillment ───────────────────────────────────────────────────────
// Verifies with Paystack that the payment really succeeded, then in ONE SQL
// statement claims the next available instance and marks the order success.
// Returns:
//   { success: true, already: false, vps }            — fresh fulfillment
//   { success: true, already: true,  vps }            — duplicate (already done)
//   { success: false, reason: 'unpaid' }              — payment not confirmed
//   { success: false, reason: 'out_of_stock' }        — no instance left
//   { success: false, reason: 'not_found' }           — no such order
export async function fulfillVpsOrderIfPaid(reference) {
  const order = await getVpsOrderByReference(reference);
  if (!order) return { success: false, reason: 'not_found' };

  // Duplicate delivery — the instance was already assigned; just re-read it.
  if (order.status === 'success') {
    const vps = await getFulfilledVps(reference);
    return { success: true, already: true, vps };
  }
  if (order.status === 'failed') {
    return { success: false, reason: 'failed' };
  }

  // Confirm with Paystack that money actually landed (idempotent read).
  const { json } = await verifyTransaction(reference);
  const txStatus = json?.data?.status;
  const paidKsh = json?.data?.amount ? json.data.amount / 100 : null;
  if (txStatus !== 'success' || paidKsh === null) {
    return { success: false, reason: 'unpaid' };
  }
  if (Math.round(Number(order.amount) * 100) !== Math.round(paidKsh * 100)) {
    return { success: false, reason: 'amount_mismatch' };
  }

  // Atomic claim + success mark (guarded so a racing duplicate can't re-claim).
  const rows = await sql`
    WITH claim AS (
      UPDATE vps_instances i
      SET status = 'sold', sold_to = ${order.user_id}, order_ref = ${reference}, sold_at = NOW()
      WHERE i.id = (
        SELECT id FROM vps_instances
        WHERE package_id = ${order.package_id} AND status = 'available'
        ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED
      )
      RETURNING i.id, i.host, i.username, i.password, i.port, i.droplet_id, i.hostname, i.region, i.os, i.cpu
    ),
    ord AS (
      UPDATE vps_orders
      SET status = 'success',
          instance_id = claim.id,
          paid_at = COALESCE(paid_at, NOW())
      FROM claim
      WHERE vps_orders.reference = ${reference}
        AND vps_orders.status IN ('pending', 'processing')
      RETURNING vps_orders.user_id, vps_orders.package_id, vps_orders.amount
    )
    SELECT o.user_id, o.package_id, o.amount,
           c.id AS instance_id, c.host, c.username, c.password, c.port,
           c.droplet_id, c.hostname, c.region, c.os AS instance_os, c.cpu,
           p.name AS package_name, p.ram, p.cpu AS pkg_cpu, p.disk, p.bandwidth,
           p.location, p.os AS pkg_os, p.description, p.price
    FROM ord o
    JOIN claim c ON TRUE
    JOIN vps_packages p ON p.id = o.package_id
  `;

  if (rows.length === 0) {
    // Either no instance was available or a racing webhook already fulfilled it.
    const again = await getVpsOrderByReference(reference);
    if (again?.status === 'success') {
      const vps = await getFulfilledVps(reference);
      return { success: true, already: true, vps };
    }
    await markVpsOrderFailed(reference, 'No instance available at fulfillment');
    return { success: false, reason: 'out_of_stock' };
  }

  const r = rows[0];
  const vps = {
    order_id: order.id,
    reference,
    amount: Number(r.amount),
    instance_id: r.instance_id,
    host: r.host,
    username: r.username,
    password: r.password,
    port: r.port,
    droplet_id: r.droplet_id,
    hostname: r.hostname,
    region: r.region,
    instance_os: r.instance_os,
    cpu: r.cpu,
    package_id: r.package_id,
    package_name: r.package_name,
    ram: r.ram, pkg_cpu: r.pkg_cpu, disk: r.disk, bandwidth: r.bandwidth,
    location: r.location, pkg_os: r.pkg_os, description: r.description,
    price: Number(r.price),
  };
  return { success: true, already: false, vps };
}

// Buyer's dashboard: every fulfilled VPS with credentials.
export async function listMyVps(userId) {
  const rows = await sql`
    SELECT o.id AS order_id, o.amount, o.payment_method, o.reference, o.paid_at, o.created_at,
           i.id AS instance_id, i.host, i.username, i.password, i.port, i.sold_at,
           i.droplet_id, i.hostname, i.region, i.os AS instance_os, i.cpu,
           p.id AS package_id, p.name AS package_name, p.ram, p.cpu AS pkg_cpu, p.disk, p.bandwidth,
           p.location, p.os AS pkg_os, p.description, p.price
    FROM vps_orders o
    JOIN vps_instances i ON i.id = o.instance_id
    JOIN vps_packages p ON p.id = o.package_id
    WHERE o.user_id = ${userId} AND o.status = 'success'
    ORDER BY o.created_at DESC
  `;
  return rows;
}
