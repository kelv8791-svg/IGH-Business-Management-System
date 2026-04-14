-- Add qty_sold column to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS qty_sold NUMERIC DEFAULT 0;
