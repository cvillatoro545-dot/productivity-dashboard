import { NextRequest, NextResponse } from "next/server";
import { sql, initializeAreasDB } from "@/lib/db";
import { format } from "date-fns";

export async function GET(req: NextRequest, { params }: { params: { area: string } }) {
  try {
    await initializeAreasDB();
    const area = params.area;

    if (area === "finance") {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const [accounts, budgetCats, creditCards] = await Promise.all([
        sql`SELECT * FROM finance_accounts WHERE is_debt = FALSE ORDER BY account_type, created_at`,
        sql`SELECT * FROM budget_categories WHERE month = ${currentMonth} ORDER BY budgeted DESC`,
        sql`SELECT * FROM credit_cards ORDER BY created_at`,
      ]);

      const assets = accounts.filter((a: any) => a.account_type !== 'debt');
      const totalAssets = assets.reduce((s: number, a: any) => s + Number(a.balance), 0);
      const totalDebt = creditCards.reduce((s: number, c: any) => s + Number(c.balance), 0);
      const netWorth = totalAssets - totalDebt;
      const totalBudgeted = budgetCats.reduce((s: number, c: any) => s + Number(c.budgeted), 0);
      const totalSpent = budgetCats.reduce((s: number, c: any) => s + Number(c.spent), 0);

      return NextResponse.json({
        accounts,
        creditCards,
        budgetCategories: budgetCats,
        summary: { totalAssets, totalDebt, netWorth, totalBudgeted, totalSpent },
      });
    }

    if (area === "health") {
      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const [gymLogs, habits, habitLogs] = await Promise.all([
        sql`SELECT * FROM gym_logs ORDER BY workout_date DESC LIMIT 60`,
        sql`SELECT * FROM habits ORDER BY category, created_at`,
        sql`SELECT * FROM habit_logs WHERE completed_date >= ${thirtyDaysAgo} ORDER BY completed_date DESC`,
      ]);

      const workoutsThisWeek = gymLogs.filter((l: any) =>
        l.workout_date >= sevenDaysAgo
      ).length;
      const workoutsThisMonth = gymLogs.filter((l: any) =>
        l.workout_date >= thirtyDaysAgo
      ).length;

      return NextResponse.json({
        gymLogs,
        habits,
        habitLogs,
        summary: { workoutsThisWeek, workoutsThisMonth },
      });
    }

    return NextResponse.json({ error: "Unknown area" }, { status: 400 });
  } catch (error) {
    console.error("Areas GET error:", error);
    return NextResponse.json({ error: "Failed to fetch area data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { area: string } }) {
  try {
    await initializeAreasDB();
    const area = params.area;
    const body = await req.json();

    if (area === "finance") {
      const { type, ...data } = body;

      if (type === "account") {
        const [row] = await sql`
          INSERT INTO finance_accounts (name, account_type, subtype, balance, target, monthly_contribution, color, institution, is_debt)
          VALUES (${data.name}, ${data.account_type}, ${data.subtype || null}, ${data.balance || 0},
                  ${data.target || null}, ${data.monthly_contribution || 0}, ${data.color || '#D4A853'},
                  ${data.institution || null}, ${data.is_debt || false})
          RETURNING *
        `;
        return NextResponse.json(row, { status: 201 });
      }

      if (type === "snapshot") {
        const [row] = await sql`
          INSERT INTO finance_snapshots (account_id, balance, note)
          VALUES (${data.account_id}, ${data.balance}, ${data.note || null})
          RETURNING *
        `;
        await sql`
          UPDATE finance_accounts SET balance = ${data.balance}, updated_at = NOW()
          WHERE id = ${data.account_id}
        `;
        return NextResponse.json(row, { status: 201 });
      }

      if (type === "budget") {
        const month = new Date().toISOString().slice(0, 7);
        const [row] = await sql`
          INSERT INTO budget_categories (name, budgeted, spent, month, color)
          VALUES (${data.name}, ${data.budgeted || 0}, ${data.spent || 0}, ${month}, ${data.color || '#7A9E7E'})
          RETURNING *
        `;
        return NextResponse.json(row, { status: 201 });
      }
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    console.error("Areas POST error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { area: string } }) {
  try {
    const body = await req.json();
    const { type, id, ...data } = body;

    if (type === "account") {
      const [row] = await sql`
        UPDATE finance_accounts SET
          name = COALESCE(${data.name ?? null}, name),
          balance = COALESCE(${data.balance ?? null}, balance),
          target = COALESCE(${data.target ?? null}, target),
          monthly_contribution = COALESCE(${data.monthly_contribution ?? null}, monthly_contribution),
          color = COALESCE(${data.color ?? null}, color),
          updated_at = NOW()
        WHERE id = ${id} RETURNING *
      `;
      return NextResponse.json(row);
    }

    if (type === "budget") {
      const [row] = await sql`
        UPDATE budget_categories SET
          budgeted = COALESCE(${data.budgeted ?? null}, budgeted),
          spent = COALESCE(${data.spent ?? null}, spent)
        WHERE id = ${id} RETURNING *
      `;
      return NextResponse.json(row);
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { area: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = parseInt(searchParams.get("id") || "0");

    if (type === "account") await sql`DELETE FROM finance_accounts WHERE id = ${id}`;
    else if (type === "budget") await sql`DELETE FROM budget_categories WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
