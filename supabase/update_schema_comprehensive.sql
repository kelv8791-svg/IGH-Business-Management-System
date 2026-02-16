-- Comprehensive Schema Fix for IGH BMS
-- Run this in Supabase SQL Editor to ensure all tables and columns match the frontend expectations.

-- 1. CLIENTS
ALTER TABLE clients ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. DESIGNS
-- Frontend sends 'type', schema had 'title'. Let's support 'type' as the main field.
ALTER TABLE designs ADD COLUMN IF NOT EXISTS type TEXT;
-- If you want to migrate existing titles to type:
-- UPDATE designs SET type = title WHERE type IS NULL;

-- Frontend sends 'completion' (date), add it.
ALTER TABLE designs ADD COLUMN IF NOT EXISTS completion DATE;

-- Frontend sends 'handedOver', schema had 'handed_over'.
-- We will handle mapping in JS, but ensure snake_case columns exist.
ALTER TABLE designs ADD COLUMN IF NOT EXISTS handed_over BOOLEAN DEFAULT FALSE;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS handed_over_date DATE;

-- 3. SALES
-- Ensure snake_case columns
ALTER TABLE sales ADD COLUMN IF NOT EXISTS handed_over BOOLEAN DEFAULT FALSE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS handed_over_date DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS source TEXT;

-- 4. INVENTORY
-- Postgres lowercases unquoted identifiers. Frontend sends 'reorderLevel', 'unitPrice'.
-- These likely mapped to 'reorderlevel', 'unitprice' automatically.
-- We'll explicitly check/add them just in case.
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS quantity INT; 
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reorderlevel INT; -- standard postgres behavior
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS unitprice NUMERIC;

-- 5. IDS - Ensure BIGINT for everything (Re-run from previous fix to be safe)
ALTER TABLE clients ALTER COLUMN id TYPE BIGINT;
ALTER TABLE suppliers ALTER COLUMN id TYPE BIGINT;
ALTER TABLE supplier_expenses ALTER COLUMN id TYPE BIGINT;
ALTER TABLE expenses ALTER COLUMN id TYPE BIGINT;
ALTER TABLE inventory ALTER COLUMN id TYPE BIGINT;
ALTER TABLE designs ALTER COLUMN id TYPE BIGINT;
ALTER TABLE sales ALTER COLUMN id TYPE BIGINT;

-- 6. RLS - Re-apply Public Access to be absolutely sure
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
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
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'designs') THEN
        CREATE POLICY "Public Access" ON designs FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'sales') THEN
        CREATE POLICY "Public Access" ON sales FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'audit') THEN
        CREATE POLICY "Public Access" ON audit FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
