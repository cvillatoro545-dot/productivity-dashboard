import { NextRequest, NextResponse } from "next/server";
import { sql, initializeDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initializeDatabase();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const goals = await sql`
      SELECT g.*,
        COALESCE(SUM(gl.amount) FILTER (WHERE TO_CHAR(gl.log_date, 'YYYY-MM') = ${currentMonth}), 0) AS monthly_contributed
      FROM goals g
      LEFT JOIN goal_logs gl ON g.id = gl.goal_id
      GROUP BY g.id
      ORDER BY g.created_at ASC
    `;
    return NextResponse.json(goals);
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    const body = await req.json();
    const { title, category, goal_type, target_amount, monthly_target, target_date, color = "#D4A853", notes } = body;
    if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
    const [goal] = await sql`
      INSERT INTO goals (title, category, goal_type, target_amount, monthly_target, target_date, color, notes)
      VALUES (${title}, ${category || 'other'}, ${goal_type || 'custom'}, ${target_amount || null}, ${monthly_target || null}, ${target_date || null}, ${color}, ${notes || null})
      RETURNING *
    `;
    return NextResponse.json({ ...goal, monthly_contributed: 0 }, { status: 201 });
  } catch (error) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
