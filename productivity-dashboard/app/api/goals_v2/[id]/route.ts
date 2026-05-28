import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { type, ...data } = body;
    const id = parseInt(params.id);

    if (type === "goal") {
      const [row] = await sql`
        UPDATE goals_v2 SET
          title = COALESCE(${data.title ?? null}, title),
          status = COALESCE(${data.status ?? null}, status),
          description = COALESCE(${data.description ?? null}, description),
          updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `;
      return NextResponse.json(row);
    }

    if (type === "project") {
      const [row] = await sql`
        UPDATE projects SET
          title = COALESCE(${data.title ?? null}, title),
          status = COALESCE(${data.status ?? null}, status),
          description = COALESCE(${data.description ?? null}, description),
          updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `;
      return NextResponse.json(row);
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = parseInt(params.id);

    if (type === "goal") await sql`DELETE FROM goals_v2 WHERE id = ${id}`;
    else if (type === "project") await sql`DELETE FROM projects WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
