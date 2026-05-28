import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const sql = neon(process.env.DATABASE_URL);

export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
      status TEXT CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
      sort_order INTEGER DEFAULT 0,
      due_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#D4A853',
      icon TEXT DEFAULT '✦',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id SERIAL PRIMARY KEY,
      habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
      completed_date DATE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(habit_id, completed_date)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      tags TEXT[] DEFAULT '{}',
      pinned BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT CHECK (category IN ('financial', 'fitness', 'other')) DEFAULT 'other',
      goal_type TEXT CHECK (goal_type IN ('roth_ira', 'emergency_fund', 'gym', 'custom')) DEFAULT 'custom',
      target_amount NUMERIC,
      current_amount NUMERIC DEFAULT 0,
      monthly_target NUMERIC,
      target_date DATE,
      color TEXT DEFAULT '#D4A853',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS goal_logs (
      id SERIAL PRIMARY KEY,
      goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
      amount NUMERIC,
      log_date DATE NOT NULL DEFAULT CURRENT_DATE,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS gym_logs (
      id SERIAL PRIMARY KEY,
      workout_date DATE NOT NULL UNIQUE,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id SERIAL PRIMARY KEY,
      entry_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
      mood INTEGER CHECK (mood BETWEEN 1 AND 5),
      content TEXT,
      gratitude TEXT,
      intentions TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      ol_key TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      cover_url TEXT,
      year INTEGER,
      status TEXT CHECK (status IN ('want_to_read', 'reading', 'read', 'dnf')) DEFAULT 'want_to_read',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Add sort_order column if it doesn't exist (for existing deployments)
  await sql`
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
  `;
}

export async function initializeQuarterTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS quarterly_goals (
      id SERIAL PRIMARY KEY,
      quarter_key TEXT NOT NULL,
      category TEXT CHECK (category IN ('Finance', 'Health', 'Business', 'Personal')) DEFAULT 'Personal',
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS credit_cards (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      balance NUMERIC DEFAULT 0,
      original_balance NUMERIC DEFAULT 0,
      credit_limit NUMERIC DEFAULT 0,
      color TEXT DEFAULT '#D4A853',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      quarter_key TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS parking_lot (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      done BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE habits ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'daily'
  `;

  await sql`
    ALTER TABLE habits ADD COLUMN IF NOT EXISTS weekly_goal INTEGER DEFAULT 7
  `;
}
