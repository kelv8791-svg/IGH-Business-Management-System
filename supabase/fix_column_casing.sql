-- Fix Column Names to match Frontend CamelCase
-- Run this in Supabase SQL Editor

-- 1. DESIGNS: Add missing 'amount' column
ALTER TABLE designs ADD COLUMN IF NOT EXISTS amount NUMERIC;

-- 2. SALES: Fix 'paymentMethod' casing
-- Postgres defaults to lowercase 'paymentmethod', but frontend sends 'paymentMethod'
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='paymentmethod') THEN
        ALTER TABLE sales RENAME COLUMN paymentmethod TO "paymentMethod";
    END IF;
END $$;

-- 3. INVENTORY: Fix 'reorderLevel' and 'unitPrice' casing
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='inventory' AND column_name='reorderlevel') THEN
        ALTER TABLE inventory RENAME COLUMN reorderlevel TO "reorderLevel";
    END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='inventory' AND column_name='unitprice') THEN
        ALTER TABLE inventory RENAME COLUMN unitprice TO "unitPrice";
    END IF;
END $$;

-- 4. CLIENTS: Fix 'location' (if needed, simpler to just ensure it exists)
-- We added it as 'location' (lowercase) previously. Frontend uses 'location'. This is fine.

-- 5. RELOAD SCHEMA CACHE
-- (Supabase does this automatically, but good to know)
NOTIFY pgrst, 'reload schema';
