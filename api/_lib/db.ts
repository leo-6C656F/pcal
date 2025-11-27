/**
 * Database utility functions for Vercel Postgres
 * Handles cloud sync operations for PCAL data
 */

import { sql } from '@vercel/postgres';

export interface DBChild {
  id: string;
  user_id: string;
  name: string;
  center: string;
  teacher: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface DBDailyEntry {
  id: string;
  user_id: string;
  date: string;
  child_id: string;
  lines: any; // JSONB
  signature_base64: string | null;
  ai_summary: string | null;
  ai_summary_provider: string | null;
  is_locked: boolean;
  emailed_at: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface DBGoal {
  code: number;
  user_id: string;
  description: string;
  activities: any; // JSONB
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface SyncData {
  children: Array<{
    id: string;
    name: string;
    center: string;
    teacher: string;
  }>;
  dailyEntries: Array<{
    id: string;
    date: string;
    childId: string;
    lines: any[];
    signatureBase64?: string;
    aiSummary?: string;
    aiSummaryProvider?: string;
    isLocked: boolean;
    emailedAt?: number;
  }>;
  goals: Array<{
    code: number;
    description: string;
    activities: string[];
  }>;
}

/**
 * Initialize database tables (runs schema)
 * Call this once to set up the database
 */
export async function initializeDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        clerk_user_id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_sync_at TIMESTAMP
      )
    `;

    // Create children table
    await sql`
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
      )
    `;

    // Create daily_entries table
    await sql`
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
      )
    `;

    // Create goals table
    await sql`
      CREATE TABLE IF NOT EXISTS goals (
        code INTEGER NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        activities JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL,
        PRIMARY KEY (user_id, code)
      )
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id) WHERE deleted_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_entries_user_id ON daily_entries(user_id) WHERE deleted_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(user_id, date) WHERE deleted_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_daily_entries_child_id ON daily_entries(user_id, child_id) WHERE deleted_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id) WHERE deleted_at IS NULL`;

    console.log('[DB] Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('[DB] Initialization error:', error);
    throw error;
  }
}

/**
 * Ensure user exists in database
 */
export async function ensureUser(userId: string) {
  await sql`
    INSERT INTO users (clerk_user_id)
    VALUES (${userId})
    ON CONFLICT (clerk_user_id) DO NOTHING
  `;
}

/**
 * Sync children data from client to cloud
 */
export async function syncChildren(userId: string, children: SyncData['children']) {
  await ensureUser(userId);

  for (const child of children) {
    await sql`
      INSERT INTO children (id, user_id, name, center, teacher)
      VALUES (${child.id}, ${userId}, ${child.name}, ${child.center}, ${child.teacher})
      ON CONFLICT (user_id, id)
      DO UPDATE SET
        name = EXCLUDED.name,
        center = EXCLUDED.center,
        teacher = EXCLUDED.teacher,
        deleted_at = NULL
    `;
  }
}

/**
 * Sync daily entries from client to cloud
 */
export async function syncDailyEntries(userId: string, entries: SyncData['dailyEntries']) {
  await ensureUser(userId);

  for (const entry of entries) {
    await sql`
      INSERT INTO daily_entries (
        id, user_id, date, child_id, lines,
        signature_base64, ai_summary, ai_summary_provider,
        is_locked, emailed_at
      )
      VALUES (
        ${entry.id}, ${userId}, ${entry.date}, ${entry.childId},
        ${JSON.stringify(entry.lines)}::jsonb,
        ${entry.signatureBase64 || null}, ${entry.aiSummary || null},
        ${entry.aiSummaryProvider || null}, ${entry.isLocked},
        ${entry.emailedAt || null}
      )
      ON CONFLICT (user_id, id)
      DO UPDATE SET
        date = EXCLUDED.date,
        child_id = EXCLUDED.child_id,
        lines = EXCLUDED.lines,
        signature_base64 = EXCLUDED.signature_base64,
        ai_summary = EXCLUDED.ai_summary,
        ai_summary_provider = EXCLUDED.ai_summary_provider,
        is_locked = EXCLUDED.is_locked,
        emailed_at = EXCLUDED.emailed_at,
        deleted_at = NULL
    `;
  }
}

/**
 * Sync goals from client to cloud
 */
export async function syncGoals(userId: string, goals: SyncData['goals']) {
  await ensureUser(userId);

  for (const goal of goals) {
    await sql`
      INSERT INTO goals (code, user_id, description, activities)
      VALUES (${goal.code}, ${userId}, ${goal.description}, ${JSON.stringify(goal.activities)}::jsonb)
      ON CONFLICT (user_id, code)
      DO UPDATE SET
        description = EXCLUDED.description,
        activities = EXCLUDED.activities,
        deleted_at = NULL
    `;
  }
}

/**
 * Get all children for a user
 */
export async function getChildren(userId: string): Promise<SyncData['children']> {
  const result = await sql<DBChild>`
    SELECT id, name, center, teacher
    FROM children
    WHERE user_id = ${userId} AND deleted_at IS NULL
    ORDER BY created_at ASC
  `;

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    center: row.center,
    teacher: row.teacher,
  }));
}

/**
 * Get all daily entries for a user
 */
export async function getDailyEntries(userId: string): Promise<SyncData['dailyEntries']> {
  const result = await sql<DBDailyEntry>`
    SELECT
      id, date, child_id, lines, signature_base64,
      ai_summary, ai_summary_provider, is_locked, emailed_at
    FROM daily_entries
    WHERE user_id = ${userId} AND deleted_at IS NULL
    ORDER BY date DESC
  `;

  return result.rows.map(row => ({
    id: row.id,
    date: row.date,
    childId: row.child_id,
    lines: row.lines,
    signatureBase64: row.signature_base64 || undefined,
    aiSummary: row.ai_summary || undefined,
    aiSummaryProvider: row.ai_summary_provider || undefined,
    isLocked: row.is_locked,
    emailedAt: row.emailed_at || undefined,
  }));
}

/**
 * Get all goals for a user
 */
export async function getGoals(userId: string): Promise<SyncData['goals']> {
  const result = await sql<DBGoal>`
    SELECT code, description, activities
    FROM goals
    WHERE user_id = ${userId} AND deleted_at IS NULL
    ORDER BY code ASC
  `;

  return result.rows.map(row => ({
    code: row.code,
    description: row.description,
    activities: row.activities,
  }));
}

/**
 * Update last sync timestamp for user
 */
export async function updateLastSync(userId: string) {
  await sql`
    UPDATE users
    SET last_sync_at = CURRENT_TIMESTAMP
    WHERE clerk_user_id = ${userId}
  `;
}

/**
 * Delete all data for a user (for testing/cleanup)
 */
export async function deleteUserData(userId: string) {
  await sql`DELETE FROM journal_events WHERE user_id = ${userId}`;
  await sql`DELETE FROM goals WHERE user_id = ${userId}`;
  await sql`DELETE FROM daily_entries WHERE user_id = ${userId}`;
  await sql`DELETE FROM children WHERE user_id = ${userId}`;
  await sql`DELETE FROM users WHERE clerk_user_id = ${userId}`;
}
