import { NextResponse } from 'next/server';
import sql from '../../../lib/database';

export const dynamic = 'force-dynamic';

// GET all approved testimonials
export async function GET() {
  try {
    const testimonials = await sql`
      SELECT id, name, rating, message, created_at
      FROM testimonials
      WHERE approved = true
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

// POST a new testimonial
export async function POST(request) {
  try {
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

    const [testimonial] = await sql`
      INSERT INTO testimonials (name, rating, message, approved)
      VALUES (${name.trim()}, ${ratingNum}, ${message.trim()}, true)
      RETURNING id, name, rating, message, created_at
    `;

    return NextResponse.json({ testimonial, message: 'Thank you for your testimonial!' }, { status: 201 });
  } catch (error) {
    console.error('Failed to save testimonial:', error);
    return NextResponse.json({ error: 'Failed to save testimonial.' }, { status: 500 });
  }
}
