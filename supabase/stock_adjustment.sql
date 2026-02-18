CREATE TABLE IF NOT EXISTS stock_transactions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  item_id BIGINT REFERENCES inventory(id) ON DELETE CASCADE,
  quantity_change INT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'RESTOCK', 'VARIANCE', 'ADJUSTMENT'
  reason TEXT, -- 'Spoilt', 'Expired', 'Damaged', 'Restock', 'Correction'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT
);

ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON stock_transactions FOR ALL USING (true) WITH CHECK (true);
