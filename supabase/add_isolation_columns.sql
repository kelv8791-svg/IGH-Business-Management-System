-- Add branch support for strict data isolation
ALTER TABLE clients ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE supplier_expenses ADD COLUMN IF NOT EXISTS branch TEXT;

-- Add designId to direct expenses for IGH Out-of-pocket workflow
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "designId" BIGINT REFERENCES designs(id) ON DELETE SET NULL;

-- Automatically assign legacy unassigned records to IGH to prevent them from disappearing
UPDATE clients SET branch = 'IGH' WHERE branch IS NULL;
UPDATE suppliers SET branch = 'IGH' WHERE branch IS NULL;
UPDATE supplier_expenses SET branch = 'IGH' WHERE branch IS NULL;
