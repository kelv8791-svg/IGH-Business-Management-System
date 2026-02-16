-- Enable RLS and set up public access policies for IGH BMS
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit ENABLE ROW LEVEL SECURITY;

-- 2. Create "Public Access" policies (allowing all actions for everyone)
-- Note: For a production app with sensitive data, you would restrict this.
-- Since this is an internal business tool, we are starting with open access for authenticated/anon users.

-- Users
CREATE POLICY "Public Access" ON users FOR ALL USING (true) WITH CHECK (true);

-- Clients
CREATE POLICY "Public Access" ON clients FOR ALL USING (true) WITH CHECK (true);

-- Suppliers
CREATE POLICY "Public Access" ON suppliers FOR ALL USING (true) WITH CHECK (true);

-- Supplier Expenses
CREATE POLICY "Public Access" ON supplier_expenses FOR ALL USING (true) WITH CHECK (true);

-- Expenses
CREATE POLICY "Public Access" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- Inventory
CREATE POLICY "Public Access" ON inventory FOR ALL USING (true) WITH CHECK (true);

-- Designs
CREATE POLICY "Public Access" ON designs FOR ALL USING (true) WITH CHECK (true);

-- Sales
CREATE POLICY "Public Access" ON sales FOR ALL USING (true) WITH CHECK (true);

-- Audit
CREATE POLICY "Public Access" ON audit FOR ALL USING (true) WITH CHECK (true);
