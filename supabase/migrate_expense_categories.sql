-- Migration: Replace 'Utilities' with 'Petty Cash' and 'Office' with 'Internet'
-- This script updates existing expense records in the Supabase database.

-- Update 'Utilities' to 'Petty Cash'
UPDATE expenses 
SET cat = 'Petty Cash' 
WHERE cat = 'Utilities';

-- Update 'Office' to 'Internet'
UPDATE expenses 
SET cat = 'Internet' 
WHERE cat = 'Office';
