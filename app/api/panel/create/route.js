import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';
const PTERO_URL = process.env.PTERODACTYL_URL || 'https://public.mzazi.shop';
const PTERO_KEY = process.env.PTERODACTYL_API_KEY;

const pteroHeaders = {
  Authorization: `Bearer ${PTERO_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

async function pteroGet(path) {
  const res = await fetch(`${PTERO_URL}/api/application${path}`, { headers: pteroHeaders });
  return res.json();
}

async function pteroPost(path, body) {
  const res = await fetch(`${PTERO_URL}/api/application${path}`, {
    method: 'POST',
    headers: pteroHeaders,
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const userId = decoded.userId;

    const { package_id, ptero_username, ptero_password, firstname, lastname, nest_id, egg_id } = await request.json();

    if (!package_id || !ptero_username || !ptero_password || !firstname || !lastname || !nest_id || !egg_id) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Load package from DB (supports admin-created packages)
    const pkgRows = await sql`SELECT * FROM packages WHERE id = ${parseInt(package_id)} AND active = true LIMIT 1`;
    if (pkgRows.length === 0) return NextResponse.json({ error: 'Invalid or unavailable package' }, { status: 400 });
    const pkg = pkgRows[0];

    // Check wallet balance
    const walletRows = await sql`SELECT balance FROM wallet WHERE user_id = ${userId}`;
    const balance = walletRows.length > 0 ? parseFloat(walletRows[0].balance) : 0;

    if (balance < parseFloat(pkg.price)) {
      return NextResponse.json({
        error: `Insufficient wallet balance. You need KSH ${pkg.price} but have KSH ${balance.toFixed(2)}. Please top up your wallet.`,
        need_topup: true,
      }, { status: 402 });
    }

    // Get user info
    const userRows = await sql`SELECT email, firstname, lastname FROM users WHERE id = ${userId}`;
    if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Fetch egg details to get the correct docker image, startup, and environment
    const eggData = await pteroGet(`/nests/${nest_id}/eggs/${egg_id}?include=variables`);
    if (!eggData?.attributes) {
      return NextResponse.json({ error: 'Could not fetch egg details from panel' }, { status: 400 });
    }

    const eggAttrs = eggData.attributes;
    const dockerImage = eggAttrs.docker_image || eggAttrs.docker_images?.[0] || 'ghcr.io/pterodactyl/yolks:java_17';
    const startupCmd  = eggAttrs.startup || '{{SERVER_JARFILE}}';

    // Build environment from egg variables — use defaults where available
    const eggVariables = eggAttrs.relationships?.variables?.data || [];
    const environment  = {};
    for (const v of eggVariables) {
      const attr = v.attributes;
      environment[attr.env_variable] = attr.default_value ?? '';
    }

    // Create Pterodactyl user
    const pteroEmail = `${ptero_username.toLowerCase()}_${userId}@panel.mzazitech.local`;
    const userRes = await pteroPost('/users', {
      email: pteroEmail,
      username: ptero_username,
      first_name: firstname,
      last_name: lastname,
      password: ptero_password,
    });

    if (userRes.status !== 201) {
      const errMsg = userRes.data?.errors?.[0]?.detail || 'Failed to create panel user';
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const pteroUserId = userRes.data.attributes.id;

    // Create Pterodactyl server using the egg's own docker image and startup
    const serverName = `${ptero_username}-${pkg.name.toLowerCase()}`;
    const serverRes = await pteroPost('/servers', {
      name: serverName,
      user: pteroUserId,
      egg: parseInt(egg_id),
      docker_image: dockerImage,
      startup: startupCmd,
      environment,
      limits: {
        memory: parseInt(pkg.ram),
        swap: 0,
        disk: parseInt(pkg.disk),
        io: 500,
        cpu: parseInt(pkg.cpu),
      },
      feature_limits: {
        databases: 1,
        backups: 1,
        allocations: 1,
      },
      deploy: {
        locations: [1],
        dedicated_ip: false,
        port_range: [],
      },
      start_on_completion: true,
      skip_scripts: false,
      oom_disabled: false,
    });

    if (serverRes.status !== 201) {
      // Cleanup: delete ptero user we just created
      try {
        await fetch(`${PTERO_URL}/api/application/users/${pteroUserId}`, {
          method: 'DELETE',
          headers: pteroHeaders,
        });
      } catch {}
      const errMsg = serverRes.data?.errors?.[0]?.detail || 'Failed to create server';
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const pteroServerId = serverRes.data.attributes.id;

    // Deduct from wallet
    await sql`
      UPDATE wallet SET balance = balance - ${parseFloat(pkg.price)}, updated_at = NOW()
      WHERE user_id = ${userId}
    `;
    await sql`
      INSERT INTO wallet_transactions (user_id, type, amount, description, status)
      VALUES (${userId}, 'deduction', ${parseFloat(pkg.price)}, ${`Panel created: ${pkg.name}`}, 'success')
    `;

    // Save panel record
    const expiresAt = pkg.expires_after_hours
      ? new Date(Date.now() + parseInt(pkg.expires_after_hours) * 60 * 60 * 1000)
      : null;
    await sql`
      INSERT INTO panels (user_id, ptero_server_id, ptero_user_id, ptero_username, package_name, package_price, nest_id, egg_id, expires_at)
      VALUES (
        ${userId}, ${pteroServerId}, ${pteroUserId}, ${ptero_username},
        ${pkg.name}, ${parseFloat(pkg.price)}, ${nest_id}, ${egg_id},
        ${expiresAt}
      )
    `;

    return NextResponse.json({
      message: 'Panel created successfully!',
      panel: {
        ptero_server_id: pteroServerId,
        username: ptero_username,
        panel_url: PTERO_URL,
        package: pkg.name,
        price: pkg.price,
      },
    });
  } catch (error) {
    console.error('Panel create error:', error);
    return NextResponse.json({ error: 'Failed to create panel. Please try again.' }, { status: 500 });
  }
}
