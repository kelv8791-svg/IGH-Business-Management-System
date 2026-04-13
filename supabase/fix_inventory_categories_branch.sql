-- Fix Missing Branch Column in Inventory Categories
-- Run this in your Supabase SQL Editor

ALTER TABLE inventory_categories 
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- Update policies to include branch filtering if needed (though currently it's "Public Access")
-- DROP POLICY IF EXISTS "Public Access" ON inventory_categories;
-- CREATE POLICY "Public Access" ON inventory_categories FOR ALL USING (true) WITH CHECK (true);
