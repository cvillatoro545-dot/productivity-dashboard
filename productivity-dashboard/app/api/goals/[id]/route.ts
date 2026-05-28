import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { title, target_amount, current_amount, monthly_target, color, notes } = body;
    const id = parseInt(params.id);
    const [goal] = await sql`
      UPDATE goals SET
        title = COALESCE(${title ?? null}, title),
        target_amount = COALESCE(${target_amount ?? null}, target_amount),
        current_amount = COALESCE(${current_amount ?? null}, current_amount),
        monthly_target = COALESCE(${monthly_target ?? null}, monthly_target),
        color = COALESCE(${color ?? null}, color),
        notes = COALESCE(${notes ?? null}, notes),
        updated_at = NOW()
      WHERE id = ${id} RETURNING *
    `;
    return NextResponse.json(goal);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM goals WHERE id = ${parseInt(params.id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { amount, note, log_date } = body;
    const id = parseInt(params.id);
    const date = log_date || new Date().toISOString().split("T")[0];
    const [log] = await sql`
      INSERT INTO goal_logs (goal_id, amount, log_date, note)
      VALUES (${id}, ${amount}, ${date}, ${note || null})
      RETURNING *
    `;
    // Update current_amount
    await sql`
      UPDATE goals SET current_amount = current_amount + ${amount}, updated_at = NOW() WHERE id = ${id}
    `;
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to log contribution" }, { status: 500 });
  }
}
