"use client";

import { useState } from "react";
import { Habit } from "@/lib/types";
import { Plus, Trash2, Check, Flame } from "lucide-react";

interface HabitsPanelProps {
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  onUpdate: () => void;
}

const ICONS = ["✦", "◈", "◉", "◆", "▲", "●", "✿", "⬡", "◑", "⬟"];
const COLORS = ["#D4A853","#C4614A","#7A9E7E","#5B7FA6","#9B6B9E","#C4845A","#6B9E9E","#A68B5B","#8B6BB8","#6B8B6B"];

function StreakBadge({ streak }: { streak: number }) {
  if (streak < 3) return null;
  const size = streak >= 30 ? "text-lg" : streak >= 14 ? "text-base" : "text-sm";
  return (
    <span className={`animate-flicker streak-fire ${size}`} title={`${streak} day streak!`}>
      🔥
    </span>
  );
}

export default function HabitsPanel({ habits, setHabits, onUpdate }: HabitsPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", description: "", color: "#D4A853", icon: "✦" });
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newHabit.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/habits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newHabit) });
      if (res.ok) { await onUpdate(); setNewHabit({ name: "", description: "", color: "#D4A853", icon: "✦" }); setShowForm(false); }
    } finally { setSubmitting(false); }
  }

  async function toggleHabit(id: number) {
    setToggling(id);
    try {
      const res = await fetch(`/api/habits/${id}`, { method: "POST" });
      if (res.ok) {
        const { completed } = await res.json();
        setHabits(habits.map((h) => h.id === id ? { ...h, completedToday: completed, streak: completed ? (h.streak || 0) + 1 : Math.max(0, (h.streak || 0) - 1) } : h));
      }
    } finally { setToggling(null); }
  }

  async function deleteHabit(id: number) {
    const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
    if (res.ok) setHabits(habits.filter((h) => h.id !== id));
  }

  const completed = habits.filter((h) => h.completedToday).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {habits.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-accent/10 rounded-lg">
              <Flame size={13} className="text-amber-accent" />
              <span className="text-xs font-mono text-amber-deep">{completed}/{habits.length} today</span>
            </div>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all group" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
          <Plus size={14} className="group-hover:rotate-90 transition-transform duration-200" />
          New Habit
        </button>
      </div>

      {showForm && (
        <div className="card p-4 animate-scale-in border-amber-accent/30">
          <form onSubmit={handleCreate} className="space-y-3">
            <input type="text" placeholder="Habit name..." value={newHabit.name} onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })} className="w-full bg-transparent border-b pb-2 placeholder-current focus:outline-none focus:border-amber-accent transition-colors font-display text-lg" style={{ borderColor: 'var(--border)', color: 'var(--ink)' }} autoFocus />
            <input type="text" placeholder="Description (optional)..." value={newHabit.description} onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })} className="w-full bg-transparent text-sm focus:outline-none opacity-70" style={{ color: 'var(--ink)' }} />
            <div>
              <p className="text-xs font-mono mb-2 opacity-40" style={{ color: 'var(--ink)' }}>Icon</p>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map((icon) => (
                  <button key={icon} type="button" onClick={() => setNewHabit({ ...newHabit, icon })} className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${newHabit.icon === icon ? "scale-110" : "hover:scale-105"}`} style={{ background: newHabit.icon === icon ? 'var(--ink)' : 'var(--bg-muted)', color: newHabit.icon === icon ? 'var(--bg)' : 'var(--ink)' }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono mb-2 opacity-40" style={{ color: 'var(--ink)' }}>Color</p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => setNewHabit({ ...newHabit, color })} className={`w-7 h-7 rounded-full border-2 transition-all ${newHabit.color === color ? "border-current scale-125" : "border-transparent hover:scale-110"}`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--ink)' }}>Cancel</button>
              <button type="submit" disabled={submitting || !newHabit.name.trim()} className="text-xs px-4 py-1.5 bg-amber-accent text-ink font-medium rounded-lg hover:bg-amber-warm transition-colors disabled:opacity-40">Add Habit</button>
            </div>
          </form>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3 opacity-30">◉</div>
          <p className="text-sm font-mono opacity-40" style={{ color: 'var(--ink)' }}>No habits yet. Build your routine.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {habits.map((habit, i) => (
            <div key={habit.id} className="card card-hover p-4 group animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleHabit(habit.id)} disabled={toggling === habit.id} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all duration-300 ${habit.completedToday ? "scale-100 shadow-inner" : "hover:scale-105 hover:shadow-md"}`} style={{ backgroundColor: habit.completedToday ? habit.color : 'var(--bg-muted)', color: habit.completedToday ? "white" : habit.color, boxShadow: habit.completedToday ? `0 0 20px ${habit.color}40` : undefined }}>
                  {habit.completedToday ? <Check size={16} strokeWidth={3} /> : habit.icon}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-display text-base leading-tight ${habit.completedToday ? "opacity-50 line-through" : ""}`} style={{ color: 'var(--ink)' }}>{habit.name}</h3>
                      <StreakBadge streak={habit.streak || 0} />
                    </div>
                    <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 p-1 transition-all text-rust ml-1"><Trash2 size={11} /></button>
                  </div>
                  {habit.description && <p className="text-xs mt-0.5 opacity-40" style={{ color: 'var(--ink)' }}>{habit.description}</p>}
                  {(habit.streak || 0) > 0 && (
                    <p className="text-[10px] font-mono mt-1 opacity-50" style={{ color: habit.color }}>{habit.streak} day streak</p>
                  )}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono opacity-30" style={{ color: 'var(--ink)' }}>30-day rate</span>
                      <span className="text-[10px] font-mono" style={{ color: habit.color }}>{habit.completionRate}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${habit.completionRate}%`, backgroundColor: habit.color, opacity: 0.7 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
