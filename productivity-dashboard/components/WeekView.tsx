"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Dumbbell, BookOpen, Target, Check, Circle } from "lucide-react";
import { Task, Habit, GymLog, Book, JournalEntry } from "@/lib/types";

// ── Sound + Animation ─────────────────────────────────────────────────────────

function playCompletionSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // Sharp attack, quick decay — like a light punch
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.frequency.setValueAtTime(520, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.12);
    osc2.frequency.setValueAtTime(780, now);
    osc2.frequency.exponentialRampToValueAtTime(300, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc1.start(now); osc1.stop(now + 0.18);
    osc2.start(now); osc2.stop(now + 0.12);
  } catch {}
}

function PulseRing({ trigger }: { trigger: number }) {
  const [rings, setRings] = useState<number[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const id = Date.now();
    setRings((r) => [...r, id]);
    setTimeout(() => setRings((r) => r.filter((x) => x !== id)), 600);
  }, [trigger]);

  return (
    <>
      {rings.map((id) => (
        <span key={id} className="absolute inset-0 rounded-full pointer-events-none"
          style={{ animation: "pulseRing 0.6s ease-out forwards", border: "2px solid #D4A853", opacity: 1 }} />
      ))}
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(2.8); opacity: 0; }
        }
      `}</style>
    </>
  );
}

// ── Task Checklist ────────────────────────────────────────────────────────────

function TaskChecklist({ tasks, onToggle }: { tasks: Task[]; onToggle: (id: number, done: boolean) => void }) {
  const [pulses, setPulses] = useState<Record<number, number>>({});

  function handleCheck(task: Task) {
    const newDone = task.status !== "done";
    if (newDone) {
      playCompletionSound();
      setPulses((p) => ({ ...p, [task.id]: (p[task.id] || 0) + 1 }));
    }
    onToggle(task.id, newDone);
  }

  const active = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base" style={{ color: "var(--ink)" }}>Tasks</h3>
        <span className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>{done.length}/{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs font-mono opacity-30 py-2" style={{ color: "var(--ink)" }}>No tasks yet</p>
      ) : (
        <div className="space-y-1.5">
          {active.map((task) => (
            <button key={task.id} onClick={() => handleCheck(task)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-left">
              <div className="relative flex-shrink-0 w-5 h-5">
                <Circle size={18} className="opacity-25 group-hover:opacity-60 transition-opacity" style={{ color: "var(--ink)" }} />
                <PulseRing trigger={pulses[task.id] || 0} />
              </div>
              <span className="text-sm flex-1 leading-tight" style={{ color: "var(--ink)" }}>{task.title}</span>
              <span className={`text-[10px] font-mono opacity-0 group-hover:opacity-60 transition-opacity ${task.priority === "high" ? "text-rust" : task.priority === "medium" ? "text-amber-accent" : "text-sage"}`}>
                {task.priority}
              </span>
            </button>
          ))}
          {done.map((task) => (
            <button key={task.id} onClick={() => handleCheck(task)}
              className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left opacity-35">
              <Check size={18} className="flex-shrink-0 text-sage" />
              <span className="text-sm line-through" style={{ color: "var(--ink)" }}>{task.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Gym Tracker ───────────────────────────────────────────────────────────────

function GymTracker({ weekDays, gymLogs, onToggle }: {
  weekDays: Date[];
  gymLogs: GymLog[];
  onToggle: (date: string) => void;
}) {
  const loggedDates = gymLogs.map((l) => l.workout_date.split("T")[0]);
  const weekCount = weekDays.filter((d) => loggedDates.includes(format(d, "yyyy-MM-dd"))).length;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell size={14} className="text-rust" />
          <h3 className="font-display text-base" style={{ color: "var(--ink)" }}>Gym</h3>
        </div>
        <span className="text-xs font-mono text-rust">{weekCount}/7 days</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const logged = loggedDates.includes(dateStr);
          const today = isToday(day);
          return (
            <button key={dateStr} onClick={() => onToggle(dateStr)}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${logged ? "bg-rust text-white" : today ? "border border-rust/40" : "hover:bg-rust/10"}`}
              style={{ background: logged ? "#C4614A" : undefined }}>
              <span className="text-[10px] font-mono opacity-60">{format(day, "EEE")[0]}</span>
              <span className={`text-sm font-display ${logged ? "text-white" : ""}`} style={{ color: logged ? "white" : "var(--ink)" }}>
                {format(day, "d")}
              </span>
              {logged && <span className="text-[10px]">💪</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Weekly Focus ──────────────────────────────────────────────────────────────

function WeeklyFocus({ weekKey }: { weekKey: string }) {
  const storageKey = `weekFocus_${weekKey}`;
  const [focus, setFocus] = useState("");
  const [goals, setGoals] = useState(["", "", ""]);
  const [pulses, setPulses] = useState<number[]>([0, 0, 0]);
  const [checked, setChecked] = useState<boolean[]>([false, false, false]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const data = JSON.parse(saved);
      setFocus(data.focus || "");
      setGoals(data.goals || ["", "", ""]);
      setChecked(data.checked || [false, false, false]);
    } else {
      setFocus(""); setGoals(["", "", ""]); setChecked([false, false, false]);
    }
  }, [storageKey]);

  function save(newFocus: string, newGoals: string[], newChecked: boolean[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify({ focus: newFocus, goals: newGoals, checked: newChecked }));
    }, 500);
  }

  function handleGoalCheck(i: number) {
    const newChecked = [...checked];
    newChecked[i] = !newChecked[i];
    if (newChecked[i]) {
      playCompletionSound();
      const newPulses = [...pulses];
      newPulses[i] = (newPulses[i] || 0) + 1;
      setPulses(newPulses);
    }
    setChecked(newChecked);
    save(focus, goals, newChecked);
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Target size={14} className="text-amber-accent" />
        <h3 className="font-display text-base" style={{ color: "var(--ink)" }}>Weekly Focus</h3>
      </div>
      <input value={focus} onChange={(e) => { setFocus(e.target.value); save(e.target.value, goals, checked); }}
        placeholder="What's your main focus this week?"
        className="w-full bg-transparent border-b pb-1.5 text-sm focus:outline-none focus:border-amber-accent transition-colors"
        style={{ borderColor: "var(--border)", color: "var(--ink)" }} />
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest opacity-40" style={{ color: "var(--ink)" }}>Goals</p>
        {goals.map((g, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="relative flex-shrink-0 w-5 h-5">
              <button onClick={() => handleGoalCheck(i)} className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                style={{ borderColor: checked[i] ? "#7A9E7E" : "var(--border)", background: checked[i] ? "#7A9E7E" : "transparent" }}>
                {checked[i] && <Check size={10} strokeWidth={3} className="text-white" />}
              </button>
              <PulseRing trigger={pulses[i] || 0} />
            </div>
            <input value={g} onChange={(e) => { const ng = [...goals]; ng[i] = e.target.value; setGoals(ng); save(focus, ng, checked); }}
              placeholder={`Goal ${i + 1}`} disabled={checked[i]}
              className={`flex-1 bg-transparent text-sm focus:outline-none ${checked[i] ? "line-through opacity-40" : ""}`}
              style={{ color: "var(--ink)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Habits This Week ──────────────────────────────────────────────────────────

function HabitsWidget({ habits, weekDays }: { habits: Habit[]; weekDays: Date[] }) {
  if (habits.length === 0) return null;
  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-display text-base" style={{ color: "var(--ink)" }}>Habits</h3>
      <div className="space-y-2">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0"
              style={{ background: habit.color + "20", color: habit.color }}>
              {habit.icon}
            </div>
            <span className="text-sm flex-1 truncate" style={{ color: "var(--ink)" }}>{habit.name}</span>
            <div className="flex gap-1">
              {weekDays.map((day) => {
                const isToday_ = isToday(day);
                const isFuture = day > new Date();
                return (
                  <div key={format(day, "d")} className={`w-5 h-5 rounded-sm transition-all ${isFuture ? "opacity-20" : ""}`}
                    style={{ background: (habit.completedToday && isToday_) ? habit.color : isToday_ ? "var(--bg-muted)" : "var(--bg-muted)", opacity: isFuture ? 0.2 : undefined }}>
                    {habit.completedToday && isToday_ && (
                      <div className="w-full h-full rounded-sm" style={{ background: habit.color }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reflection ────────────────────────────────────────────────────────────────

function ReflectionWidget({ weekKey }: { weekKey: string }) {
  const storageKey = `weekReflect_${weekKey}`;
  const [text, setText] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setText(saved || "");
  }, [storageKey]);

  function handleChange(val: string) {
    setText(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => localStorage.setItem(storageKey, val), 600);
  }

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-display text-base" style={{ color: "var(--ink)" }}>Week Reflection</h3>
      <textarea value={text} onChange={(e) => handleChange(e.target.value)}
        placeholder="How did this week go? What did you learn? What will you do differently?"
        rows={4} className="w-full bg-transparent text-sm focus:outline-none leading-relaxed resize-none"
        style={{ color: "var(--ink)" }} />
      {text && <p className="text-[10px] font-mono opacity-30 text-right" style={{ color: "var(--ink)" }}>Auto-saved</p>}
    </div>
  );
}

// ── Currently Reading ─────────────────────────────────────────────────────────

function CurrentlyReadingWidget({ books }: { books: Book[] }) {
  const reading = books.filter((b) => b.status === "reading");

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen size={14} className="text-amber-accent" />
        <h3 className="font-display text-base" style={{ color: "var(--ink)" }}>Currently Reading</h3>
      </div>
      {reading.length === 0 ? (
        <p className="text-xs font-mono opacity-30 py-1" style={{ color: "var(--ink)" }}>No books in progress</p>
      ) : (
        <div className="space-y-3">
          {reading.map((book) => (
            <div key={book.id} className="flex items-center gap-3">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
              ) : (
                <div className="w-10 h-14 rounded flex-shrink-0 flex items-center justify-center" style={{ background: "var(--bg-muted)" }}>
                  <BookOpen size={14} className="opacity-30" style={{ color: "var(--ink)" }} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-display leading-tight line-clamp-2" style={{ color: "var(--ink)" }}>{book.title}</p>
                <p className="text-xs opacity-40 mt-0.5 font-mono" style={{ color: "var(--ink)" }}>{book.author}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main WeekView ─────────────────────────────────────────────────────────────

interface WeekViewProps {
  tasks: Task[];
  habits: Habit[];
  onTaskToggle: (id: number, done: boolean) => void;
}

export default function WeekView({ tasks, habits, onTaskToggle }: WeekViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [gymLogs, setGymLogs] = useState<GymLog[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  const baseDate = addWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekKey = format(weekStart, "yyyy-MM-dd");
  const isCurrentWeek = weekOffset === 0;

  useEffect(() => {
    fetch("/api/gym").then((r) => r.ok && r.json()).then(setGymLogs).catch(() => {});
    fetch("/api/books?saved=true").then((r) => r.ok && r.json()).then(setBooks).catch(() => {});
  }, []);

  async function handleGymToggle(date: string) {
    const res = await fetch("/api/gym", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workout_date: date }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.logged) {
        setGymLogs((prev) => [...prev, { id: data.id, workout_date: date, created_at: new Date().toISOString() }]);
      } else {
        setGymLogs((prev) => prev.filter((l) => l.workout_date.split("T")[0] !== date));
      }
    }
  }

  const weekTasks = tasks.filter((t) => {
    if (isCurrentWeek) return t.status !== "done" || (t.updated_at && t.updated_at.startsWith(weekKey.slice(0, 7)));
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="p-2 rounded-lg transition-all hover:opacity-70" style={{ background: "var(--bg-muted)", color: "var(--ink)" }}>
            <ChevronLeft size={16} />
          </button>
          <div>
            <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>
              {isCurrentWeek ? "This Week" : weekOffset === -1 ? "Last Week" : format(weekStart, "MMM d")}
            </h2>
            <p className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </p>
          </div>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="p-2 rounded-lg transition-all hover:opacity-70" style={{ background: "var(--bg-muted)", color: "var(--ink)" }}>
            <ChevronRight size={16} />
          </button>
        </div>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all" style={{ background: "var(--bg-muted)", color: "var(--ink)", opacity: 0.6 }}>
            Back to today
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <TaskChecklist tasks={weekTasks} onToggle={onTaskToggle} />
          <GymTracker weekDays={weekDays} gymLogs={gymLogs} onToggle={handleGymToggle} />
          <CurrentlyReadingWidget books={books} />
        </div>
        <div className="space-y-4">
          <WeeklyFocus weekKey={weekKey} />
          <HabitsWidget habits={habits} weekDays={weekDays} />
          <ReflectionWidget weekKey={weekKey} />
        </div>
      </div>
    </div>
  );
}
