import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/database';

export async function POST(request) {
  try {
    const { fullname, email, password } = await request.json();

    // Validate input
    if (!fullname || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const stmt = db.prepare(
      'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)'
    );
    const result = stmt.run(fullname, email, hashedPassword);

    return NextResponse.json(
      { message: 'User created successfully', userId: result.lastInsertRowid },
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
