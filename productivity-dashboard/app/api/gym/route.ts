import { NextRequest, NextResponse } from "next/server";
import { sql, initializeDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initializeDatabase();
    const logs = await sql`SELECT * FROM gym_logs ORDER BY workout_date DESC LIMIT 90`;
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch gym logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    const body = await req.json();
    const { workout_date, notes } = body;
    const date = workout_date || new Date().toISOString().split("T")[0];
    
    // Toggle: if already logged, remove it
    const existing = await sql`SELECT id FROM gym_logs WHERE workout_date = ${date}`;
    if (existing.length > 0) {
      await sql`DELETE FROM gym_logs WHERE workout_date = ${date}`;
      return NextResponse.json({ logged: false });
    }
    const [log] = await sql`
      INSERT INTO gym_logs (workout_date, notes) VALUES (${date}, ${notes || null})
      ON CONFLICT (workout_date) DO UPDATE SET notes = EXCLUDED.notes
      RETURNING *
    `;
    return NextResponse.json({ logged: true, ...log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to log workout" }, { status: 500 });
  }
}
