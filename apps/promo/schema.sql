-- Zentro AI Waitlist schema for Cloudflare D1
-- Run: wrangler d1 execute DB --local --file=./schema.sql
-- For production: wrangler d1 execute DB --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  company TEXT,
  usecase TEXT,
  source TEXT DEFAULT 'promo',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);
