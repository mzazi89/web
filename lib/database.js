import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firstname VARCHAR(255) NOT NULL,
        lastname VARCHAR(255) NOT NULL,
        fullname VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        google_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Add columns if upgrading from old schema
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname VARCHAR(255) DEFAULT ''`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname VARCHAR(255) DEFAULT ''`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255)`;

    await sql`
      CREATE TABLE IF NOT EXISTS wallet (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE NOT NULL,
        balance DECIMAL(10, 2) DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        reference VARCHAR(255),
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS panels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        ptero_server_id INTEGER,
        ptero_user_id INTEGER,
        ptero_username VARCHAR(255),
        package_name VARCHAR(255),
        package_price DECIMAL(10, 2),
        nest_id INTEGER,
        egg_id INTEGER,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER,
        package_name VARCHAR(255),
        amount DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'pending',
        reference VARCHAR(255) UNIQUE,
        pterodactyl_credentials TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Testimonials table
    await sql`
      CREATE TABLE IF NOT EXISTS testimonials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        message TEXT NOT NULL,
        approved BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export { sql };
export default sql;
