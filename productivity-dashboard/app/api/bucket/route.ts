import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

async function initBucket() {
  await sql`
    CREATE TABLE IF NOT EXISTS bucket_list (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      category TEXT CHECK (category IN ('Travel','Experience','Career','Personal','Health','Creative','Financial')) DEFAULT 'Personal',
      completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET() {
  try {
    await initBucket();
    const items = await sql`SELECT * FROM bucket_list ORDER BY completed ASC, created_at DESC`;
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bucket list" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initBucket();
    const { text, category = "Personal" } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: "Text required" }, { status: 400 });
    const [item] = await sql`
      INSERT INTO bucket_list (text, category) VALUES (${text.trim()}, ${category}) RETURNING *
    `;
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, completed } = await req.json();
    const [item] = await sql`
      UPDATE bucket_list SET
        completed = ${completed},
        completed_at = ${completed ? new Date().toISOString() : null}
      WHERE id = ${id} RETURNING *
    `;
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    await sql`DELETE FROM bucket_list WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
