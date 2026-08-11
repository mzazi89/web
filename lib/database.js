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

    // Add expires_after_hours to packages (safe on re-run)
    await sql`ALTER TABLE packages ADD COLUMN IF NOT EXISTS expires_after_hours INTEGER DEFAULT NULL`;

    // Add expires_at to panels (safe on re-run)
    await sql`ALTER TABLE panels ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL`;

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

    // Insert Testing Server package if it doesn't exist
    await sql`
      INSERT INTO packages (name, price, cpu, ram, disk, description, popular, accent, active, sort_order, expires_after_hours)
      SELECT 'Testing Server', 5, 20, 512, 1024, 'Try our platform risk-free. Server is automatically removed after 6 hours.', false, '#7c3aed', true, 0, 6
      WHERE NOT EXISTS (SELECT 1 FROM packages WHERE name = 'Testing Server')
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS voucher_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_by VARCHAR(255),
        used_by INTEGER REFERENCES users(id),
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    /* ═══════════════════════════════════════════════════════════════
       MZAZI API PLATFORM — additive schema (safe on re-run)
       ═══════════════════════════════════════════════════════════════ */

    // users: role + status (safe on re-run)
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`;

    // api_keys — only the SHA-256 hash is stored, never the raw key
    await sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL DEFAULT 'Default Key',
        key_hash VARCHAR(64) NOT NULL UNIQUE,
        key_prefix VARCHAR(32) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        plan VARCHAR(20) NOT NULL DEFAULT 'FREE',
        expires_at TIMESTAMP,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status)`;

    // api_requests — one row per API call (request log)
    await sql`
      CREATE TABLE IF NOT EXISTS api_requests (
        id SERIAL PRIMARY KEY,
        request_id VARCHAR(64) NOT NULL UNIQUE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        api_key_id INTEGER REFERENCES api_keys(id) ON DELETE SET NULL,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INTEGER NOT NULL,
        response_time_ms INTEGER NOT NULL,
        provider VARCHAR(100),
        ip VARCHAR(45),
        user_agent VARCHAR(255),
        error_code VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_requests_user ON api_requests(user_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_requests_key ON api_requests(api_key_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint ON api_requests(endpoint, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_requests_created ON api_requests(created_at DESC)`;

    // api_usage — daily rollup per key (rate-limit counter + analytics)
    await sql`
      CREATE TABLE IF NOT EXISTS api_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        requests INTEGER NOT NULL DEFAULT 0,
        success INTEGER NOT NULL DEFAULT 0,
        failed INTEGER NOT NULL DEFAULT 0,
        provider_failures INTEGER NOT NULL DEFAULT 0,
        total_response_time_ms BIGINT NOT NULL DEFAULT 0,
        UNIQUE (api_key_id, date)
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id, date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(date DESC)`;

    // subscriptions — one active plan per user (upsert on change)
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        plan VARCHAR(20) NOT NULL DEFAULT 'FREE',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan)`;

    // endpoints — registry of all platform endpoints (future-proof)
    await sql`
      CREATE TABLE IF NOT EXISTS endpoints (
        id SERIAL PRIMARY KEY,
        path VARCHAR(255) NOT NULL UNIQUE,
        method VARCHAR(10) NOT NULL DEFAULT 'GET',
        category VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        provider VARCHAR(100),
        requires_query BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // api_settings — key/value config (rate limits etc.), admin-editable
    await sql`
      CREATE TABLE IF NOT EXISTS api_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Seed endpoint registry (only real, configured providers are active)
    await sql`
      INSERT INTO endpoints (path, method, category, name, description, provider, requires_query, is_active) VALUES
        ('/api/health', 'GET', 'UTILITY', 'Health Check', 'System health status', 'internal', false, true),
        ('/api/download/play', 'GET', 'DOWNLOAD', 'Play / Audio Download', 'Search and download music by title or artist', 'youtube', true, true),
        ('/api/download/youtube', 'GET', 'DOWNLOAD', 'YouTube Video Download', 'Download YouTube videos', NULL, true, false),
        ('/api/download/tiktok', 'GET', 'DOWNLOAD', 'TikTok Download', 'Download TikTok videos without watermark', NULL, true, false),
        ('/api/download/facebook', 'GET', 'DOWNLOAD', 'Facebook Download', 'Download Facebook videos', NULL, true, false),
        ('/api/download/instagram', 'GET', 'DOWNLOAD', 'Instagram Download', 'Download Instagram reels and videos', NULL, true, false),
        ('/api/search/youtube', 'GET', 'SEARCH', 'YouTube Search', 'Search YouTube videos', NULL, true, false),
        ('/api/search/google', 'GET', 'SEARCH', 'Google Search', 'Web search results', NULL, true, false),
        ('/api/search/image', 'GET', 'SEARCH', 'Image Search', 'Image search results', NULL, true, false),
        ('/api/ai/chat', 'POST', 'AI', 'AI Chat', 'Chat with an AI assistant', NULL, true, false),
        ('/api/ai/generate', 'POST', 'AI', 'AI Text Generate', 'Generate text content', NULL, true, false),
        ('/api/ai/imagine', 'POST', 'AI', 'AI Imagine', 'Generate images from text', NULL, true, false),
        ('/api/tools/qrcode', 'GET', 'TOOLS', 'QR Code Generator', 'Generate QR codes', NULL, true, false),
        ('/api/tools/translate', 'POST', 'TOOLS', 'Translate Text', 'Translate text between languages', NULL, true, false),
        ('/api/tools/shorturl', 'POST', 'TOOLS', 'Short URL', 'Shorten long URLs', NULL, true, false)
      ON CONFLICT (path) DO NOTHING
    `;

    // Seed configurable rate-limit settings (only if missing)
    await sql`
      INSERT INTO api_settings (key, value) VALUES
        ('rate_limit.FREE', '100'),
        ('rate_limit.PREMIUM', '10000'),
        ('rate_limit.BUSINESS', '100000'),
        ('rate_limit.ADMIN', '-1'),
        ('default_plan', 'FREE')
      ON CONFLICT (key) DO NOTHING
    `;

    // Ensure every existing user has a subscription row
    await sql`
      INSERT INTO subscriptions (user_id, plan, status)
      SELECT id, 'FREE', 'active' FROM users
      WHERE NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = users.id)
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export { sql };
export default sql;
// This content is patched below in initializeDatabase — see voucher_codes addition
