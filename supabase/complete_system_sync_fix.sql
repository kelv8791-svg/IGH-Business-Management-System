-- Comprehensive Master SQL Script: iGift & IGH Sync, Defensiveness & Database Alignment
-- Execute this script in the Supabase SQL Editor

-- 1. Ensure 'branch' column exists on all tables with default 'IGH'
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE supplier_expenses ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE designs ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE design_materials ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- 2. Ensure all operational columns exist
ALTER TABLE clients ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS completion DATE;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS handed_over BOOLEAN DEFAULT FALSE;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS handed_over_date DATE;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS source TEXT;

ALTER TABLE sales ADD COLUMN IF NOT EXISTS handed_over BOOLEAN DEFAULT FALSE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS handed_over_date DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS qty_sold NUMERIC DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS inventory_item_id BIGINT;

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS "reorderLevel" INT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS "unitPrice" NUMERIC DEFAULT 0;

ALTER TABLE supplier_expenses ADD COLUMN IF NOT EXISTS inventory_item_id BIGINT;
ALTER TABLE supplier_expenses ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Paid';
ALTER TABLE supplier_expenses ADD COLUMN IF NOT EXISTS quantity NUMERIC;

-- 3. Preserve legacy data: Safely convert any NULL branch to 'IGH'
UPDATE users SET branch = 'IGH' WHERE branch IS NULL OR branch = '';
UPDATE clients SET branch = 'IGH' WHERE branch IS NULL OR branch = '';
UPDATE suppliers SET branch = 'IGH' WHERE branch IS NULL OR branch = '';
UPDATE supplier_expenses SET branch = 'IGH' WHERE branch IS NULL OR branch = '';
UPDATE expenses SET branch = 'IGH' WHERE branch IS NULL OR branch = '';
UPDATE inventory SET branch = 'IGH' WHERE branch IS NULL OR branch = '';
UPDATE inventory_categories SET branch = 'IGH' WHERE branch IS NULL OR branch = '';
UPDATE designs SET branch = 'IGH' WHERE branch IS NULL OR branch = '';
UPDATE sales SET branch = 'IGH' WHERE branch IS NULL OR branch = '';
UPDATE stock_transactions SET branch = 'IGH' WHERE branch IS NULL OR branch = '';
UPDATE supplier_payments SET branch = 'IGH' WHERE branch IS NULL OR branch = '';
UPDATE design_materials SET branch = 'IGH' WHERE branch IS NULL OR branch = '';

-- 4. Enable RLS and public access policies defensively
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
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_materials ENABLE ROW LEVEL SECURITY;
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
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'supplier_payments') THEN
        CREATE POLICY "Public Access" ON supplier_payments FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'design_materials') THEN
        CREATE POLICY "Public Access" ON design_materials FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'audit') THEN
        CREATE POLICY "Public Access" ON audit FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 5. Audit Log
INSERT INTO audit ("user", action, module, details)
VALUES ('system', 'UPDATE', 'Database', 'Executed complete system sync & schema fix script');
