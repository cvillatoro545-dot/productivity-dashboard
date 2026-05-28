"use client";

import { useState, useEffect } from "react";
import { Dumbbell, Zap, Check, TrendingUp } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, isToday } from "date-fns";

interface GymLog { id: number; workout_date: string; }
interface Habit { id: number; name: string; color: string; icon: string; category: string; completedToday: boolean; completionRate: number; }

function WorkoutCalendar({ gymLogs, onToggle }: { gymLogs: GymLog[]; onToggle: (date: string) => void }) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const loggedDates = gymLogs.map((l) => l.workout_date.split("T")[0]);

  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  const startPad = firstDay.getDay();

  const monthWorkouts = days.filter((d) => loggedDates.includes(format(d, "yyyy-MM-dd"))).length;
  const pct = Math.round((monthWorkouts / days.length) * 100);

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell size={14} className="text-rust" />
          <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Workouts</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="font-display text-2xl text-rust">{monthWorkouts}</span>
            <span className="text-xs font-mono opacity-40 ml-1" style={{ color: "var(--ink)" }}>this month · {pct}%</span>
          </div>
          <button onClick={() => {
            const today = format(new Date(), "yyyy-MM-dd");
            onToggle(today);
          }} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${loggedDates.includes(format(new Date(), "yyyy-MM-dd")) ? "bg-rust/20 text-rust" : "bg-rust text-white hover:bg-rust-dark"}`}>
            {loggedDates.includes(format(new Date(), "yyyy-MM-dd")) ? "✓ Today" : "Log Today"}
          </button>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}
          className="text-xs font-mono opacity-40 hover:opacity-100 transition-opacity px-2" style={{ color: "var(--ink)" }}>←</button>
        <span className="text-sm font-mono opacity-60" style={{ color: "var(--ink)" }}>{format(viewMonth, "MMMM yyyy")}</span>
        <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}
          className="text-xs font-mono opacity-40 hover:opacity-100 transition-opacity px-2" style={{ color: "var(--ink)" }}>→</button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-mono opacity-30 pb-1" style={{ color: "var(--ink)" }}>{d}</div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const logged = loggedDates.includes(dateStr);
          const today = isToday(day);
          const future = day > new Date();
          return (
            <button key={dateStr} onClick={() => !future && onToggle(dateStr)} disabled={future}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-mono transition-all relative ${future ? "opacity-20 cursor-default" : "hover:opacity-80"}`}
              style={{ background: logged ? "#C4614A" : today ? "var(--bg-muted)" : "transparent", color: logged ? "white" : today ? "#D4A853" : "var(--ink)", opacity: future ? 0.2 : undefined, outline: today && !logged ? "1px solid #D4A853" : undefined }}>
              {format(day, "d")}
              {logged && <span className="absolute -top-0.5 -right-0.5 text-[8px]">💪</span>}
            </button>
          );
        })}
      </div>

      {/* 13-week consistency */}
      <div className="space-y-2 pt-2">
        <p className="text-[10px] font-mono uppercase tracking-widest opacity-40" style={{ color: "var(--ink)" }}>13-Week Consistency</p>
        <div className="flex gap-1">
          {Array.from({ length: 13 }, (_, i) => {
            const weekStart = format(startOfWeek(subWeeks(new Date(), 12 - i)), "yyyy-MM-dd");
            const weekEnd = format(endOfWeek(subWeeks(new Date(), 12 - i)), "yyyy-MM-dd");
            const count = gymLogs.filter((l) => {
              const d = l.workout_date.split("T")[0];
              return d >= weekStart && d <= weekEnd;
            }).length;
            const opacity = count === 0 ? 0.1 : count <= 2 ? 0.4 : count <= 4 ? 0.7 : 1;
            return (
              <div key={i} className="flex-1 h-8 rounded-sm transition-all" title={`${count} workouts`}
                style={{ background: "#C4614A", opacity }} />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] font-mono opacity-25" style={{ color: "var(--ink)" }}>
          <span>13w ago</span><span>now</span>
        </div>
      </div>
    </div>
  );
}

function HabitsOverview({ habits }: { habits: Habit[] }) {
  const daily = habits.filter((h) => h.category === "daily");
  const devotional = habits.filter((h) => h.category === "devotional");
  const doneToday = habits.filter((h) => h.completedToday).length;
  const pct = habits.length > 0 ? Math.round((doneToday / habits.length) * 100) : 0;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-accent" />
          <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Habits Today</h3>
        </div>
        <div className="font-display text-2xl text-amber-accent">{pct}%</div>
      </div>

      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
        <div className="h-full rounded-full transition-all duration-700 bg-amber-accent" style={{ width: `${pct}%` }} />
      </div>

      {[{ label: "Daily", items: daily }, { label: "Devotional", items: devotional }].map(({ label, items }) => (
        items.length > 0 && (
          <div key={label} className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-40" style={{ color: "var(--ink)" }}>{label}</p>
            <div className="grid grid-cols-2 gap-2">
              {items.map((habit) => (
                <div key={habit.id} className="flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ background: habit.completedToday ? habit.color + "20" : "var(--bg-muted)", border: `1px solid ${habit.completedToday ? habit.color + "30" : "transparent"}` }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ background: habit.completedToday ? habit.color : "var(--bg-soft)", color: habit.completedToday ? "white" : habit.color }}>
                    {habit.completedToday ? <Check size={12} strokeWidth={3} /> : habit.icon}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs truncate ${habit.completedToday ? "line-through opacity-50" : ""}`} style={{ color: "var(--ink)" }}>{habit.name}</p>
                    <p className="text-[10px] font-mono opacity-30" style={{ color: "var(--ink)" }}>{habit.completionRate}% 30d</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {habits.length === 0 && (
        <p className="text-sm font-mono opacity-30 py-2" style={{ color: "var(--ink)" }}>No habits yet. Add them in the Habits tab.</p>
      )}
    </div>
  );
}

export default function HealthArea() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const res = await fetch("/api/areas/health");
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  async function toggleGym(date: string) {
    await fetch("/api/gym", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workout_date: date }) });
    fetchData();
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => <div key={i} className="card h-48 animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl" style={{ color: "var(--ink)" }}>Health</h2>
        <p className="text-xs font-mono opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>Workouts · Habits · Consistency</p>
      </div>
      <WorkoutCalendar gymLogs={data?.gymLogs || []} onToggle={toggleGym} />
      <HabitsOverview habits={data?.habits || []} />
    </div>
  );
}
