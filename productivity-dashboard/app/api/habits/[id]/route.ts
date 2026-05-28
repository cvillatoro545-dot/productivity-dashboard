import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const habitId = parseInt(params.id);
    let date: string;
    try {
      const body = await req.json();
      date = body.date || new Date().toISOString().split("T")[0];
    } catch {
      date = new Date().toISOString().split("T")[0];
    }

    const existing = await sql`SELECT id FROM habit_logs WHERE habit_id = ${habitId} AND completed_date = ${date}`;
    if (existing.length > 0) {
      await sql`DELETE FROM habit_logs WHERE habit_id = ${habitId} AND completed_date = ${date}`;
      return NextResponse.json({ completed: false });
    } else {
      await sql`INSERT INTO habit_logs (habit_id, completed_date) VALUES (${habitId}, ${date}) ON CONFLICT (habit_id, completed_date) DO NOTHING`;
      return NextResponse.json({ completed: true });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to log habit" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM habits WHERE id = ${parseInt(params.id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 });
  }
}
