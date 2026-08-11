import { NextResponse } from 'next/server';
import sql from '../../../lib/database';

export const dynamic = 'force-dynamic';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      message TEXT NOT NULL,
      approved BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// GET testimonials with pagination — ?offset=0&limit=6
export async function GET(request) {
  try {
    await ensureTable();

    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '6', 10)));

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM testimonials WHERE approved = true
    `;

    const testimonials = await sql`
      SELECT id, name, rating, message, created_at
      FROM testimonials
      WHERE approved = true
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [avg] = await sql`
      SELECT ROUND(AVG(rating)::numeric, 2) AS avg, COUNT(*)::int AS total FROM testimonials WHERE approved = true
    `;

    return NextResponse.json({
      testimonials,
      total: count,
      avg_rating: avg.avg !== null ? Number(avg.avg) : null,
      rating_count: avg.total || 0,
    });
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

// POST a new testimonial
export async function POST(request) {
  try {
    await ensureTable();

    const body = await request.json();
    const { name, rating, message } = body;

    if (!name || !rating || !message) {
      return NextResponse.json({ error: 'Name, rating, and message are required.' }, { status: 400 });
    }

    const ratingNum = parseInt(rating, 10);
    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
    }
    if (name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be between 2 and 100 characters.' }, { status: 400 });
    }
    if (message.trim().length < 10 || message.trim().length > 1000) {
      return NextResponse.json({ error: 'Message must be between 10 and 1000 characters.' }, { status: 400 });
    }

    // New reviews start as pending — an admin approves them before they go live.
    const [testimonial] = await sql`
      INSERT INTO testimonials (name, rating, message, approved)
      VALUES (${name.trim()}, ${ratingNum}, ${message.trim()}, false)
      RETURNING id, name, rating, message, created_at
    `;

    return NextResponse.json({ testimonial, message: 'Thank you! Your review has been submitted and will appear after approval.' }, { status: 201 });
  } catch (error) {
    console.error('Failed to save testimonial:', error);
    return NextResponse.json({ error: 'Failed to save testimonial.' }, { status: 500 });
  }
}
