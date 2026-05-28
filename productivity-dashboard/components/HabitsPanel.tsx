"use client";

import { useState, useEffect } from "react";
import { Habit } from "@/lib/types";
import { Plus, Trash2, Check, Settings, X, GripVertical } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";

interface HabitsPanelProps {
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  onUpdate: () => void;
}

const ICONS = ["✦", "◈", "◉", "◆", "▲", "●", "✿", "⬡", "◑", "⬟", "🏋️", "📖", "🙏", "💊", "💧", "🚶", "😴", "✍️", "🧘", "💰"];
const COLORS = ["#D4A853","#C4614A","#7A9E7E","#5B7FA6","#9B6B9E","#C4845A","#6B9E9E","#A68B5B","#8B6BB8","#6B8B6B"];

// Last 7 days array
function getWeekDays() {
  const end = new Date();
  const start = subDays(end, 6);
  return eachDayOfInterval({ start, end });
}

function ScoreBar({ habits }: { habits: Habit[] }) {
  const weekDays = getWeekDays();
  const totalPossible = habits.reduce((sum, h) => sum + Math.min(h.weekly_goal || 7, 7), 0);
  const totalDone = habits.reduce((sum, h) => {
    const logs = h.weekLogs || [];
    return sum + weekDays.filter((d) => logs.includes(format(d, "yyyy-MM-dd"))).length;
  }, 0);
  const pct = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
  const color = pct >= 80 ? "#7A9E7E" : pct >= 50 ? "#D4A853" : "#C4614A";

  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-widest opacity-40" style={{ color: "var(--ink)" }}>This Week</span>
        <span className="font-display text-2xl" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>{totalDone} / {totalPossible} completions</p>
    </div>
  );
}

