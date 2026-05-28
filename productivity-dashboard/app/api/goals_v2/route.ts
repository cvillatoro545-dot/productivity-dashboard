import { NextRequest, NextResponse } from "next/server";
import { sql, initializeAreasDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await initializeAreasDB();
    const { searchParams } = new URL(req.url);
    const area = searchParams.get("area");
    const year = searchParams.get("year") || new Date().getFullYear().toString();

    const goals = area
      ? await sql`SELECT * FROM goals_v2 WHERE area = ${area} AND year = ${parseInt(year)} ORDER BY status, created_at`
      : await sql`SELECT * FROM goals_v2 WHERE year = ${parseInt(year)} ORDER BY area, status, created_at`;

    const projects = await sql`
      SELECT p.*, g.title as goal_title, g.area as goal_area
      FROM projects p
      LEFT JOIN goals_v2 g ON p.goal_id = g.id
      WHERE ${area ? sql`p.area = ${area}` : sql`1=1`}
      ORDER BY p.status, p.created_at
    `;

    return NextResponse.json({ goals, projects });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeAreasDB();
    const body = await req.json();
    const { type, ...data } = body;

    if (type === "goal") {
      const [row] = await sql`
        INSERT INTO goals_v2 (title, area, year, quarter, description, target_date, color)
        VALUES (${data.title}, ${data.area}, ${data.year || new Date().getFullYear()},
                ${data.quarter || null}, ${data.description || null},
                ${data.target_date || null}, ${data.color || '#D4A853'})
        RETURNING *
      `;
      return NextResponse.json(row, { status: 201 });
    }

    if (type === "project") {
      const [row] = await sql`
        INSERT INTO projects (title, goal_id, area, description, target_date)
        VALUES (${data.title}, ${data.goal_id || null}, ${data.area || null},
                ${data.description || null}, ${data.target_date || null})
        RETURNING *
      `;
      return NextResponse.json(row, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
