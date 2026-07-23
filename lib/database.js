import { neon } from '@neondatabase/serverless';

// Create SQL connection
const sql = neon(process.env.DATABASE_URL);

export async function initializeDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        duration VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id),
        package_name VARCHAR(255),
        amount DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'pending',
        reference VARCHAR(255) UNIQUE,
        pterodactyl_credentials TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create payments table
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        reference VARCHAR(255) UNIQUE,
        amount DECIMAL(10, 2),
        status VARCHAR(50),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Check if products exist
    const rows = await sql`SELECT COUNT(*) as count FROM products`;
    
    if (parseInt(rows[0].count) === 0) {
      await insertSampleProducts();
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
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

  console.log('Sample products inserted successfully');
}

export { sql };
export default sql;
