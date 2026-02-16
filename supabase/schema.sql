-- Supabase / Postgres schema for IGH BMS (initial)
-- Run in Supabase SQL Editor to create tables before migration

-- Users: username is primary key
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  email TEXT,
  password TEXT,
  role TEXT,
  pref_compact BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS clients (
  id INT PRIMARY KEY,
  name TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INT PRIMARY KEY,
  name TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  kra TEXT,
  credit NUMERIC
);

CREATE TABLE IF NOT EXISTS supplier_expenses (
  id INT PRIMARY KEY,
  date DATE,
  supplier INT REFERENCES suppliers(id) ON DELETE SET NULL,
  type TEXT,
  amount NUMERIC,
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id INT PRIMARY KEY,
  date DATE,
  cat TEXT,
  amount NUMERIC,
  desc TEXT
);

CREATE TABLE IF NOT EXISTS inventory (
  id INT PRIMARY KEY,
  name TEXT,
  sku TEXT,
  category TEXT,
  quantity INT,
  reorderLevel INT,
  unitPrice NUMERIC,
  supplier INT REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS designs (
  id INT PRIMARY KEY,
  title TEXT,
  client TEXT,
  assignedTo TEXT REFERENCES users(username) ON DELETE SET NULL,
  status TEXT,
  paymentStatus TEXT,
  paymentAmount NUMERIC,
  paymentDate DATE,
  notes TEXT,
  handed_over BOOLEAN DEFAULT FALSE,
  handed_over_date DATE
);

CREATE TABLE IF NOT EXISTS sales (
  id INT PRIMARY KEY,
  date DATE,
  client TEXT,
  dept TEXT,
  amount NUMERIC,
  desc TEXT,
  paymentMethod TEXT,
  paymentRef TEXT,
  paymentStatus TEXT,
  source TEXT,
  designId INT REFERENCES designs(id) ON DELETE SET NULL
  ,handed_over BOOLEAN DEFAULT FALSE,
  handed_over_date DATE
);

CREATE TABLE IF NOT EXISTS audit (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "user" TEXT,
  action TEXT,
  module TEXT,
  details TEXT
);
