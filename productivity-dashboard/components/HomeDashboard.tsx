"use client";

import { useEffect, useState, useCallback } from "react";
import CalendarWidget from "./CalendarWidget";
import { Check, Circle, Flame, Dumbbell, BookOpen, Zap, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Task, Habit } from "@/lib/types";

interface MomentumData {
  momentum: number;
  subtitle: string;
  breakdown: { tasks: number; habits: number; workouts: number; journal: number; reading: number };
  raw: {
    tasksTodayDone: number;
    tasksTodo: number;
    habitsToday: number;
    habitsTotal: number;
    workoutsThisWeek: number;
    hasJournalToday: boolean;
  };
}

// ── Momentum Ring ─────────────────────────────────────────────────────────────

function MomentumRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = score >= 70 ? "#7A9E7E" : score >= 40 ? "#D4A853" : "#C4614A";

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="8" stroke="var(--bg-muted)" />
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="8"
          stroke={color} strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: "stroke-dasharray 1s ease, stroke 0.5s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl leading-none" style={{ color }}>{score}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>momentum</span>
      </div>
    </div>
  );
}

// ── Today's Tasks ─────────────────────────────────────────────────────────────

function TodayTasks({ tasks, onToggle, onNavigate }: {
  tasks: Task[];
  onToggle: (id: number, done: boolean) => void;
  onNavigate: () => void;
}) {
  const [pulses, setPulses] = useState<Record<number, boolean>>({});
  const active = tasks.filter((t) => t.status !== "done").slice(0, 5);
  const done = tasks.filter((t) => t.status === "done");

  function handleCheck(task: Task) {
    const newDone = task.status !== "done";
    if (newDone) {
      setPulses((p) => ({ ...p, [task.id]: true }));
      setTimeout(() => setPulses((p) => ({ ...p, [task.id]: false })), 600);
      // Play sound
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
      } catch {}
    }
    onToggle(task.id, newDone);
  }

  const priorityDot = { high: "#C4614A", medium: "#D4A853", low: "#7A9E7E" };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Today's Tasks</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>
            {done.length}/{tasks.length} done
          </span>
          <button onClick={onNavigate} className="text-xs font-mono opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1" style={{ color: "var(--ink)" }}>
            All <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm font-mono opacity-30 py-2" style={{ color: "var(--ink)" }}>No tasks yet. Use Quick Capture to add one.</p>
      ) : (
        <div className="space-y-1">
          {active.map((task) => (
            <button key={task.id} onClick={() => handleCheck(task)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:opacity-80 transition-all text-left group relative overflow-hidden">
              {pulses[task.id] && (
                <div className="absolute inset-0 rounded-xl animate-ping opacity-20" style={{ background: priorityDot[task.priority] }} />
              )}
              <div className="relative w-5 h-5 flex-shrink-0">
                <Circle size={18} className="opacity-20 group-hover:opacity-50 transition-opacity" style={{ color: priorityDot[task.priority] }} />
              </div>
              <span className="text-sm flex-1 leading-snug" style={{ color: "var(--ink)" }}>{task.title}</span>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: priorityDot[task.priority] }} />
            </button>
          ))}
          {done.slice(0, 3).map((task) => (
            <button key={task.id} onClick={() => handleCheck(task)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left opacity-30">
              <Check size={18} className="text-sage flex-shrink-0" />
              <span className="text-sm line-through flex-1" style={{ color: "var(--ink)" }}>{task.title}</span>
            </button>
          ))}
          {tasks.length > 8 && (
            <button onClick={onNavigate} className="w-full text-center text-xs font-mono opacity-30 hover:opacity-60 transition-opacity pt-1" style={{ color: "var(--ink)" }}>
              +{tasks.length - 8} more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Today's Habits ────────────────────────────────────────────────────────────

function TodayHabits({ habits, onToggle, onNavigate }: {
  habits: Habit[];
  onToggle: (id: number) => void;
  onNavigate: () => void;
}) {
  const done = habits.filter((h) => h.completedToday).length;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Today's Habits</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>{done}/{habits.length}</span>
          <button onClick={onNavigate} className="text-xs font-mono opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1" style={{ color: "var(--ink)" }}>
            All <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm font-mono opacity-30 py-2" style={{ color: "var(--ink)" }}>No habits yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {habits.map((habit) => (
            <button key={habit.id} onClick={() => onToggle(habit.id)}
              className="flex items-center gap-2.5 p-3 rounded-xl transition-all text-left"
              style={{ background: habit.completedToday ? habit.color + "20" : "var(--bg-muted)", border: `1px solid ${habit.completedToday ? habit.color + "40" : "transparent"}` }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: habit.completedToday ? habit.color : "var(--bg-soft)", color: habit.completedToday ? "white" : habit.color }}>
                {habit.completedToday ? <Check size={13} strokeWidth={3} /> : <span className="text-sm">{habit.icon}</span>}
              </div>
              <span className={`text-xs font-medium leading-tight ${habit.completedToday ? "opacity-50 line-through" : ""}`} style={{ color: "var(--ink)" }}>
                {habit.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Weekly Snapshot ───────────────────────────────────────────────────────────

function WeeklySnapshot({ raw }: { raw: MomentumData["raw"] }) {
  const habitPct = raw.habitsTotal > 0 ? Math.round((raw.habitsToday / raw.habitsTotal) * 100) : 0;

  const items = [
    { label: "Workouts", value: raw.workoutsThisWeek, max: 7, color: "#C4614A", icon: Dumbbell },
    { label: "Habits Today", value: raw.habitsToday, max: raw.habitsTotal || 1, color: "#D4A853", icon: Zap },
    { label: "Tasks Done", value: raw.tasksTodayDone, max: Math.max(raw.tasksTodayDone + raw.tasksTodo, 1), color: "#7A9E7E", icon: Check },
  ];

  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Weekly Snapshot</h3>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const pct = Math.min((item.value / item.max) * 100, 100);
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center gap-1.5">
                <item.icon size={12} style={{ color: item.color }} />
                <span className="text-[10px] font-mono uppercase tracking-wider opacity-40" style={{ color: "var(--ink)" }}>{item.label}</span>
              </div>
              <div className="text-2xl font-display" style={{ color: item.color }}>{item.value}</div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Home ─────────────────────────────────────────────────────────────────

interface HomeProps {
  tasks: Task[];
  habits: Habit[];
  streak: number;
  onTaskToggle: (id: number, done: boolean) => void;
  onHabitToggle: (id: number) => void;
  onNavigate: (tab: string) => void;
  onUpdate: () => void;
}

export default function Home({ tasks, habits, streak, onTaskToggle, onHabitToggle, onNavigate, onUpdate }: HomeProps) {
  const [momentum, setMomentum] = useState<MomentumData | null>(null);
  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    fetch("/api/momentum")
      .then((r) => r.ok && r.json())
      .then(setMomentum)
      .catch(() => {});
  }, [tasks, habits]);

  async function handleHabitToggle(id: number) {
    await fetch(`/api/habits/${id}`, { method: "POST" });
    onUpdate();
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="space-y-4">
        {/* Greeting + Momentum */}
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {streak >= 2 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono animate-fade-in"
                  style={{ background: "rgba(212,168,83,0.12)", color: "#D4A853", border: "1px solid rgba(212,168,83,0.2)" }}>
                  <Flame size={11} className="animate-flicker" />
                  <span>{streak} day streak</span>
                </div>
              )}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl leading-tight" style={{ color: "var(--ink)" }}>
              {greeting}, Chris.
            </h1>
            <p className="mt-2 text-sm font-mono opacity-50 leading-relaxed" style={{ color: "var(--ink)" }}>
              {momentum?.subtitle || "Ready to build momentum today."}
            </p>
          </div>
          {momentum && <MomentumRing score={momentum.momentum} />}
        </div>

        {/* Momentum Breakdown */}
        {momentum && (
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Tasks", score: momentum.breakdown.tasks, max: 30 },
              { label: "Habits", score: momentum.breakdown.habits, max: 25 },
              { label: "Workouts", score: momentum.breakdown.workouts, max: 20 },
              { label: "Journal", score: momentum.breakdown.journal, max: 15 },
              { label: "Reading", score: momentum.breakdown.reading, max: 10 },
            ].map((item) => {
              const pct = Math.round((item.score / item.max) * 100);
              const active = item.score > 0;
              return (
                <div key={item.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono transition-all"
                  style={{ background: active ? "rgba(212,168,83,0.1)" : "var(--bg-muted)", color: active ? "#D4A853" : "var(--ink)", opacity: active ? 1 : 0.35, border: `1px solid ${active ? "rgba(212,168,83,0.2)" : "transparent"}` }}>
                  <div className="w-1 h-1 rounded-full" style={{ background: active ? "#D4A853" : "var(--ink-muted)" }} />
                  {item.label}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="ornament-divider opacity-15"><span>◆</span></div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TodayTasks tasks={tasks} onToggle={onTaskToggle} onNavigate={() => onNavigate("tasks")} />
        <TodayHabits habits={habits} onToggle={handleHabitToggle} onNavigate={() => onNavigate("habits")} />
      </div>

      {/* Weekly Snapshot */}
      {momentum && <WeeklySnapshot raw={momentum.raw} />}

      {/* Calendar */}
      <CalendarWidget />
    </div>
  );
}
