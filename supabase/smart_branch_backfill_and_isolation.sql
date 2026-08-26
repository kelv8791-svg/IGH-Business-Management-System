-- Smart Relational Branch Backfill & Column Normalization
-- Execute this script in the Supabase SQL Editor

-- 1. Ensure branch column exists across all tables
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

-- 2. Smart Relational Backfill based on existing linked records
-- Sales linked to Designs inherit Design branch (uses "designId" camelCase column)
UPDATE sales s
SET branch = d.branch
FROM designs d
WHERE s."designId" = d.id 
  AND d.branch IS NOT NULL 
  AND (s.branch IS NULL OR s.branch = '' OR s.branch = 'IGH') 
  AND LOWER(d.branch) = 'igift';

-- Sales linked to Inventory items inherit Inventory branch
UPDATE sales s
SET branch = i.branch
FROM inventory i
WHERE s.inventory_item_id = i.id 
  AND i.branch IS NOT NULL 
  AND (s.branch IS NULL OR s.branch = '' OR s.branch = 'IGH') 
  AND LOWER(i.branch) = 'igift';

-- Stock Transactions linked to Inventory inherit Inventory branch
UPDATE stock_transactions st
SET branch = i.branch
FROM inventory i
WHERE st.item_id = i.id 
  AND i.branch IS NOT NULL 
  AND (st.branch IS NULL OR st.branch = '' OR st.branch = 'IGH') 
  AND LOWER(i.branch) = 'igift';

-- Supplier Expenses linked to Inventory inherit Inventory branch
UPDATE supplier_expenses se
SET branch = i.branch
FROM inventory i
WHERE se.inventory_item_id = i.id 
  AND i.branch IS NOT NULL 
  AND (se.branch IS NULL OR se.branch = '' OR se.branch = 'IGH') 
  AND LOWER(i.branch) = 'igift';

-- Design Materials linked to Designs inherit Design branch (uses design_id snake_case)
UPDATE design_materials dm
SET branch = d.branch
FROM designs d
WHERE dm.design_id = d.id 
  AND d.branch IS NOT NULL 
  AND (dm.branch IS NULL OR dm.branch = '' OR dm.branch = 'IGH') 
  AND LOWER(d.branch) = 'igift';

-- 3. Clean and standardize casing for all branch values
UPDATE users SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE users SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR branch = '';

UPDATE clients SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE clients SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR branch = '';

UPDATE suppliers SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE suppliers SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR branch = '';

UPDATE supplier_expenses SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE supplier_expenses SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR branch = '';

UPDATE expenses SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE expenses SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR branch = '';

UPDATE inventory SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE inventory SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR branch = '';

UPDATE inventory_categories SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE inventory_categories SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR branch = '';

UPDATE designs SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE designs SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR branch = '';

UPDATE sales SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE sales SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR branch = '';

UPDATE stock_transactions SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE stock_transactions SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR branch = '';

UPDATE supplier_payments SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE supplier_payments SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR branch = '';

UPDATE design_materials SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE design_materials SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR branch = '';

-- Log audit entry
INSERT INTO audit ("user", action, module, details)
VALUES ('system', 'UPDATE', 'Database', 'Executed Smart Relational Branch Backfill & Isolation script');
