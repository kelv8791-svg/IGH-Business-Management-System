-- Comprehensive Schema Fix for IGH BMS
-- Run this in Supabase SQL Editor to ensure all tables and columns match the frontend expectations.

-- 1. CLIENTS
ALTER TABLE clients ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- 2. DESIGNS
-- Frontend sends 'type', schema had 'title'. Let's support 'type' as the main field.
ALTER TABLE designs ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS completion DATE;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS handed_over BOOLEAN DEFAULT FALSE;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS handed_over_date DATE;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE designs ADD COLUMN IF NOT EXISTS source TEXT;

-- 3. SALES
ALTER TABLE sales ADD COLUMN IF NOT EXISTS handed_over BOOLEAN DEFAULT FALSE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS handed_over_date DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS qty_sold NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- 4. INVENTORY
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS quantity INT; 
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS "reorderLevel" INT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS "unitPrice" NUMERIC;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- 5. OTHER TABLES BRANCH COLUMN
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE supplier_expenses ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- 6. IDS - Ensure BIGINT for everything
ALTER TABLE clients ALTER COLUMN id TYPE BIGINT;
ALTER TABLE suppliers ALTER COLUMN id TYPE BIGINT;
ALTER TABLE supplier_expenses ALTER COLUMN id TYPE BIGINT;
ALTER TABLE expenses ALTER COLUMN id TYPE BIGINT;
ALTER TABLE inventory ALTER COLUMN id TYPE BIGINT;
ALTER TABLE designs ALTER COLUMN id TYPE BIGINT;
ALTER TABLE sales ALTER COLUMN id TYPE BIGINT;

-- 7. NEW TABLES AND POLICIES
CREATE TABLE IF NOT EXISTS inventory_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  branch TEXT DEFAULT 'IGH'
);

CREATE TABLE IF NOT EXISTS stock_transactions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  item_id BIGINT REFERENCES inventory(id) ON DELETE CASCADE,
  quantity_change INT NOT NULL,
  transaction_type TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT,
  branch TEXT DEFAULT 'IGH'
);

-- 8. RLS - Re-apply Public Access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Policy creation helper
    PERFORM 1 FROM pg_policies WHERE policyname = 'Public Access'; 
    -- We just re-apply for all to be safe if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'users') THEN
        CREATE POLICY "Public Access" ON users FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'clients') THEN
        CREATE POLICY "Public Access" ON clients FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'suppliers') THEN
        CREATE POLICY "Public Access" ON suppliers FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'supplier_expenses') THEN
        CREATE POLICY "Public Access" ON supplier_expenses FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'expenses') THEN
        CREATE POLICY "Public Access" ON expenses FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'inventory') THEN
        CREATE POLICY "Public Access" ON inventory FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'inventory_categories') THEN
        CREATE POLICY "Public Access" ON inventory_categories FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'designs') THEN
        CREATE POLICY "Public Access" ON designs FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'sales') THEN
        CREATE POLICY "Public Access" ON sales FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'stock_transactions') THEN
        CREATE POLICY "Public Access" ON stock_transactions FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'audit') THEN
        CREATE POLICY "Public Access" ON audit FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
