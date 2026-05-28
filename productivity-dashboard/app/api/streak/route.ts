import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

async function initStreak() {
  await sql`
    CREATE TABLE IF NOT EXISTS activity_streak (
      id SERIAL PRIMARY KEY,
      activity_date DATE NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET() {
  try {
    await initStreak();

    // Log today's activity
    const today = new Date().toISOString().split("T")[0];
    await sql`
      INSERT INTO activity_streak (activity_date) VALUES (${today})
      ON CONFLICT (activity_date) DO NOTHING
    `;

    // Calculate current streak
    const logs = await sql`
      SELECT activity_date FROM activity_streak
      ORDER BY activity_date DESC
      LIMIT 365
    `;

    if (logs.length === 0) return NextResponse.json({ streak: 1, longestStreak: 1 });

    let streak = 0;
    let longestStreak = 0;
    let currentRun = 0;
    const dates = logs.map((l: any) => l.activity_date.toISOString().split("T")[0]);

    // Check consecutive days from today backwards
    let checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (dates.includes(dateStr)) {
        if (i === 0 || streak > 0) streak++;
      } else if (i === 0) {
        // Didn't open today yet — check yesterday
        streak = 0;
        break;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate longest streak
    let prev: Date | null = null;
    for (const d of [...dates].reverse()) {
      const curr = new Date(d);
      if (prev === null) {
        currentRun = 1;
      } else {
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          currentRun++;
        } else {
          currentRun = 1;
        }
      }
      longestStreak = Math.max(longestStreak, currentRun);
      prev = curr;
    }

    return NextResponse.json({ streak: Math.max(streak, 1), longestStreak });
  } catch (error) {
    return NextResponse.json({ streak: 1, longestStreak: 1 });
  }
}
