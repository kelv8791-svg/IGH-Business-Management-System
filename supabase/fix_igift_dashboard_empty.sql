-- =============================================================================
-- FIX: iGift Dashboard Empty - Branch Data Audit & Correction
-- Run this in the Supabase SQL Editor
-- =============================================================================
-- PROBLEM: Records belonging to iGift may have been tagged as 'IGH' or stored
--          with NULL/empty branch values. This script identifies and corrects them.
-- =============================================================================

-- STEP 1: Check current branch distribution (run this first to see the state)
-- SELECT branch, COUNT(*) FROM sales GROUP BY branch;
-- SELECT branch, COUNT(*) FROM expenses GROUP BY branch;
-- SELECT branch, COUNT(*) FROM clients GROUP BY branch;

-- STEP 2: Ensure branch column exists on all tables (defensive)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE supplier_expenses ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE designs ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE design_materials ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- STEP 3: Normalize all branch values — enforce consistent casing
-- IGH variants → 'IGH'
UPDATE sales SET branch = 'IGH' WHERE LOWER(branch) = 'igh';
UPDATE expenses SET branch = 'IGH' WHERE LOWER(branch) = 'igh';
UPDATE clients SET branch = 'IGH' WHERE LOWER(branch) = 'igh';
UPDATE suppliers SET branch = 'IGH' WHERE LOWER(branch) = 'igh';
UPDATE supplier_expenses SET branch = 'IGH' WHERE LOWER(branch) = 'igh';
UPDATE supplier_payments SET branch = 'IGH' WHERE LOWER(branch) = 'igh';
UPDATE inventory SET branch = 'IGH' WHERE LOWER(branch) = 'igh';
UPDATE inventory_categories SET branch = 'IGH' WHERE LOWER(branch) = 'igh';
UPDATE designs SET branch = 'IGH' WHERE LOWER(branch) = 'igh';
UPDATE stock_transactions SET branch = 'IGH' WHERE LOWER(branch) = 'igh';
UPDATE design_materials SET branch = 'IGH' WHERE LOWER(branch) = 'igh';

-- iGift variants → 'iGift' (normalize 'igift', 'IGIFT', 'iGIFT', 'Igift' etc.)
UPDATE sales SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE expenses SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE clients SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE suppliers SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE supplier_expenses SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE supplier_payments SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE inventory SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE inventory_categories SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE designs SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE stock_transactions SET branch = 'iGift' WHERE LOWER(branch) = 'igift';
UPDATE design_materials SET branch = 'iGift' WHERE LOWER(branch) = 'igift';

-- STEP 4: Fix NULL/empty branches → default to 'IGH'
UPDATE sales SET branch = 'IGH' WHERE branch IS NULL OR TRIM(branch) = '';
UPDATE expenses SET branch = 'IGH' WHERE branch IS NULL OR TRIM(branch) = '';
UPDATE clients SET branch = 'IGH' WHERE branch IS NULL OR TRIM(branch) = '';
UPDATE suppliers SET branch = 'IGH' WHERE branch IS NULL OR TRIM(branch) = '';
UPDATE supplier_expenses SET branch = 'IGH' WHERE branch IS NULL OR TRIM(branch) = '';
UPDATE supplier_payments SET branch = 'IGH' WHERE branch IS NULL OR TRIM(branch) = '';
UPDATE inventory SET branch = 'IGH' WHERE branch IS NULL OR TRIM(branch) = '';
UPDATE inventory_categories SET branch = 'IGH' WHERE branch IS NULL OR TRIM(branch) = '';
UPDATE designs SET branch = 'IGH' WHERE branch IS NULL OR TRIM(branch) = '';
UPDATE stock_transactions SET branch = 'IGH' WHERE branch IS NULL OR TRIM(branch) = '';
UPDATE design_materials SET branch = 'IGH' WHERE branch IS NULL OR TRIM(branch) = '';

-- STEP 5: Normalize users table branch values
UPDATE users SET branch = 'IGH' WHERE LOWER(branch) = 'igh' OR branch IS NULL OR TRIM(branch) = '';
UPDATE users SET branch = 'iGift' WHERE LOWER(branch) = 'igift';

-- STEP 6: Verify the results after running
-- Run these SELECTs to confirm the data looks correct:
-- SELECT branch, COUNT(*) as count FROM sales GROUP BY branch ORDER BY branch;
-- SELECT branch, COUNT(*) as count FROM expenses GROUP BY branch ORDER BY branch;
-- SELECT branch, COUNT(*) as count FROM clients GROUP BY branch ORDER BY branch;
-- SELECT branch, COUNT(*) as count FROM inventory GROUP BY branch ORDER BY branch;

-- STEP 7: Audit log
INSERT INTO audit ("user", action, module, details)
VALUES (
  'system',
  'UPDATE',
  'Database',
  'Executed fix_igift_dashboard_empty.sql: normalized branch casing across all tables (IGH/iGift)'
);
