import { NextRequest, NextResponse } from "next/server";
import { sql, initializeQuarterTables } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await initializeQuarterTables();
    const { searchParams } = new URL(req.url);
    const quarterKey = searchParams.get("q") || "";

    const [goals, cards, achievements, parking] = await Promise.all([
      sql`SELECT * FROM quarterly_goals WHERE quarter_key = ${quarterKey} ORDER BY category, created_at`,
      sql`SELECT * FROM credit_cards ORDER BY created_at`,
      sql`SELECT * FROM achievements WHERE quarter_key = ${quarterKey} ORDER BY created_at DESC`,
      sql`SELECT * FROM parking_lot ORDER BY done ASC, created_at DESC`,
    ]);

    // Gym consistency: last 13 weeks
    const gymData = await sql`
      SELECT DATE_TRUNC('week', workout_date) AS week_start, COUNT(*) AS count
      FROM gym_logs
      WHERE workout_date >= CURRENT_DATE - INTERVAL '91 days'
      GROUP BY week_start ORDER BY week_start
    `;

    return NextResponse.json({ goals, cards, achievements, parking, gymData });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch quarter data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeQuarterTables();
    const body = await req.json();
    const { type, ...data } = body;

    if (type === "goal") {
      const [row] = await sql`
        INSERT INTO quarterly_goals (quarter_key, category, text)
        VALUES (${data.quarter_key}, ${data.category}, ${data.text}) RETURNING *
      `;
      return NextResponse.json(row, { status: 201 });
    }

    if (type === "card") {
      const [row] = await sql`
        INSERT INTO credit_cards (name, balance, original_balance, credit_limit, color)
        VALUES (${data.name}, ${data.balance}, ${data.balance}, ${data.credit_limit || 0}, ${data.color || '#D4A853'}) RETURNING *
      `;
      return NextResponse.json(row, { status: 201 });
    }

    if (type === "achievement") {
      const [row] = await sql`
        INSERT INTO achievements (quarter_key, text) VALUES (${data.quarter_key}, ${data.text}) RETURNING *
      `;
      return NextResponse.json(row, { status: 201 });
    }

    if (type === "parking") {
      const [row] = await sql`
        INSERT INTO parking_lot (text) VALUES (${data.text}) RETURNING *
      `;
      return NextResponse.json(row, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, ...data } = body;

    if (type === "goal") {
      const [row] = await sql`
        UPDATE quarterly_goals SET completed = ${data.completed}, updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `;
      return NextResponse.json(row);
    }

    if (type === "card") {
      const [row] = await sql`
        UPDATE credit_cards SET
          name = COALESCE(${data.name ?? null}, name),
          balance = COALESCE(${data.balance ?? null}, balance),
          credit_limit = COALESCE(${data.credit_limit ?? null}, credit_limit),
          color = COALESCE(${data.color ?? null}, color),
          updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `;
      return NextResponse.json(row);
    }

    if (type === "parking") {
      const [row] = await sql`
        UPDATE parking_lot SET done = ${data.done} WHERE id = ${id} RETURNING *
      `;
      return NextResponse.json(row);
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = parseInt(searchParams.get("id") || "0");

    if (type === "goal") await sql`DELETE FROM quarterly_goals WHERE id = ${id}`;
    else if (type === "card") await sql`DELETE FROM credit_cards WHERE id = ${id}`;
    else if (type === "achievement") await sql`DELETE FROM achievements WHERE id = ${id}`;
    else if (type === "parking") await sql`DELETE FROM parking_lot WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
