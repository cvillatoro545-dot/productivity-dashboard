"use client";

import { DashboardStats } from "@/lib/types";
import { CheckSquare, Zap, FileText, TrendingUp } from "lucide-react";

interface StatsBarProps {
  stats: DashboardStats | null;
  loading: boolean;
}

const statCards = (stats: DashboardStats) => [
  {
    label: "Tasks Active",
    value: stats.tasksTodo + stats.tasksInProgress,
    sub: `${stats.tasksDone} completed`,
    icon: CheckSquare,
    color: "text-amber-accent",
    bg: "bg-amber-accent/8",
  },
  {
    label: "Completion Rate",
    value: `${stats.taskCompletionRate}%`,
    sub: `${stats.tasksTotal} total tasks`,
    icon: TrendingUp,
    color: "text-sage",
    bg: "bg-sage/8",
  },
  {
    label: "Habits Today",
    value: `${stats.habitsCompletedToday}/${stats.habitsTotal}`,
    sub: stats.habitsTotal > 0
      ? `${Math.round((stats.habitsCompletedToday / stats.habitsTotal) * 100)}% done`
      : "No habits yet",
    icon: Zap,
    color: "text-rust",
    bg: "bg-rust/8",
  },
  {
    label: "Notes",
    value: stats.notesTotal,
    sub: "saved entries",
    icon: FileText,
    color: "text-ink/50",
    bg: "bg-ink/5",
  },
];

export default function StatsBar({ stats, loading }: StatsBarProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="card p-4 h-24 animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-3 w-16 bg-ink/10 rounded mb-3" />
            <div className="h-7 w-12 bg-ink/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {statCards(stats).map((s, i) => (
        <div
          key={s.label}
          className="card card-hover p-4 group"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-ink/40 font-mono tracking-wide uppercase leading-tight">
              {s.label}
            </span>
            <div className={`${s.bg} ${s.color} p-1.5 rounded-lg`}>
              <s.icon size={13} />
            </div>
          </div>
          <div className={`text-2xl font-display ${s.color} leading-none mb-1`}>
            {s.value}
          </div>
          <div className="text-xs text-ink/35 font-mono">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
