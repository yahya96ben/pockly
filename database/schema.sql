-- ============================================================================
-- POCKLY FULLSTACK — DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('client', 'merchant')),
  restaurant_id   UUID,                                  -- For merchants only (FK added below)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_restaurant ON users(restaurant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RESTAURANTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  address         TEXT NOT NULL,
  phone           TEXT NOT NULL,
  prep_time       INTEGER DEFAULT 15,
  open            BOOLEAN DEFAULT TRUE,
  category        TEXT,
  emoji           TEXT DEFAULT '🍽️',
  loyalty_target  INTEGER DEFAULT 6,
  loyalty_reward  TEXT DEFAULT '',
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_open ON restaurants(open);

-- Add FK from users to restaurants (now that restaurants exists)
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_restaurant_id_fkey;
ALTER TABLE users
  ADD CONSTRAINT users_restaurant_id_fkey
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- PRODUCTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('unit', 'composable')),
  name            TEXT NOT NULL,
  description     TEXT DEFAULT '',
  photo           TEXT DEFAULT '📦',
  category        TEXT DEFAULT '',
  -- Unit type fields
  price           NUMERIC(10, 2),
  stock           INTEGER,
  -- Composable type fields
  base_price      NUMERIC(10, 2),
  options         JSONB,
  -- Common
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_restaurant ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORDERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id          TEXT UNIQUE NOT NULL,                -- e.g. "ABC123"
  restaurant_id     UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name     TEXT,
  customer_phone    TEXT,
  customer_email    TEXT,
  items             JSONB NOT NULL,                      -- Array of order items
  total             NUMERIC(10, 2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'preparing', 'ready', 'done', 'cancelled')),
  source            TEXT DEFAULT 'platform',             -- platform | whatsapp | qr
  payment_method    TEXT CHECK (payment_method IN ('place', 'online')),
  payment_status    TEXT DEFAULT 'pending'
                    CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  pickup_time       TEXT,
  remarks           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER : auto-update `updated_at` on row update
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_restaurants_updated_at ON restaurants;
CREATE TRIGGER set_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON orders;
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA (3 demo restaurants, like SEED_RESTAURANTS in V8)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO restaurants (id, name, address, phone, category, emoji, prep_time, open, loyalty_target, loyalty_reward)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Maison Délices',  'Rue de la Boulangerie 12, 1000 Bruxelles', '+32470111111', 'Boulangerie',  '🥖', 12, TRUE, 6, '1 croissant offert'),
  ('22222222-2222-2222-2222-222222222222', 'Poké & Co',        'Avenue Louise 45, 1050 Ixelles',          '+32470222222', 'Restaurant',   '🥗', 18, TRUE, 6, '1 poké bowl offert'),
  ('33333333-3333-3333-3333-333333333333', 'Café Aurore',      'Place du Châtelain 8, 1050 Ixelles',      '+32470333333', 'Café',         '☕', 8,  TRUE, 8, '1 boisson offerte')
ON CONFLICT (id) DO NOTHING;

-- Seed a few products for "Maison Délices" so first impression is non-empty
INSERT INTO products (restaurant_id, type, name, description, photo, category, price, stock)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'unit', 'Pain Tradition',     'Baguette tradition croustillante.',     '🥖', 'Boulangerie',   1.20, 45),
  ('11111111-1111-1111-1111-111111111111', 'unit', 'Croissant Beurre',   'Croissant pur beurre AOP.',             '🥐', 'Viennoiserie',  1.40, 30),
  ('11111111-1111-1111-1111-111111111111', 'unit', 'Pain au Chocolat',   'Deux barres de chocolat noir.',         '🍫', 'Viennoiserie',  1.50, 25)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (defense in depth — backend uses service_role key, but
-- if someone leaks it, RLS still protects)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically. We add a permissive policy
-- only for the anon key in case you ever read directly from frontend.
DROP POLICY IF EXISTS "Public restaurants are viewable" ON restaurants;
CREATE POLICY "Public restaurants are viewable" ON restaurants
  FOR SELECT USING (open = TRUE);

DROP POLICY IF EXISTS "Public active products are viewable" ON products;
CREATE POLICY "Public active products are viewable" ON products
  FOR SELECT USING (active = TRUE);

-- ============================================================================
-- DONE. You should now have 4 tables, 3 demo restaurants, 3 sample products.
-- Verify with:  SELECT * FROM restaurants;
-- ============================================================================
