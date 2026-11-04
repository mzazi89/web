-- ═══════════════════════════════════════════════════════════════════════════
-- MZAZI TECH — centralisation migration 001
--
-- One Neon database, three applications:
--   web (mzazi.shop)      lower-case tables  users / subscriptions / orders ...
--   admin (admin.mzazi.shop) same lower-case tables
--   bot (MZAZI XMD)       Prisma tables      "User" / "Subscription" /
--                                             "WhatsAppSession" / "Payment" /
--                                             "Transaction" / "Coupon" / "Log"
--
-- The bot's Prisma models have no @@map, so Prisma addresses the quoted
-- PascalCase tables. mzazi.shop already writes to them directly
-- (lib/pairApi.js, app/api/pair/plan, app/api/pair/devices) — those routes were
-- failing because the tables did not exist.
--
-- A previous, unrelated application left its own "User"/"Profile"/"Cycle"/…
-- tables in this database. They are NOT compatible (no "telegramId") and are
-- moved to the `legacy_app` schema, not dropped: the rows are preserved and can
-- be restored with a single ALTER TABLE … SET SCHEMA.
--
-- Idempotent: safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Isolate the unrelated legacy application ────────────────────────────
CREATE SCHEMA IF NOT EXISTS legacy_app;

-- Each move is guarded: a table that is absent, or that already has the bot's
-- "telegramId" column, is left alone.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User','Profile','Cycle','Period','Pregnancy','Mood','Symptom','DailyLog',
    'Reminder','Notification','Session','WellnessLog','IntimateLog',
    'FertilityRecord','SecurityQuestion','UserSecurityAnswer',
    'PasswordRecoverySession','RateLimitBucket','Article','ArticleCategory',
    'AuditEvent'
  ]
  LOOP
    -- Only move a table that exists in public AND is not the bot's own shape.
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'telegramId'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I SET SCHEMA legacy_app', t);
      RAISE NOTICE 'moved public.% -> legacy_app.%', t, t;
    END IF;
  END LOOP;
END $$;

-- ── 2. Bot-side Prisma tables (quoted PascalCase, camelCase columns) ───────
CREATE TABLE IF NOT EXISTS "User" (
  "id"         SERIAL PRIMARY KEY,
  "telegramId" BIGINT NOT NULL,
  "username"   TEXT,
  "firstName"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_telegramId_key" ON "User"("telegramId");

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id"         SERIAL PRIMARY KEY,
  "userId"     INTEGER NOT NULL,
  "plan"       TEXT NOT NULL DEFAULT 'FREE',
  "maxDevices" INTEGER NOT NULL DEFAULT 1,
  "startDate"  TIMESTAMP(3),
  "endDate"    TIMESTAMP(3),
  "status"     TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");

CREATE TABLE IF NOT EXISTS "WhatsAppSession" (
  "id"          SERIAL PRIMARY KEY,
  "userId"      INTEGER NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'ACTIVE',
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsAppSession_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppSession_phoneNumber_key" ON "WhatsAppSession"("phoneNumber");

CREATE TABLE IF NOT EXISTS "Payment" (
  "id"          SERIAL PRIMARY KEY,
  "userId"      INTEGER NOT NULL,
  "reference"   TEXT NOT NULL,
  "amount"      DOUBLE PRECISION NOT NULL,
  "plan"        TEXT NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'PENDING',
  "paystackRef" TEXT,
  "couponUsed"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_reference_key" ON "Payment"("reference");

CREATE TABLE IF NOT EXISTS "Transaction" (
  "id"          SERIAL PRIMARY KEY,
  "userId"      INTEGER NOT NULL,
  "type"        TEXT NOT NULL,
  "amount"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "description" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Coupon" (
  "id"        SERIAL PRIMARY KEY,
  "code"      TEXT NOT NULL,
  "discount"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "maxUses"   INTEGER NOT NULL DEFAULT 1,
  "usesCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");

CREATE TABLE IF NOT EXISTS "Log" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER,
  "action"    TEXT NOT NULL,
  "details"   TEXT,
  "level"     TEXT NOT NULL DEFAULT 'INFO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ── 3. Website tables referenced by code but never created ─────────────────
-- app/api/payment/verify/route.js inserts into `payments` after a successful
-- Paystack charge; without the table the order was completed but the response
-- 500'd and the customer never saw their credentials.
CREATE TABLE IF NOT EXISTS payments (
  id         SERIAL PRIMARY KEY,
  reference  VARCHAR(255) NOT NULL,
  amount     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status     VARCHAR(50) NOT NULL DEFAULT 'success',
  paid_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);

-- Community chat is created lazily by its own route; pre-create so the first
-- visitor does not pay for the DDL and the table is visible in the backup.
CREATE TABLE IF NOT EXISTS community_messages (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER,
  user_name  VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  role       VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
