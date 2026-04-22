-- Add inventory_item_id to sales table to link sales with inventory
ALTER TABLE sales ADD COLUMN IF NOT EXISTS inventory_item_id BIGINT REFERENCES inventory(id);

-- Log this change in the audit table if possible, or just leave it for the user to run.
-- This script should be run in the Supabase SQL Editor.
