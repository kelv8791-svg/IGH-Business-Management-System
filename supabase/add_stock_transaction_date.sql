-- Add Date column to Stock Transactions for better accountability
-- Run this in your Supabase SQL Editor

ALTER TABLE stock_transactions 
ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- Optional: Update existing records to have a date based on their created_at timestamp
UPDATE stock_transactions SET date = created_at::date WHERE date IS NULL;

-- Refresh cache
NOTIFY pgrst, 'reload schema';
