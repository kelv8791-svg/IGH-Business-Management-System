-- Supabase / Postgres schema for IGH BMS (Finalized)
-- Run in Supabase SQL Editor to create tables

-- Users: username is primary key
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  email TEXT,
  password TEXT,
  role TEXT,
  branch TEXT DEFAULT 'IGH',
  pref_compact BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS clients (
  id BIGINT PRIMARY KEY,
  name TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  location TEXT,
  branch TEXT DEFAULT 'IGH'
);

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT PRIMARY KEY,
  name TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  kra TEXT,
  credit NUMERIC,
  branch TEXT DEFAULT 'IGH'
);

CREATE TABLE IF NOT EXISTS supplier_expenses (
  id BIGINT PRIMARY KEY,
  date DATE,
  supplier BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
  type TEXT,
  amount NUMERIC,
  remarks TEXT,
  branch TEXT DEFAULT 'IGH'
);

CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT PRIMARY KEY,
  date DATE,
  cat TEXT,
  amount NUMERIC,
  "desc" TEXT,
  branch TEXT DEFAULT 'IGH'
);

CREATE TABLE IF NOT EXISTS inventory (
  id BIGINT PRIMARY KEY,
  name TEXT,
  sku TEXT,
  category TEXT,
  quantity INT,
  "reorderLevel" INT,
  "unitPrice" NUMERIC,
  supplier BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
  branch TEXT DEFAULT 'IGH'
);

CREATE TABLE IF NOT EXISTS inventory_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  branch TEXT DEFAULT 'IGH'
);

CREATE TABLE IF NOT EXISTS designs (
  id BIGINT PRIMARY KEY,
  type TEXT,
  client TEXT,
  "assignedTo" TEXT REFERENCES users(username) ON DELETE SET NULL,
  status TEXT,
  "paymentStatus" TEXT,
  "paymentAmount" NUMERIC,
  "paymentDate" DATE,
  notes TEXT,
  handed_over BOOLEAN DEFAULT FALSE,
  handed_over_date DATE,
  amount NUMERIC,
  completion DATE,
  date DATE,
  source TEXT,
  branch TEXT DEFAULT 'IGH'
);

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT PRIMARY KEY,
  date DATE,
  client TEXT,
  dept TEXT,
  amount NUMERIC,
  "desc" TEXT,
  "paymentMethod" TEXT,
  "paymentRef" TEXT,
  "paymentStatus" TEXT,
  source TEXT,
  "designId" BIGINT REFERENCES designs(id) ON DELETE SET NULL,
  handed_over BOOLEAN DEFAULT FALSE,
  handed_over_date DATE,
  qty_sold NUMERIC DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS audit (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "user" TEXT,
  action TEXT,
  module TEXT,
  details TEXT
);

-- Row Level Security (RLS)
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

-- Public Access Policies
CREATE POLICY "Public Access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON supplier_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON inventory_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON designs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON stock_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON audit FOR ALL USING (true) WITH CHECK (true);
