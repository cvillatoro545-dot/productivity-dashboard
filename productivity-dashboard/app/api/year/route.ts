import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

async function initYear() {
  await sql`
    CREATE TABLE IF NOT EXISTS year_reflections (
      id SERIAL PRIMARY KEY,
      year INTEGER NOT NULL UNIQUE,
      vision TEXT,
      non_negotiables TEXT,
      focus TEXT,
      change TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS year_buckets (
      id SERIAL PRIMARY KEY,
      year INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#D4A853',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS year_goals (
      id SERIAL PRIMARY KEY,
      year INTEGER NOT NULL,
      category TEXT CHECK (category IN ('Finance','Health','Business','Personal','Relationships','Growth')) DEFAULT 'Personal',
      text TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET(req: NextRequest) {
  try {
    await initYear();
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const [reflections, buckets, goals] = await Promise.all([
      sql`SELECT * FROM year_reflections WHERE year = ${year}`,
      sql`SELECT * FROM year_buckets WHERE year = ${year} ORDER BY sort_order, created_at`,
      sql`SELECT * FROM year_goals WHERE year = ${year} ORDER BY category, created_at`,
    ]);
    return NextResponse.json({
      reflection: reflections[0] || null,
      buckets,
      goals,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch year data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initYear();
    const body = await req.json();
    const { type, year, ...data } = body;

    if (type === "reflection") {
      const [row] = await sql`
        INSERT INTO year_reflections (year, vision, non_negotiables, focus, change)
        VALUES (${year}, ${data.vision || null}, ${data.non_negotiables || null}, ${data.focus || null}, ${data.change || null})
        ON CONFLICT (year) DO UPDATE SET
          vision = EXCLUDED.vision,
          non_negotiables = EXCLUDED.non_negotiables,
          focus = EXCLUDED.focus,
          change = EXCLUDED.change,
          updated_at = NOW()
        RETURNING *
      `;
      return NextResponse.json(row);
    }

    if (type === "bucket") {
      const [row] = await sql`
        INSERT INTO year_buckets (year, title, description, color)
        VALUES (${year}, ${data.title}, ${data.description || null}, ${data.color || '#D4A853'})
        RETURNING *
      `;
      return NextResponse.json(row, { status: 201 });
    }

    if (type === "goal") {
      const [row] = await sql`
        INSERT INTO year_goals (year, category, text)
        VALUES (${year}, ${data.category}, ${data.text})
        RETURNING *
      `;
      return NextResponse.json(row, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, ...data } = body;

    if (type === "goal") {
      const [row] = await sql`
        UPDATE year_goals SET completed = ${data.completed} WHERE id = ${id} RETURNING *
      `;
      return NextResponse.json(row);
    }

    if (type === "bucket") {
      const [row] = await sql`
        UPDATE year_buckets SET
          title = COALESCE(${data.title ?? null}, title),
          description = COALESCE(${data.description ?? null}, description),
          color = COALESCE(${data.color ?? null}, color)
        WHERE id = ${id} RETURNING *
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
    if (type === "bucket") await sql`DELETE FROM year_buckets WHERE id = ${id}`;
    else if (type === "goal") await sql`DELETE FROM year_goals WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
