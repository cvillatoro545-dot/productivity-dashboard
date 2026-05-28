# Focus — Personal Productivity Dashboard

A refined personal productivity workspace built with Next.js 14 App Router, Neon Postgres, and deployed on Vercel.

## Features

- **Tasks** — Create, prioritize (high/medium/low), track status (todo → in progress → done), set due dates with overdue warnings
- **Habits** — Daily habit tracking with 30-day completion rate, customizable icons and colors
- **Notes** — Masonry-layout notes with tagging, pinning, and tag-based filtering
- **Stats Bar** — Live dashboard showing task completion rate, active tasks, habits done today, and note count
- **Persistent storage** — All data saved to Neon Postgres via serverless driver
- **Auto-migration** — Tables created automatically on first request (no manual SQL needed)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Neon Postgres (serverless) |
| Fonts | Playfair Display + DM Sans + DM Mono |
| Deployment | Vercel |

---

## Local Development

### 1. Clone and install

```bash
git clone <your-repo>
cd productivity-dashboard
npm install
```

### 2. Set up Neon Postgres

1. Go to [console.neon.tech](https://console.neon.tech) and create a free account
2. Create a new project (e.g., "productivity-dashboard")
3. Copy the connection string from **Dashboard → Connection Details**
   - Select **Pooled connection** → copy the string

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### 4. Run migrations (optional)

Tables are auto-created on first request, but you can run manually:

```bash
npm run db:migrate
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### Option A: Vercel + Neon Integration (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project → select your repo
3. In Vercel project settings → **Storage** → **Connect Database** → select **Neon**
4. Vercel will automatically add `DATABASE_URL` to your environment variables
5. Deploy — done!

### Option B: Manual Environment Variable

1. Push to GitHub and import to Vercel
2. In Vercel project settings → **Environment Variables**
3. Add `DATABASE_URL` with your Neon connection string
4. Deploy

> **Note**: Use the **pooled connection string** from Neon for serverless environments (it starts with `postgresql://` and contains `pooler` in the hostname).

---

## Project Structure

```
productivity-dashboard/
├── app/
│   ├── api/
│   │   ├── tasks/
│   │   │   ├── route.ts          # GET all, POST create
│   │   │   └── [id]/route.ts     # PATCH update, DELETE
│   │   ├── habits/
│   │   │   ├── route.ts          # GET all, POST create
│   │   │   └── [id]/route.ts     # POST toggle today, DELETE
│   │   ├── notes/
│   │   │   ├── route.ts          # GET all, POST create
│   │   │   └── [id]/route.ts     # PATCH update, DELETE
│   │   └── stats/route.ts        # GET dashboard stats
│   ├── dashboard/page.tsx        # Main dashboard page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Redirects to /dashboard
├── components/
│   ├── Header.tsx
│   ├── StatsBar.tsx
│   ├── TasksPanel.tsx
│   ├── HabitsPanel.tsx
│   └── NotesPanel.tsx
├── lib/
│   ├── db.ts                     # Neon connection + table init
│   └── types.ts                  # Shared TypeScript types
├── scripts/
│   └── migrate.js                # Manual migration script
└── ...config files
```

---

## Database Schema

```sql
-- Tasks
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits
CREATE TABLE habits (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#D4A853',
  icon TEXT DEFAULT '✦',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit completion logs
CREATE TABLE habit_logs (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, completed_date)
);

-- Notes
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
