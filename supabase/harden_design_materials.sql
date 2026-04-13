-- Hardening: Add Branch Column to Design Materials for strict isolation
-- Run this in your Supabase SQL Editor

ALTER TABLE design_materials 
ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'IGH';

-- Update existing records if any
UPDATE design_materials SET branch = 'IGH' WHERE branch IS NULL;

-- Refresh cache
NOTIFY pgrst, 'reload schema';
