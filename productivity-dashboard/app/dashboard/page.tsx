"use client";

import { useEffect, useState, useCallback } from "react";
import { Task, Habit, Note, DashboardStats } from "@/lib/types";
import StatsBar from "@/components/StatsBar";
import TasksPanel from "@/components/TasksPanel";
import HabitsPanel from "@/components/HabitsPanel";
import NotesPanel from "@/components/NotesPanel";
import GoalsPanel from "@/components/GoalsPanel";
import JournalPanel from "@/components/JournalPanel";
import ProductivityChart from "@/components/ProductivityChart";
import Header from "@/components/Header";

type Tab = "tasks" | "habits" | "notes" | "goals" | "journal";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("focusDark");
    if (saved === "true" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("focusDark", String(next));
  }

  const fetchAll = useCallback(async () => {
    try {
      const [tasksRes, habitsRes, notesRes, statsRes] = await Promise.all([
        fetch("/api/tasks"), fetch("/api/habits"), fetch("/api/notes"), fetch("/api/stats"),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (habitsRes.ok) setHabits(await habitsRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const today = new Date();

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: "tasks", label: "Tasks", badge: stats ? String(stats.tasksTodo + stats.tasksInProgress) : undefined },
    { id: "habits", label: "Habits", badge: stats ? `${stats.habitsCompletedToday}/${stats.habitsTotal}` : undefined },
    { id: "notes", label: "Notes" },
    { id: "goals", label: "Goals" },
    { id: "journal", label: "Journal" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: "var(--amber)" }} />
        <div className="absolute top-1/2 -left-32 w-72 h-72 rounded-full opacity-5 blur-3xl" style={{ background: "#7A9E7E" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <Header today={today} darkMode={darkMode} toggleDark={toggleDark} />

        <div className="stagger-child animate-fade-up delay-200 mb-6">
          <StatsBar stats={stats} loading={loading} />
        </div>

        <div className="stagger-child animate-fade-up delay-250 mb-6">
          <ProductivityChart />
        </div>

        <div className="stagger-child animate-fade-up delay-300 mb-6">
          <nav className="flex items-center gap-1 p-1 rounded-xl w-fit overflow-x-auto" style={{ background: "var(--bg-muted)" }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize whitespace-nowrap flex items-center gap-1.5"
                style={{ background: activeTab === tab.id ? "var(--ink)" : "transparent", color: activeTab === tab.id ? "var(--bg)" : "var(--ink)", opacity: activeTab === tab.id ? 1 : 0.55 }}>
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: activeTab === tab.id ? "rgba(255,255,255,0.15)" : "var(--border)", color: "inherit" }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="stagger-child animate-fade-up delay-400">
          {activeTab === "tasks" && <TasksPanel tasks={tasks} setTasks={setTasks} onUpdate={fetchAll} />}
          {activeTab === "habits" && <HabitsPanel habits={habits} setHabits={setHabits} onUpdate={fetchAll} />}
          {activeTab === "notes" && <NotesPanel notes={notes} setNotes={setNotes} onUpdate={fetchAll} />}
          {activeTab === "goals" && <GoalsPanel onUpdate={fetchAll} />}
          {activeTab === "journal" && <JournalPanel />}
        </div>
      </div>
    </div>
  );
}
