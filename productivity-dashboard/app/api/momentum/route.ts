import { NextResponse } from "next/server";
import { sql, initializeDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initializeDatabase();
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Tasks completed today
    const [taskToday] = await sql`
      SELECT COUNT(*) AS count FROM tasks
      WHERE status = 'done' AND updated_at::date = ${today}::date
    `;

    // Tasks completed this week
    const [taskWeek] = await sql`
      SELECT COUNT(*) AS count FROM tasks
      WHERE status = 'done' AND updated_at >= NOW() - INTERVAL '7 days'
    `;

    // Total active tasks
    const [taskTotal] = await sql`
      SELECT COUNT(*) AS count FROM tasks WHERE status != 'done'
    `;

    // Habits completed today
    const [habitToday] = await sql`
      SELECT COUNT(*) AS count FROM habit_logs WHERE completed_date = ${today}
    `;

    // Total habits
    const [habitTotal] = await sql`SELECT COUNT(*) AS count FROM habits`;

    // Workout this week
    const [workoutWeek] = await sql`
      SELECT COUNT(*) AS count FROM gym_logs
      WHERE workout_date >= ${weekAgo}::date
    `;

    // Journal entry today
    const [journalToday] = await sql`
      SELECT COUNT(*) AS count FROM journal_entries
      WHERE entry_date = ${today}::date
    `;

    // Books currently reading
    const [booksReading] = await sql`
      SELECT COUNT(*) AS count FROM books WHERE status = 'reading'
    `;

    // Compute momentum score (0-100)
    const tasksScore = Math.min(Number(taskToday.count) * 15, 30); // max 30pts
    const habitsScore = habitTotal.count > 0
      ? Math.round((Number(habitToday.count) / Number(habitTotal.count)) * 25)
      : 0; // max 25pts
    const workoutScore = Math.min(Number(workoutWeek.count) * 5, 20); // max 20pts
    const journalScore = Number(journalToday.count) > 0 ? 15 : 0; // 15pts
    const readingScore = Number(booksReading.count) > 0 ? 10 : 0; // 10pts

    const momentum = Math.min(tasksScore + habitsScore + workoutScore + journalScore + readingScore, 100);

    // Contextual subtitle
    const tasksTodo = Number(taskTotal.count);
    const habitsLeft = Math.max(0, Number(habitTotal.count) - Number(habitToday.count));
    const habitsPct = habitTotal.count > 0
      ? Math.round((Number(habitToday.count) / Number(habitTotal.count)) * 100)
      : 0;
    const weeklyTasksDone = Number(taskWeek.count);

    let subtitle = "Ready to build momentum today.";
    if (tasksTodo === 0 && habitsLeft === 0) {
      subtitle = "All clear. Exceptional day, Chris.";
    } else if (habitsLeft === 1) {
      subtitle = "One habit left today. Finish strong.";
    } else if (habitsLeft === 0 && tasksTodo > 0) {
      subtitle = `Habits done. ${tasksTodo} task${tasksTodo > 1 ? "s" : ""} remaining.`;
    } else if (tasksTodo > 0 && habitsPct >= 80) {
      subtitle = `${habitsPct}% of habits done. ${tasksTodo} task${tasksTodo > 1 ? "s" : ""} left.`;
    } else if (weeklyTasksDone > 0) {
      subtitle = `${weeklyTasksDone} task${weeklyTasksDone > 1 ? "s" : ""} completed this week. Keep building.`;
    } else if (tasksTodo > 0) {
      subtitle = `${tasksTodo} task${tasksTodo > 1 ? "s" : ""} waiting. Let's get moving.`;
    }

    return NextResponse.json({
      momentum,
      subtitle,
      breakdown: {
        tasks: tasksScore,
        habits: habitsScore,
        workouts: workoutScore,
        journal: journalScore,
        reading: readingScore,
      },
      raw: {
        tasksTodayDone: Number(taskToday.count),
        tasksTodo,
        habitsToday: Number(habitToday.count),
        habitsTotal: Number(habitTotal.count),
        workoutsThisWeek: Number(workoutWeek.count),
        hasJournalToday: Number(journalToday.count) > 0,
      },
    });
  } catch (error) {
    console.error("Momentum error:", error);
    return NextResponse.json({
      momentum: 0,
      subtitle: "Ready to build momentum today.",
      breakdown: { tasks: 0, habits: 0, workouts: 0, journal: 0, reading: 0 },
      raw: { tasksTodayDone: 0, tasksTodo: 0, habitsToday: 0, habitsTotal: 0, workoutsThisWeek: 0, hasJournalToday: false },
    });
  }
}
