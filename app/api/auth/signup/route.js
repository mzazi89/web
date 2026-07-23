import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { fullname, email, password } = await request.json();

    if (!fullname || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (rows.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await sql`
      INSERT INTO users (fullname, email, password) 
      VALUES (${fullname}, ${email}, ${hashedPassword}) 
      RETURNING id
    `;

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        userId: result[0].id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
