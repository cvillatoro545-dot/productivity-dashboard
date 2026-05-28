import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, content, tags, pinned } = body;
    const id = parseInt(params.id);

    const [note] = await sql`
      UPDATE notes SET
        title = COALESCE(${title ?? null}, title),
        content = COALESCE(${content ?? null}, content),
        tags = COALESCE(${tags ?? null}, tags),
        pinned = COALESCE(${pinned ?? null}, pinned),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    console.error("PATCH /api/notes/[id] error:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await sql`DELETE FROM notes WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notes/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
