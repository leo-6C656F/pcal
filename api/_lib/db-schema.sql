-- PCAL Cloud Sync Database Schema
-- Vercel Postgres (PostgreSQL compatible)

-- Users table (linked to Clerk user IDs)
CREATE TABLE IF NOT EXISTS users (
  clerk_user_id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sync_at TIMESTAMP
);

-- Children table (synced from IndexedDB)
CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  center TEXT NOT NULL,
  teacher TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL,
  UNIQUE(user_id, id)
);

-- Daily entries table (synced from IndexedDB)
CREATE TABLE IF NOT EXISTS daily_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  child_id TEXT NOT NULL,
  lines JSONB NOT NULL DEFAULT '[]',
  signature_base64 TEXT,
  ai_summary TEXT,
  ai_summary_provider TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  emailed_at BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL,
  UNIQUE(user_id, id)
);

-- Goals table (synced from IndexedDB)
CREATE TABLE IF NOT EXISTS goals (
  code INTEGER NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  activities JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP DEFAULT NULL,
  PRIMARY KEY (user_id, code)
);

-- Journal events table (optional - for advanced sync/audit)
CREATE TABLE IF NOT EXISTS journal_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  checksum TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_id ON daily_entries(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(user_id, date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_daily_entries_child_id ON daily_entries(user_id, child_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_events_user_id ON journal_events(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_events_timestamp ON journal_events(user_id, timestamp);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_children_updated_at ON children;
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_entries_updated_at ON daily_entries;
CREATE TRIGGER update_daily_entries_updated_at BEFORE UPDATE ON daily_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
