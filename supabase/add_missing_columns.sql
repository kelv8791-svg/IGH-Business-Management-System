-- Add missing columns to match frontend forms
-- Run this in Supabase SQL Editor

-- Clients: Add 'location' column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS location TEXT;

-- Verify other tables (preventative)
-- Sales: 'source' and 'handed_over' were already in schema.sql, assume they are present.
-- Designs: 'handed_over' was in schema.sql.
