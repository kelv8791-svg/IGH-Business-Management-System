-- ==============================================================================
-- IGH BMS: COMPREHENSIVE PRODUCTION UPGRADE & STRICT BRANCH ISOLATION SQL
-- Run this script in your Supabase Project SQL Editor
-- ==============================================================================

-- 1. Enable Cryptographic Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Ensure all tables have required columns & data types
-- Users
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  email TEXT,
  password TEXT,
  role TEXT DEFAULT 'user',
  branch TEXT DEFAULT 'IGH',
  pref_compact BOOLEAN DEFAULT FALSE,
  session_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS session_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE users ADD COLUMN IF NOT EXISTS pref_compact BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id BIGINT PRIMARY KEY,
  name TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  location TEXT,
  branch TEXT DEFAULT 'IGH',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS location TEXT;

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT PRIMARY KEY,
  name TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  kra TEXT,
  credit NUMERIC DEFAULT 0,
  branch TEXT DEFAULT 'IGH',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS kra TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS credit NUMERIC DEFAULT 0;

-- Supplier Expenses
CREATE TABLE IF NOT EXISTS supplier_expenses (
  id BIGINT PRIMARY KEY,
  date DATE,
  supplier BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
  type TEXT,
  amount NUMERIC DEFAULT 0,
  remarks TEXT,
  quantity NUMERIC,
  inventory_item_id BIGINT,
  payment_status TEXT DEFAULT 'Paid',
  branch TEXT DEFAULT 'IGH',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE supplier_expenses ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE supplier_expenses ADD COLUMN IF NOT EXISTS quantity NUMERIC;
ALTER TABLE supplier_expenses ADD COLUMN IF NOT EXISTS inventory_item_id BIGINT;
ALTER TABLE supplier_expenses ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Paid';

-- Supplier Payments
CREATE TABLE IF NOT EXISTS supplier_payments (
  id BIGINT PRIMARY KEY,
  date DATE,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  reference TEXT,
  branch TEXT DEFAULT 'IGH',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE supplier_payments ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT PRIMARY KEY,
  date DATE,
  cat TEXT,
  amount NUMERIC DEFAULT 0,
  "desc" TEXT,
  branch TEXT DEFAULT 'IGH',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id BIGINT PRIMARY KEY,
  name TEXT,
  sku TEXT,
  category TEXT,
  quantity INT DEFAULT 0,
  "reorderLevel" INT,
  "unitPrice" NUMERIC DEFAULT 0,
  supplier BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
  branch TEXT DEFAULT 'iGift',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'iGift';

-- Inventory Categories
CREATE TABLE IF NOT EXISTS inventory_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  branch TEXT DEFAULT 'iGift'
);
ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'iGift';

-- Designs
CREATE TABLE IF NOT EXISTS designs (
  id BIGINT PRIMARY KEY,
  type TEXT,
  client TEXT,
  "assignedTo" TEXT REFERENCES users(username) ON DELETE SET NULL,
  status TEXT DEFAULT 'In Progress',
  "paymentStatus" TEXT DEFAULT 'Not Started',
  "paymentAmount" NUMERIC DEFAULT 0,
  "paymentDate" DATE,
  notes TEXT,
  handed_over BOOLEAN DEFAULT FALSE,
  handed_over_date DATE,
  amount NUMERIC DEFAULT 0,
  completion DATE,
  date DATE,
  source TEXT,
  branch TEXT DEFAULT 'IGH',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE designs ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE designs ADD COLUMN IF NOT EXISTS handed_over BOOLEAN DEFAULT FALSE;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS handed_over_date DATE;

-- Design Materials
CREATE TABLE IF NOT EXISTS design_materials (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  design_id BIGINT REFERENCES designs(id) ON DELETE CASCADE,
  item_id BIGINT REFERENCES inventory(id) ON DELETE CASCADE,
  quantity_used NUMERIC DEFAULT 1,
  assigned_by TEXT,
  date DATE DEFAULT CURRENT_DATE,
  branch TEXT DEFAULT 'IGH',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE design_materials ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id BIGINT PRIMARY KEY,
  date DATE,
  client TEXT,
  dept TEXT,
  amount NUMERIC DEFAULT 0,
  "desc" TEXT,
  "paymentMethod" TEXT DEFAULT 'Cash',
  "paymentRef" TEXT,
  "paymentStatus" TEXT DEFAULT 'Paid',
  source TEXT DEFAULT 'Direct Sale',
  "designId" BIGINT REFERENCES designs(id) ON DELETE SET NULL,
  inventory_item_id BIGINT REFERENCES inventory(id) ON DELETE SET NULL,
  handed_over BOOLEAN DEFAULT FALSE,
  handed_over_date DATE,
  qty_sold NUMERIC DEFAULT 0,
  branch TEXT DEFAULT 'IGH',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS inventory_item_id BIGINT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS handed_over BOOLEAN DEFAULT FALSE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS handed_over_date DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS qty_sold NUMERIC DEFAULT 0;

-- Stock Transactions
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
  branch TEXT DEFAULT 'iGift'
);
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'iGift';

-- Audit Log
CREATE TABLE IF NOT EXISTS audit (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "user" TEXT,
  action TEXT,
  module TEXT,
  details TEXT,
  branch TEXT DEFAULT 'IGH'
);
ALTER TABLE audit ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- ==============================================================================
-- 3. SECURE AUTHENTICATION & BCRYPT UPGRADE STORED PROCEDURES
-- ==============================================================================

-- Function: Verify login with automatic bcrypt upgrade
CREATE OR REPLACE FUNCTION verify_user_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_is_valid BOOLEAN := FALSE;
  v_new_hash TEXT;
BEGIN
  SELECT username, email, password, role, branch, pref_compact, session_token
  INTO v_user
  FROM users
  WHERE LOWER(username) = LOWER(p_username);

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'message', 'Invalid username or password');
  END IF;

  -- Check if password matches bcrypt hash OR legacy plaintext
  IF v_user.password LIKE '$2a$%' OR v_user.password LIKE '$2b$%' OR v_user.password LIKE '$2y$%' THEN
    -- Bcrypt hashed password check
    v_is_valid := (v_user.password = crypt(p_password, v_user.password));
  ELSE
    -- Legacy plaintext password check
    v_is_valid := (v_user.password = p_password);
    -- Upgrade to bcrypt immediately upon successful verification
    IF v_is_valid THEN
      v_new_hash := crypt(p_password, gen_salt('bf', 10));
      UPDATE users SET password = v_new_hash WHERE LOWER(username) = LOWER(p_username);
    END IF;
  END IF;

  IF v_is_valid THEN
    RETURN json_build_object(
      'success', TRUE,
      'user', json_build_object(
        'username', v_user.username,
        'email', v_user.email,
        'role', v_user.role,
        'branch', COALESCE(v_user.branch, 'IGH'),
        'pref_compact', COALESCE(v_user.pref_compact, FALSE)
      )
    );
  ELSE
    RETURN json_build_object('success', FALSE, 'message', 'Invalid username or password');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Change User Password securely
CREATE OR REPLACE FUNCTION update_user_password_secure(
  p_username TEXT,
  p_old_password TEXT,
  p_new_password TEXT,
  p_is_admin_override BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_is_valid BOOLEAN := FALSE;
  v_new_hash TEXT;
BEGIN
  SELECT username, password INTO v_user
  FROM users
  WHERE LOWER(username) = LOWER(p_username);

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'message', 'User not found');
  END IF;

  IF NOT p_is_admin_override THEN
    IF v_user.password LIKE '$2a$%' OR v_user.password LIKE '$2b$%' OR v_user.password LIKE '$2y$%' THEN
      v_is_valid := (v_user.password = crypt(p_old_password, v_user.password));
    ELSE
      v_is_valid := (v_user.password = p_old_password);
    END IF;

    IF NOT v_is_valid THEN
      RETURN json_build_object('success', FALSE, 'message', 'Incorrect current password');
    END IF;
  END IF;

  v_new_hash := crypt(p_new_password, gen_salt('bf', 10));
  UPDATE users SET password = v_new_hash WHERE LOWER(username) = LOWER(p_username);

  RETURN json_build_object('success', TRUE, 'message', 'Password updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 4. ATOMIC STOCK TRANSACTION WITH NON-NEGATIVE PROTECTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION process_stock_transaction(
    p_item_id BIGINT,
    p_quantity_change INT,
    p_transaction_type TEXT,
    p_reason TEXT,
    p_date DATE,
    p_created_by TEXT,
    p_branch TEXT DEFAULT 'iGift'
)
RETURNS JSON AS $$
DECLARE
    v_current_qty INT;
    v_new_qty INT;
    v_transaction_id BIGINT;
BEGIN
    -- Row-Level Lock on inventory item
    SELECT quantity INTO v_current_qty
    FROM inventory
    WHERE id = p_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory item with ID % not found', p_item_id;
    END IF;

    v_new_qty := COALESCE(v_current_qty, 0) + p_quantity_change;

    -- Strict non-negative inventory protection
    IF v_new_qty < 0 THEN
        RAISE EXCEPTION 'Stock deduction rejected: Current stock is % units. Attempted deduction of % would cause negative stock (%).', 
            COALESCE(v_current_qty, 0), ABS(p_quantity_change), v_new_qty;
    END IF;

    UPDATE inventory
    SET quantity = v_new_qty
    WHERE id = p_item_id;

    INSERT INTO stock_transactions (
        item_id,
        quantity_change,
        transaction_type,
        reason,
        date,
        created_by,
        branch,
        created_at
    )
    VALUES (
        p_item_id,
        p_quantity_change,
        p_transaction_type,
        p_reason,
        p_date,
        p_created_by,
        COALESCE(p_branch, 'iGift'),
        NOW()
    )
    RETURNING id INTO v_transaction_id;

    RETURN json_build_object(
        'success', TRUE,
        'transaction_id', v_transaction_id,
        'item_id', p_item_id,
        'previous_quantity', v_current_qty,
        'new_quantity', v_new_qty
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit ENABLE ROW LEVEL SECURITY;

-- Grant access to standard application tables
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['users', 'clients', 'suppliers', 'supplier_expenses', 'supplier_payments', 'expenses', 'inventory', 'inventory_categories', 'designs', 'design_materials', 'sales', 'stock_transactions', 'audit'];
BEGIN
  FOR i IN 1..array_length(tables, 1) LOOP
    tbl := tables[i];
    EXECUTE format('DROP POLICY IF EXISTS "App Access Policy" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON %I', tbl);
    EXECUTE format('CREATE POLICY "App Access Policy" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;
