-- Multi-Branch Setup
-- Run this script in Supabase SQL Editor to enable multi-branch support

-- 1. Add branch column to Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- 2. Add branch column to core business tables
ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE designs ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- 3. Add branch to Clients and Suppliers (Optional, but good for filtering)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE supplier_expenses ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- 4. Update existing admin user to have access to ALL (or specific branch, handled by app logic)
-- Note: 'admin' user usually sees everything. We'll handle 'All' view in the frontend.

-- 5. Create a new user for iGift (Example)
-- You can run this line to create a test user, or create it via the Signup page if you have one.
-- INSERT INTO users (username, email, password, role, branch) VALUES ('gift_admin', 'gift@igh.com', 'gift123', 'admin', 'iGift') ON CONFLICT DO NOTHING;
