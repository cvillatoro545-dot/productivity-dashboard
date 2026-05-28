import { NextRequest, NextResponse } from "next/server";
import { sql, initializeDatabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7");

    // Track task completions by date using habit_logs as proxy for habits
    // and a new task_completions approach using updated_at cast to date
    const taskCompletions = await sql`
      SELECT
        updated_at::date AS completion_date,
        COUNT(*) AS count
      FROM tasks
      WHERE status = 'done'
        AND updated_at >= NOW() - (${days} || ' days')::interval
      GROUP BY updated_at::date
      ORDER BY completion_date ASC
    `;

    const habitCompletions = await sql`
      SELECT
        completed_date AS completion_date,
        COUNT(*) AS count
      FROM habit_logs
      WHERE completed_date >= CURRENT_DATE - ${days}
      GROUP BY completed_date
      ORDER BY completion_date ASC
    `;

    return NextResponse.json({ tasks: taskCompletions, habits: habitCompletions });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
