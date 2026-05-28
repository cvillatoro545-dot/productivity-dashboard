import { NextResponse } from "next/server";
import { sql, initializeDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initializeDatabase();
    const today = new Date().toISOString().split("T")[0];

    const [taskStats] = await sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'done') AS done,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'todo') AS todo
      FROM tasks
    `;

    const [habitStats] = await sql`
      SELECT
        COUNT(DISTINCT h.id) AS total,
        COUNT(DISTINCT hl.habit_id) FILTER (WHERE hl.completed_date = ${today}) AS completed_today
      FROM habits h
      LEFT JOIN habit_logs hl ON h.id = hl.habit_id
    `;

    const [noteStats] = await sql`SELECT COUNT(*) AS total FROM notes`;

    const tasksTotal = Number(taskStats.total);
    const tasksDone = Number(taskStats.done);

    return NextResponse.json({
      tasksTotal,
      tasksDone,
      tasksInProgress: Number(taskStats.in_progress),
      tasksTodo: Number(taskStats.todo),
      habitsTotal: Number(habitStats.total),
      habitsCompletedToday: Number(habitStats.completed_today),
      notesTotal: Number(noteStats.total),
      taskCompletionRate: tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
