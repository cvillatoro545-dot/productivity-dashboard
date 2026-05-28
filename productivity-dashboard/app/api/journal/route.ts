import { NextRequest, NextResponse } from "next/server";
import { sql, initializeDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initializeDatabase();
    const entries = await sql`SELECT * FROM journal_entries ORDER BY entry_date DESC LIMIT 30`;
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch journal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    const body = await req.json();
    const { entry_date, mood, content, gratitude, intentions } = body;
    const date = entry_date || new Date().toISOString().split("T")[0];
    const [entry] = await sql`
      INSERT INTO journal_entries (entry_date, mood, content, gratitude, intentions)
      VALUES (${date}, ${mood || null}, ${content || null}, ${gratitude || null}, ${intentions || null})
      ON CONFLICT (entry_date) DO UPDATE SET
        mood = EXCLUDED.mood,
        content = EXCLUDED.content,
        gratitude = EXCLUDED.gratitude,
        intentions = EXCLUDED.intentions,
        updated_at = NOW()
      RETURNING *
    `;
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save journal entry" }, { status: 500 });
  }
}
