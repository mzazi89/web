// lib/database.js
import { sql } from '@vercel/postgres';

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
    const { rows } = await sql`SELECT COUNT(*) as count FROM products`;
    
    if (rows[0].count === '0') {
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
    {
      name: 'WhatsApp Bot Basic',
      description: 'WhatsApp automation bot with basic features',
      type: 'whatsapp_bot',
      price: 15.00,
      duration: 'monthly'
    },
    {
      name: 'WhatsApp Bot Premium',
      description: 'Advanced WhatsApp bot with AI features',
      type: 'whatsapp_bot',
      price: 30.00,
      duration: 'monthly'
    },
    {
      name: 'Pterodactyl Panel - Starter',
      description: '1GB RAM, 1 CPU, 20GB Storage',
      type: 'pterodactyl',
      price: 5.00,
      duration: 'monthly'
    },
    {
      name: 'Pterodactyl Panel - Standard',
      description: '4GB RAM, 2 CPU, 50GB Storage',
      type: 'pterodactyl',
      price: 15.00,
      duration: 'monthly'
    },
    {
      name: 'Pterodactyl Panel - Premium',
      description: '8GB RAM, 4 CPU, 100GB Storage',
      type: 'pterodactyl',
      price: 30.00,
      duration: 'monthly'
    },
    {
      name: 'Automation Suite',
      description: 'Complete automation toolkit',
      type: 'automation',
      price: 45.00,
      duration: 'monthly'
    }
  ];

  for (const product of products) {
    await sql`
      INSERT INTO products (name, description, type, price, duration)
      VALUES (${product.name}, ${product.description}, ${product.type}, ${product.price}, ${product.duration})
    `;
  }

  console.log('Sample products inserted successfully');
}

// Helper functions that match the SQLite API
export const db = {
  prepare: (query) => {
    return {
      get: async (...params) => {
        try {
          // Convert SQLite-style ? placeholders to $1, $2, etc.
          let paramIndex = 0;
          const pgQuery = query.replace(/\?/g, () => `$${++paramIndex}`);
          const result = await sql.query(pgQuery, params);
          return result.rows[0] || null;
        } catch (error) {
          console.error('DB get error:', error);
          throw error;
        }
      },
      all: async (...params) => {
        try {
          let paramIndex = 0;
          const pgQuery = query.replace(/\?/g, () => `$${++paramIndex}`);
          const result = await sql.query(pgQuery, params);
          return result.rows || [];
        } catch (error) {
          console.error('DB all error:', error);
          throw error;
        }
      },
      run: async (...params) => {
        try {
          let paramIndex = 0;
          const pgQuery = query.replace(/\?/g, () => `$${++paramIndex}`);
          
          // Add RETURNING clause for INSERT to get lastInsertRowid
          const finalQuery = query.trim().toUpperCase().startsWith('INSERT') 
            ? pgQuery + ' RETURNING id'
            : pgQuery;
            
          const result = await sql.query(finalQuery, params);
          return {
            lastInsertRowid: result.rows[0]?.id,
            changes: result.rowCount
          };
        } catch (error) {
          console.error('DB run error:', error);
          throw error;
        }
      }
    };
  },
  exec: async (query) => {
    try {
      await sql.query(query);
    } catch (error) {
      console.error('DB exec error:', error);
      throw error;
    }
  },
  transaction: (fn) => {
    return async (...args) => {
      // Simple transaction simulation
      try {
        await sql.query('BEGIN');
        const result = await fn(args);
        await sql.query('COMMIT');
        return result;
      } catch (error) {
        await sql.query('ROLLBACK');
        throw error;
      }
    };
  }
};

export default sql;
