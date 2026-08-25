// MZAZI API — /api/panel/add
// Add a server for an existing panel owner (wallet-based).
//   POST { username, mode: 'similar' | 'different', package_id? }
//
//   similar   → 30% of the first panel's package price (ceil), same package
//               specs, created on the SAME Pterodactyl account (username)
//   different → full price of the chosen package
//
// Mirrors the Telegram "Add Server" flow. Wallet is deducted on success.
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import { ensureDatabase } from '@/lib/database';
import { pteroConfig, pteroGet, pteroPost, pickFreeAllocation, pteroErr, fetchEgg } from '@/lib/ptero';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';

export async function POST(request) {
  await ensureDatabase();
  let userId = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) throw new Error('Not logged in');
    const decoded = jwt.verify(token.value, JWT_SECRET);
    userId = decoded.userId;
  } catch {
    return NextResponse.json({ error: 'Please log in first' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const mode = body.mode === 'different' ? 'different' : 'similar';
    if (!username) {
      return NextResponse.json({ error: 'username required' }, { status: 400 });
    }

    // The user must already own a panel with this exact username.
    const panels = await sql`SELECT * FROM panels WHERE user_id = ${userId} ORDER BY id ASC`;
    if (!panels.length) {
      return NextResponse.json({ error: 'You need at least one panel before adding a server' }, { status: 400 });
    }
    const match = panels.find((p) => String(p.ptero_username || '').toLowerCase() === username.toLowerCase());
    if (!match) {
      return NextResponse.json({ error: `No panel found with username "${username}" on your account` }, { status: 400 });
    }

    // Resolve package + amount.
    let pkg;
    let amount;
    if (mode === 'similar') {
      const pkgRows = await sql`SELECT * FROM packages WHERE name = ${match.package_name} AND active = true LIMIT 1`;
      pkg = pkgRows[0] || { name: match.package_name, price: Number(match.package_price) || 0, cpu: 0, ram: 0, disk: 0 };
      amount = Math.ceil(Number(pkg.price || match.package_price || 0) * 0.3);
    } else {
      const packageId = parseInt(body.package_id, 10);
      if (!packageId) {
        return NextResponse.json({ error: 'package_id required for a different server' }, { status: 400 });
      }
      const pkgRows = await sql`SELECT * FROM packages WHERE id = ${packageId} AND active = true LIMIT 1`;
      if (!pkgRows.length) {
        return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
      }
      pkg = pkgRows[0];
      amount = Math.ceil(Number(pkg.price));
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Wallet check.
    const w = await sql`SELECT balance FROM wallet WHERE user_id = ${userId}`;
    const balance = Number(w[0]?.balance || 0);
    if (balance < amount) {
      return NextResponse.json(
        { error: `Insufficient wallet balance — need KES ${amount}, you have KES ${balance}. Top up in the Wallet page.` },
        { status: 402 }
      );
    }

    // Create the server on the existing Pterodactyl account.
    const egg = await fetchEgg(match.nest_id, match.egg_id);
    const serverName = `${match.ptero_username}-${String(pkg.name).toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const alloc = await pickFreeAllocation();
    const serverRes = await pteroPost('/servers', {
      name: serverName,
      user: match.ptero_user_id,
      egg: parseInt(match.egg_id),
      docker_image: egg.dockerImage,
      startup: egg.startup,
      environment: egg.environment,
      limits: {
        memory: parseInt(pkg.ram) || 0,
        swap: 0,
        disk: parseInt(pkg.disk) || 0,
        io: 500,
        cpu: parseInt(pkg.cpu) || 0,
      },
      feature_limits: { databases: 1, backups: 1, allocations: 1 },
      ...alloc,
      start_on_completion: true,
      skip_scripts: false,
      oom_disabled: false,
    });
    if (serverRes.status !== 201) {
      return NextResponse.json({ error: pteroErr(serverRes.data) }, { status: 502 });
    }
    const serverId = serverRes.data.attributes.id;

    // Deduct wallet + record the panel.
    await sql`UPDATE wallet SET balance = balance - ${amount}, updated_at = NOW() WHERE user_id = ${userId}`;
    await sql`INSERT INTO wallet_transactions (user_id, type, amount, description, status) VALUES (${userId}, 'deduction', ${amount}, ${`Added server: ${pkg.name} (${mode})`}, 'success')`;
    await sql`
      INSERT INTO panels (user_id, ptero_server_id, ptero_user_id, ptero_username, package_name, package_price, nest_id, egg_id, status)
      VALUES (${userId}, ${serverId}, ${match.ptero_user_id}, ${match.ptero_username}, ${pkg.name}, ${Number(pkg.price)}, ${match.nest_id}, ${match.egg_id}, 'active')
    `;

    const { url } = await pteroConfig();
    return NextResponse.json({
      ok: true,
      server_id: serverId,
      panel_url: url,
      username: match.ptero_username,
      package: pkg.name,
      amount,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to add server' }, { status: 500 });
  }
}
