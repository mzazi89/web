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

    await sql`
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        user_email VARCHAR(255),
        user_name VARCHAR(255),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        admin_reply TEXT,
        replied_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Packages table — replaces the hardcoded PACKAGES array
    await sql`
      CREATE TABLE IF NOT EXISTS packages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        cpu INTEGER NOT NULL DEFAULT 0,
        ram INTEGER NOT NULL DEFAULT 0,
        disk INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        popular BOOLEAN DEFAULT false,
        accent VARCHAR(20) DEFAULT '#2563eb',
        active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Seed default packages if the table is empty
    const existing = await sql`SELECT COUNT(*) AS cnt FROM packages`;
    if (parseInt(existing[0].cnt) === 0) {
      await sql`
        INSERT INTO packages (name, price, cpu, ram, disk, description, popular, accent, sort_order)
        VALUES
          ('Starter',  50,  20,  512,   2048,  'Perfect for small bots and lightweight servers',           false, '#1e3a8a', 1),
          ('Standard', 75,  50,  1024,  5120,  'Great for Minecraft, Discord bots & medium workloads',    true,  '#2563eb', 2),
          ('Premium',  100, 100, 5120,  10240, 'Full power for high-performance game servers',             false, '#1d4ed8', 3),
          ('Ultimate', 120, 0,   0,     0,     'No limits. Maximum performance for any workload.',         false, '#4f46e5', 4)
      `;
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export { sql };
export default sql;
