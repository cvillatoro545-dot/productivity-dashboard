const { neon } = require("@neondatabase/serverless");

require("dotenv").config({ path: ".env.local" });

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set in .env.local");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  console.log("🔄 Running migrations...");

  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
      status TEXT CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
      due_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✅ tasks table ready");

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
  console.log("✅ habits table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id SERIAL PRIMARY KEY,
      habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
      completed_date DATE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(habit_id, completed_date)
    )
  `;
  console.log("✅ habit_logs table ready");

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
  console.log("✅ notes table ready");

  console.log("\n🎉 All migrations complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
