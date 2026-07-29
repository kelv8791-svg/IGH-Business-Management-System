-- SQL Migration: iGift Branch Sync & Database Cleanup
-- Run this in the Supabase SQL Editor

-- 1. Defensively add branch columns if missing
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

-- 2. Clean up any existing NULL values to prevent data from being hidden
UPDATE users SET branch = 'IGH' WHERE branch IS NULL;
UPDATE clients SET branch = 'IGH' WHERE branch IS NULL;
UPDATE suppliers SET branch = 'IGH' WHERE branch IS NULL;
UPDATE supplier_expenses SET branch = 'IGH' WHERE branch IS NULL;
UPDATE expenses SET branch = 'IGH' WHERE branch IS NULL;
UPDATE inventory SET branch = 'IGH' WHERE branch IS NULL;
UPDATE inventory_categories SET branch = 'IGH' WHERE branch IS NULL;
UPDATE designs SET branch = 'IGH' WHERE branch IS NULL;
UPDATE sales SET branch = 'IGH' WHERE branch IS NULL;
UPDATE stock_transactions SET branch = 'IGH' WHERE branch IS NULL;
UPDATE supplier_payments SET branch = 'IGH' WHERE branch IS NULL;
UPDATE design_materials SET branch = 'IGH' WHERE branch IS NULL;

-- 3. Audit Log for sync run
INSERT INTO audit ("user", action, module, details)
VALUES ('system', 'UPDATE', 'Database', 'Executed iGift Branch Sync & Database Cleanup script');
