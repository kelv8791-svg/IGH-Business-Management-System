-- Add missing 'date' and 'source' columns to designs table
-- Run this in Supabase SQL Editor

ALTER TABLE designs ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS source TEXT;

NOTIFY pgrst, 'reload schema';
