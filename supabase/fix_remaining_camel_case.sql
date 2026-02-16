-- Fix remaining camelCase columns to match frontend
-- Run this in Supabase SQL Editor

-- SALES Table
DO $$
BEGIN
    -- paymentRef
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='paymentref') THEN
        ALTER TABLE sales RENAME COLUMN paymentref TO "paymentRef";
    END IF;
    -- paymentStatus
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='paymentstatus') THEN
        ALTER TABLE sales RENAME COLUMN paymentstatus TO "paymentStatus";
    END IF;
    -- designId (Ensure it matches)
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='designid') THEN
        ALTER TABLE sales RENAME COLUMN designid TO "designId";
    END IF;
END $$;

-- DESIGNS Table
DO $$
BEGIN
    -- assignedTo
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='designs' AND column_name='assignedto') THEN
        ALTER TABLE designs RENAME COLUMN assignedto TO "assignedTo";
    END IF;
    -- paymentStatus
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='designs' AND column_name='paymentstatus') THEN
        ALTER TABLE designs RENAME COLUMN paymentstatus TO "paymentStatus";
    END IF;
    -- paymentAmount
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='designs' AND column_name='paymentamount') THEN
        ALTER TABLE designs RENAME COLUMN paymentamount TO "paymentAmount";
    END IF;
    -- paymentDate
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='designs' AND column_name='paymentdate') THEN
        ALTER TABLE designs RENAME COLUMN paymentdate TO "paymentDate";
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
