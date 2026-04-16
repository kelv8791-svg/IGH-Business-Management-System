-- SQL Migration: Add Supplier Tracking & SOA Features
-- Run this in the Supabase SQL Editor

-- 1. Modify supplier_expenses table
ALTER TABLE supplier_expenses 
ADD COLUMN IF NOT EXISTS inventory_item_id BIGINT REFERENCES inventory(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Paid',
ADD COLUMN IF NOT EXISTS quantity INT;

-- 2. Create supplier_payments table
CREATE TABLE IF NOT EXISTS supplier_payments (
  id BIGSERIAL PRIMARY KEY,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT,
  reference TEXT,
  branch TEXT DEFAULT 'IGH',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Enable RLS and add policies for supplier_payments
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'supplier_payments' AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access" ON supplier_payments FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
