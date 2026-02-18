CREATE TABLE IF NOT EXISTS design_materials (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  design_id BIGINT REFERENCES designs(id) ON DELETE CASCADE,
  item_id BIGINT REFERENCES inventory(id) ON DELETE CASCADE,
  quantity_used INT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by TEXT
);

ALTER TABLE design_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON design_materials FOR ALL USING (true) WITH CHECK (true);
