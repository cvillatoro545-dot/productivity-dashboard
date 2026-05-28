import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const habitId = parseInt(params.id);
    const today = new Date().toISOString().split("T")[0];

    // Toggle: if already logged today, remove it
    const existing = await sql`
      SELECT id FROM habit_logs WHERE habit_id = ${habitId} AND completed_date = ${today}
    `;

    if (existing.length > 0) {
      await sql`DELETE FROM habit_logs WHERE habit_id = ${habitId} AND completed_date = ${today}`;
      return NextResponse.json({ completed: false });
    } else {
      await sql`
        INSERT INTO habit_logs (habit_id, completed_date) VALUES (${habitId}, ${today})
        ON CONFLICT (habit_id, completed_date) DO NOTHING
      `;
      return NextResponse.json({ completed: true });
    }
  } catch (error) {
    console.error("POST /api/habits/[id]/log error:", error);
    return NextResponse.json({ error: "Failed to log habit" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await sql`DELETE FROM habits WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/habits/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 });
  }
}
