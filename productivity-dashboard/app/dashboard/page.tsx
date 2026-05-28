"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Task, Habit, Note, DashboardStats } from "@/lib/types";
import StatsBar from "@/components/StatsBar";
import TasksPanel from "@/components/TasksPanel";
import HabitsPanel from "@/components/HabitsPanel";
import NotesPanel from "@/components/NotesPanel";
import Header from "@/components/Header";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "habits" | "notes">("tasks");

  const fetchAll = useCallback(async () => {
    try {
      const [tasksRes, habitsRes, notesRes, statsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/habits"),
        fetch("/api/notes"),
        fetch("/api/stats"),
      ]);

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (habitsRes.ok) setHabits(await habitsRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const today = new Date();

  return (
    <div className="min-h-screen bg-cream">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-accent/5 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-72 h-72 rounded-full bg-sage/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-rust/4 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <Header today={today} />

        {/* Stats Bar */}
        <div className="stagger-child animate-fade-up delay-200 mb-8">
          <StatsBar stats={stats} loading={loading} />
        </div>

        {/* Tab Navigation */}
        <div className="stagger-child animate-fade-up delay-300 mb-6">
          <nav className="flex items-center gap-1 p-1 bg-cream-muted/60 rounded-xl border border-cream-muted w-fit">
            {(["tasks", "habits", "notes"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                  activeTab === tab
                    ? "bg-ink text-cream shadow-sm"
                    : "text-ink/60 hover:text-ink hover:bg-cream-muted/60"
                }`}
              >
                {tab}
                {tab === "tasks" && stats && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? "bg-cream/20 text-cream/80" : "bg-ink/10 text-ink/50"
                  }`}>
                    {stats.tasksTodo + stats.tasksInProgress}
                  </span>
                )}
                {tab === "habits" && stats && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? "bg-cream/20 text-cream/80" : "bg-ink/10 text-ink/50"
                  }`}>
                    {stats.habitsCompletedToday}/{stats.habitsTotal}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Panels */}
        <div className="stagger-child animate-fade-up delay-400">
          {activeTab === "tasks" && (
            <TasksPanel tasks={tasks} setTasks={setTasks} onUpdate={fetchAll} />
          )}
          {activeTab === "habits" && (
            <HabitsPanel habits={habits} setHabits={setHabits} onUpdate={fetchAll} />
          )}
          {activeTab === "notes" && (
            <NotesPanel notes={notes} setNotes={setNotes} onUpdate={fetchAll} />
          )}
        </div>
      </div>
    </div>
  );
}
