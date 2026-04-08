-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS inventory_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON inventory_categories FOR ALL USING (true) WITH CHECK (true);
