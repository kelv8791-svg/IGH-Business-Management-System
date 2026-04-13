-- COMPREHENSIVE FIX: Missing Branch Column and Schema Cache Refresh
-- Run this in your Supabase SQL Editor

-- 1. Add missing branch column to inventory_categories
ALTER TABLE inventory_categories 
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- 2. Ensure existing records have a branch assigned (to prevent them from being hidden)
UPDATE inventory_categories SET branch = 'IGH' WHERE branch IS NULL;

-- 3. FORCE REFRESH THE SUPABASE SCHEMA CACHE
-- This fixes the error: "Could not find column 'branch' in schema cache"
NOTIFY pgrst, 'reload schema';

-- Verification (Optional)
-- SELECT * FROM inventory_categories LIMIT 5;
