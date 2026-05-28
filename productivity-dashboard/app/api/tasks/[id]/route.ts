import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, description, priority, status, due_date } = body;
    const id = parseInt(params.id);

    const [task] = await sql`
      UPDATE tasks SET
        title = COALESCE(${title ?? null}, title),
        description = COALESCE(${description ?? null}, description),
        priority = COALESCE(${priority ?? null}, priority),
        status = COALESCE(${status ?? null}, status),
        due_date = COALESCE(${due_date ?? null}, due_date),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await sql`DELETE FROM tasks WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
