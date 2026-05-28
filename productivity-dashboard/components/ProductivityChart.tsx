"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";

interface DayData {
  date: string;
  label: string;
  tasks: number;
  habits: number;
}

export default function ProductivityChart() {
  const [data, setData] = useState<DayData[]>([]);
  const [view, setView] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [view]);

  async function fetchData() {
    setLoading(true);
    try {
      const days = view === "week" ? 7 : 30;
      const end = new Date();
      const start = subDays(end, days - 1);
      const interval = eachDayOfInterval({ start, end });

      const [tasksRes, habitsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/habits"),
      ]);

      const tasks = tasksRes.ok ? await tasksRes.json() : [];
      const habits = habitsRes.ok ? await habitsRes.json() : [];

      // Build chart data - tasks completed per day based on updated_at
      const chartData = interval.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const tasksCompleted = tasks.filter((t: any) =>
          t.status === "done" && t.updated_at?.startsWith(dayStr)
        ).length;

        return {
          date: dayStr,
          label: view === "week" ? format(day, "EEE") : format(day, "M/d"),
          tasks: tasksCompleted,
          habits: habits.filter((h: any) => h.completedToday && dayStr === format(new Date(), "yyyy-MM-dd")).length,
        };
      });

      setData(chartData);
    } finally {
      setLoading(false);
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="card px-3 py-2 text-xs font-mono shadow-lg">
        <p className="font-medium mb-1" style={{ color: "var(--ink)" }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Productivity Overview</h3>
          <p className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>Tasks completed per day</p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-muted)" }}>
          {(["week", "month"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className="text-xs px-3 py-1.5 rounded-lg font-mono transition-all capitalize"
              style={{ background: view === v ? "var(--ink)" : "transparent", color: view === v ? "var(--bg)" : "var(--ink)", opacity: view === v ? 1 : 0.5 }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center opacity-30">
          <div className="text-sm font-mono" style={{ color: "var(--ink)" }}>Loading...</div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--ink)", opacity: 0.4 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--ink)", opacity: 0.4 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-muted)", opacity: 0.5 }} />
            <Bar dataKey="tasks" name="Tasks done" fill="#D4A853" radius={[4, 4, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
