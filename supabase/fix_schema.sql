-- Fix Schema Types: Convert IDs from INT to BIGINT
-- Run this in Supabase SQL Editor to ensure all ID columns can hold Date.now() values

-- Users (username is text - no change needed)

-- Clients
ALTER TABLE clients ALTER COLUMN id TYPE BIGINT;

-- Suppliers
ALTER TABLE suppliers ALTER COLUMN id TYPE BIGINT;

-- Supplier Expenses
ALTER TABLE supplier_expenses ALTER COLUMN id TYPE BIGINT;
ALTER TABLE supplier_expenses ALTER COLUMN supplier TYPE BIGINT;

-- Expenses
ALTER TABLE expenses ALTER COLUMN id TYPE BIGINT;

-- Inventory
ALTER TABLE inventory ALTER COLUMN id TYPE BIGINT;
ALTER TABLE inventory ALTER COLUMN supplier TYPE BIGINT;

-- Designs
ALTER TABLE designs ALTER COLUMN id TYPE BIGINT;

-- Sales
ALTER TABLE sales ALTER COLUMN id TYPE BIGINT;

-- Fix for foreign keys
-- Postgres lowercases unquoted identifiers, so 'designId' became 'designid'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'designid') THEN
        ALTER TABLE sales ALTER COLUMN designid TYPE BIGINT;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'designId') THEN
        ALTER TABLE sales ALTER COLUMN "designId" TYPE BIGINT;
    END IF;
END $$;
