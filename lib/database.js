import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'mzazi_tech.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullname TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      price REAL NOT NULL,
      duration TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      package_name TEXT,
      amount REAL,
      status TEXT DEFAULT 'pending',
      reference TEXT UNIQUE,
      pterodactyl_credentials TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      reference TEXT UNIQUE,
      amount REAL,
      status TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  // Insert sample products if not exist
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  
  if (productCount.count === 0) {
    insertSampleProducts();
  }
}

function insertSampleProducts() {
  const insert = db.prepare(`
    INSERT INTO products (name, description, type, price, duration) 
    VALUES (?, ?, ?, ?, ?)
  `);

  const products = [
    ['WhatsApp Bot Basic', 'WhatsApp automation bot with basic features', 'whatsapp_bot', 15.00, 'monthly'],
    ['WhatsApp Bot Premium', 'Advanced WhatsApp bot with AI features', 'whatsapp_bot', 30.00, 'monthly'],
    ['Pterodactyl Panel - Starter', '1GB RAM, 1 CPU, 20GB Storage', 'pterodactyl', 5.00, 'monthly'],
    ['Pterodactyl Panel - Standard', '4GB RAM, 2 CPU, 50GB Storage', 'pterodactyl', 15.00, 'monthly'],
    ['Pterodactyl Panel - Premium', '8GB RAM, 4 CPU, 100GB Storage', 'pterodactyl', 30.00, 'monthly'],
    ['Automation Suite', 'Complete automation toolkit', 'automation', 45.00, 'monthly']
  ];

  const insertMany = db.transaction((products) => {
    for (const product of products) {
      insert.run(product);
    }
  });

  insertMany(products);
}

// Initialize database
initializeDatabase();

export default db;
