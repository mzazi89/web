import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mzazi-tech-secret-2024';
const PTERO_URL = process.env.PTERODACTYL_URL || 'https://public.mzazi.shop';

// POST /api/panel/credentials
// Body: { panel_id, password }
// Returns panel credentials after verifying the user's account password
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const decoded = jwt.verify(token.value, JWT_SECRET);
    const userId = decoded.userId;

    const { panel_id, password } = await request.json();
    if (!panel_id || !password) {
      return NextResponse.json({ error: 'panel_id and password are required' }, { status: 400 });
    }

    // Verify the user's account password
    const userRows = await sql`SELECT id, password, email, google_id FROM users WHERE id = ${userId}`;
    if (userRows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const user = userRows[0];

    if (!user.password) {
      // Google-only account — no password set, allow with a special note
      // We still return credentials but note it's a Google account
    } else {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    // Fetch the panel — must belong to this user
    await sql`ALTER TABLE panels ADD COLUMN IF NOT EXISTS ptero_password VARCHAR(255) DEFAULT NULL`;
    await sql`ALTER TABLE panels ADD COLUMN IF NOT EXISTS ptero_email VARCHAR(255) DEFAULT NULL`;

    const panelRows = await sql`
      SELECT id, ptero_server_id, ptero_user_id, ptero_username, ptero_password, ptero_email,
             package_name, package_price, status, created_at, expires_at
      FROM panels
      WHERE id = ${parseInt(panel_id)} AND user_id = ${userId}
      LIMIT 1
    `;
    if (panelRows.length === 0) return NextResponse.json({ error: 'Panel not found' }, { status: 404 });
    const panel = panelRows[0];

    return NextResponse.json({
      credentials: {
        panel_url:      PTERO_URL,
        username:       panel.ptero_username,
        password:       panel.ptero_password || '(saved before this feature — reset via admin)',
        email:          panel.ptero_email    || `${panel.ptero_username?.toLowerCase()}_${userId}@panel.mzazitech.local`,
        server_id:      panel.ptero_server_id,
        package:        panel.package_name,
        status:         panel.status,
        created_at:     panel.created_at,
        expires_at:     panel.expires_at,
      },
    });
  } catch (error) {
    console.error('Credentials error:', error);
    return NextResponse.json({ error: 'Failed to retrieve credentials' }, { status: 500 });
  }
}
