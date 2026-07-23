import { sql } from '@vercel/postgres';

// Create tables
export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        fullname TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        price DECIMAL NOT NULL,
        duration TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id),
        package_name TEXT,
        amount DECIMAL,
        status TEXT DEFAULT 'pending',
        reference TEXT UNIQUE,
        pterodactyl_credentials TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        reference TEXT UNIQUE,
        amount DECIMAL,
        status TEXT,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Insert sample products if not exist
    const { rowCount } = await sql`SELECT COUNT(*) as count FROM products`;
    
    if (rowCount === 0) {
      await insertSampleProducts();
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

async function insertSampleProducts() {
  const products = [
    ['WhatsApp Bot Basic', 'WhatsApp automation bot with basic features', 'whatsapp_bot', 15.00, 'monthly'],
    ['WhatsApp Bot Premium', 'Advanced WhatsApp bot with AI features', 'whatsapp_bot', 30.00, 'monthly'],
    ['Pterodactyl Panel - Starter', '1GB RAM, 1 CPU, 20GB Storage', 'pterodactyl', 5.00, 'monthly'],
    ['Pterodactyl Panel - Standard', '4GB RAM, 2 CPU, 50GB Storage', 'pterodactyl', 15.00, 'monthly'],
    ['Pterodactyl Panel - Premium', '8GB RAM, 4 CPU, 100GB Storage', 'pterodactyl', 30.00, 'monthly'],
    ['Automation Suite', 'Complete automation toolkit', 'automation', 45.00, 'monthly']
  ];

  for (const product of products) {
    await sql`
      INSERT INTO products (name, description, type, price, duration) 
      VALUES (${product[0]}, ${product[1]}, ${product[2]}, ${product[3]}, ${product[4]})
    `;
  }
}

export default sql;