function SummaryCards({ habits }: { habits: Habit[] }) {
  if (habits.length === 0) return null;
  const weekDays = getWeekDays();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {habits.map((habit) => {
        const logs = habit.weekLogs || [];
        const done = weekDays.filter((d) => logs.includes(format(d, "yyyy-MM-dd"))).length;
        const goal = Math.min(habit.weekly_goal || 7, 7);
        const pct = Math.round((done / goal) * 100);
        return (
          <div key={habit.id} className="card p-3 space-y-1.5" style={{ borderLeft: `3px solid ${habit.color}` }}>
            <div className="flex items-center gap-1.5">
              <span style={{ color: habit.color }}>{habit.icon}</span>
              <span className="text-xs font-mono truncate opacity-70" style={{ color: "var(--ink)" }}>{habit.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-display" style={{ color: habit.color }}>{done}/{goal}</span>
              <span className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: habit.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HabitGrid({ habits, onToggle }: { habits: Habit[]; onToggle: (id: number, date: string) => void }) {
  const weekDays = getWeekDays();
  const daily = habits.filter((h) => h.category === "daily");
  const devotional = habits.filter((h) => h.category === "devotional");

  function HabitSection({ title, items }: { title: string; items: Habit[] }) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-40" style={{ color: "var(--ink)" }}>{title}</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>
        {items.map((habit) => {
          const logs = habit.weekLogs || [];
          return (
            <div key={habit.id} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 w-32 flex-shrink-0">
                <span className="text-sm" style={{ color: habit.color }}>{habit.icon}</span>
                <span className="text-xs truncate opacity-70" style={{ color: "var(--ink)" }}>{habit.name}</span>
              </div>
              <div className="flex gap-1 flex-1">
                {weekDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const done = logs.includes(dateStr);
                  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
                  const isFuture = day > new Date();
                  return (
                    <button key={dateStr} onClick={() => !isFuture && onToggle(habit.id, dateStr)}
                      disabled={isFuture}
                      className={`flex-1 h-8 rounded-md transition-all ${isFuture ? "opacity-20 cursor-default" : "hover:scale-105 active:scale-95"} ${isToday && !done ? "ring-1" : ""}`}
                      style={{ background: done ? habit.color : "var(--bg-muted)", outline: isToday && !done ? `1px solid ${habit.color}` : undefined }}
                      title={format(day, "EEE MMM d")}>
                      {done && <Check size={10} className="mx-auto text-white" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-4">
      {/* Day headers */}
      <div className="flex items-center gap-2">
        <div className="w-32 flex-shrink-0" />
        <div className="flex gap-1 flex-1">
          {weekDays.map((day) => {
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            return (
              <div key={format(day, "d")} className={`flex-1 text-center`}>
                <div className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>{format(day, "EEE")[0]}</div>
                <div className={`text-xs font-mono ${isToday ? "text-amber-accent font-bold" : "opacity-50"}`} style={{ color: isToday ? undefined : "var(--ink)" }}>
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <HabitSection title="Daily" items={daily} />
      <HabitSection title="Devotional" items={devotional} />
    </div>
  );
}

function ManageModal({ habits, onClose, onUpdate }: { habits: Habit[]; onClose: () => void; onUpdate: () => void }) {
  const [newHabit, setNewHabit] = useState({ name: "", color: "#D4A853", icon: "✦", category: "daily" as "daily" | "devotional", weekly_goal: 7 });
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!newHabit.name.trim()) return;
    setAdding(true);
    try {
      await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newHabit) });
      onUpdate();
      setNewHabit({ name: "", color: "#D4A853", icon: "✦", category: "daily", weekly_goal: 7 });
    } finally { setAdding(false); }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    onUpdate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-5 max-h-[80vh] overflow-y-auto" style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>Manage Habits</h2>
          <button onClick={onClose} className="p-1 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--ink)" }}><X size={18} /></button>
        </div>

        {/* Add new */}
        <div className="space-y-3 p-4 rounded-xl" style={{ background: "var(--bg-muted)" }}>
          <p className="text-xs font-mono uppercase tracking-widest opacity-40" style={{ color: "var(--ink)" }}>Add Habit</p>
          <input type="text" placeholder="Habit name..." value={newHabit.name} onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
            className="w-full bg-transparent border-b pb-1.5 text-sm focus:outline-none focus:border-amber-accent" style={{ borderColor: "var(--border)", color: "var(--ink)" }} />
          <div className="grid grid-cols-2 gap-3">
            <select value={newHabit.category} onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value as "daily" | "devotional" })}
              className="text-xs rounded-lg px-2 py-1.5 focus:outline-none" style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", color: "var(--ink)" }}>
              <option value="daily">Daily</option>
              <option value="devotional">Devotional</option>
            </select>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-50" style={{ color: "var(--ink)" }}>Goal:</span>
              <input type="number" min={1} max={7} value={newHabit.weekly_goal} onChange={(e) => setNewHabit({ ...newHabit, weekly_goal: parseInt(e.target.value) || 7 })}
                className="w-14 text-xs rounded-lg px-2 py-1.5 text-center focus:outline-none" style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", color: "var(--ink)" }} />
              <span className="text-xs opacity-50" style={{ color: "var(--ink)" }}>/7</span>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {ICONS.map((ic) => (
              <button key={ic} type="button" onClick={() => setNewHabit({ ...newHabit, icon: ic })}
                className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${newHabit.icon === ic ? "scale-110" : "opacity-50 hover:opacity-100"}`}
                style={{ background: newHabit.icon === ic ? "var(--ink)" : "var(--bg-soft)", color: newHabit.icon === ic ? "var(--bg)" : "var(--ink)" }}>
                {ic}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setNewHabit({ ...newHabit, color: c })}
                className={`w-6 h-6 rounded-full border-2 transition-all ${newHabit.color === c ? "scale-125" : "border-transparent hover:scale-110"}`}
                style={{ background: c, borderColor: newHabit.color === c ? "var(--ink)" : "transparent" }} />
            ))}
          </div>
          <button onClick={handleAdd} disabled={adding || !newHabit.name.trim()}
            className="w-full py-2 bg-amber-accent text-ink text-sm font-medium rounded-lg hover:bg-amber-warm transition-colors disabled:opacity-40">
            Add Habit
          </button>
        </div>

        {/* Existing habits */}
        <div className="space-y-2">
          {habits.map((h) => (
            <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-muted)" }}>
              <span className="text-lg" style={{ color: h.color }}>{h.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "var(--ink)" }}>{h.name}</p>
                <p className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>{h.category} · {h.weekly_goal}/7</p>
              </div>
              <button onClick={() => handleDelete(h.id)} className="p-1.5 text-rust opacity-50 hover:opacity-100 transition-opacity"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HabitsPanel({ habits, setHabits, onUpdate }: HabitsPanelProps) {
  const [showManage, setShowManage] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  async function toggleHabitDate(habitId: number, date: string) {
    const key = `${habitId}-${date}`;
    if (toggling === key) return;
    setToggling(key);
    try {
      const isToday = date === format(new Date(), "yyyy-MM-dd");
      if (isToday) {
        await fetch(`/api/habits/${habitId}`, { method: "POST" });
      } else {
        // For past dates, use a dedicated endpoint
        await fetch(`/api/habits/${habitId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
        });
      }
      onUpdate();
    } finally { setToggling(null); }
  }

  return (
    <>
      {showManage && <ManageModal habits={habits} onClose={() => setShowManage(false)} onUpdate={() => { onUpdate(); }} />}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>Habit Tracker</h2>
          <button onClick={() => setShowManage(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{ background: "var(--bg-muted)", color: "var(--ink)" }}>
            <Settings size={14} /> Manage
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="card p-10 text-center space-y-3">
            <div className="text-4xl opacity-20">◉</div>
            <p className="text-sm font-mono opacity-40" style={{ color: "var(--ink)" }}>No habits yet.</p>
            <button onClick={() => setShowManage(true)} className="text-xs px-4 py-2 bg-amber-accent text-ink rounded-lg font-medium hover:bg-amber-warm transition-colors">Add your first habit</button>
          </div>
        ) : (
          <>
            <ScoreBar habits={habits} />
            <HabitGrid habits={habits} onToggle={toggleHabitDate} />
            <SummaryCards habits={habits} />
          </>
        )}
      </div>
    </>
  );
}
