import { NextRequest, NextResponse } from "next/server";
import { sql, initializeDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initializeDatabase();
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Get last 7 days for weekly grid
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const habits = await sql`
      SELECT
        h.*,
        COUNT(hl.id) FILTER (WHERE hl.completed_date >= ${thirtyDaysAgo}) AS completions_30d,
        BOOL_OR(hl.completed_date = ${today}) AS completed_today,
        ARRAY_AGG(hl.completed_date ORDER BY hl.completed_date DESC) FILTER (WHERE hl.completed_date >= ${sevenDaysAgo}) AS week_logs
      FROM habits h
      LEFT JOIN habit_logs hl ON h.id = hl.habit_id
      GROUP BY h.id
      ORDER BY h.category, h.created_at ASC
    `;

    const habitsWithStats = habits.map((h) => ({
      ...h,
      completedToday: h.completed_today ?? false,
      completionRate: Math.round((Number(h.completions_30d) / 30) * 100),
      weekLogs: h.week_logs || [],
    }));

    return NextResponse.json(habitsWithStats);
  } catch (error) {
    console.error("GET /api/habits error:", error);
    return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    const body = await req.json();
    const { name, description, color = "#D4A853", icon = "✦", category = "daily", weekly_goal = 7 } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const [habit] = await sql`
      INSERT INTO habits (name, description, color, icon, category, weekly_goal)
      VALUES (${name.trim()}, ${description || null}, ${color}, ${icon}, ${category}, ${weekly_goal})
      RETURNING *
    `;
    return NextResponse.json({ ...habit, completedToday: false, completionRate: 0, weekLogs: [] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/habits error:", error);
    return NextResponse.json({ error: "Failed to create habit" }, { status: 500 });
  }
}
