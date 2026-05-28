"use client";

import { useEffect, useState, useCallback } from "react";
import { Task, Habit, Note, DashboardStats } from "@/lib/types";
import { Home as HomeIcon, CalendarDays, Target, Star, BookOpen, BookMarked, PenLine, Moon, Sun } from "lucide-react";
import HomeDashboard from "@/components/HomeDashboard";
import TasksPanel from "@/components/TasksPanel";
import HabitsPanel from "@/components/HabitsPanel";
import NotesPanel from "@/components/NotesPanel";
import GoalsPanel from "@/components/GoalsPanel";
import JournalPanel from "@/components/JournalPanel";
import BooksPanel from "@/components/BooksPanel";
import WeekView from "@/components/WeekView";
import QuarterView from "@/components/QuarterView";
import BucketListPanel from "@/components/BucketListPanel";
import YearView from "@/components/YearView";
import QuickCapture from "@/components/QuickCapture";
import WeatherWidget from "@/components/WeatherWidget";
import { format } from "date-fns";

type Page = "home" | "week" | "quarter" | "year" | "knowledge" | "journal" | "tasks" | "habits" | "notes" | "goals" | "books" | "bucket";

const NAV_ITEMS = [
  { id: "home" as Page,      label: "Home",      icon: HomeIcon,     shortcut: "H" },
  { id: "week" as Page,      label: "Week",      icon: CalendarDays, shortcut: "W" },
  { id: "quarter" as Page,   label: "Quarter",   icon: Target,       shortcut: "Q" },
  { id: "year" as Page,      label: "Year",      icon: Star,         shortcut: "Y" },
  { id: "knowledge" as Page, label: "Knowledge", icon: BookOpen,     shortcut: "K" },
  { id: "journal" as Page,   label: "Journal",   icon: PenLine,      shortcut: "J" },
];

// Knowledge sub-tabs
const KNOWLEDGE_TABS = [
  { id: "books" as Page,  label: "Books" },
  { id: "notes" as Page,  label: "Notes" },
  { id: "bucket" as Page, label: "Bucket List" },
];

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>("home");
  const [knowledgeTab, setKnowledgeTab] = useState<Page>("books");
  const [darkMode, setDarkMode] = useState(false);
  const [streak, setStreak] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("focusDark");
    if (saved === "true" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    // Fetch streak
    fetch("/api/streak").then((r) => r.ok && r.json()).then((d) => d && setStreak(d.streak)).catch(() => {});
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

  async function handleTaskToggle(id: number, done: boolean) {
    const status = done ? "done" : "todo";
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t)); fetchAll(); }
  }

  const today = new Date();
  const pageTitle = NAV_ITEMS.find((n) => n.id === page)?.label || "Knowledge";

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-56 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:relative lg:flex ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "var(--bg-soft)", borderRight: "1px solid var(--border)" }}>

        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-accent text-xl">✦</span>
            <span className="font-display text-lg" style={{ color: "var(--ink)" }}>Focus</span>
          </div>
          <p className="text-[10px] font-mono tracking-widest uppercase opacity-30 mt-0.5" style={{ color: "var(--ink)" }}>
            Personal OS
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = page === item.id || (item.id === "knowledge" && ["books","notes","bucket"].includes(page));
            return (
              <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: active ? "var(--ink)" : "transparent", color: active ? "var(--bg)" : "var(--ink)", opacity: active ? 1 : 0.55 }}>
                <item.icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 space-y-3">
          <WeatherWidget />
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono opacity-30" style={{ color: "var(--ink)" }}>
              {format(today, "MMM d")}
            </div>
            <button onClick={toggleDark} className="p-1.5 rounded-lg transition-all hover:opacity-70"
              style={{ color: "var(--ink)", opacity: 0.4 }}>
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 lg:hidden" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar (mobile) */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-10"
          style={{ background: "var(--bg-soft)", borderColor: "var(--border)" }}>
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg" style={{ color: "var(--ink)" }}>
            <span className="text-lg">☰</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-amber-accent">✦</span>
            <span className="font-display" style={{ color: "var(--ink)" }}>{pageTitle}</span>
          </div>
          <button onClick={toggleDark} className="p-1.5 rounded-lg opacity-50" style={{ color: "var(--ink)" }}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Page Content */}
        <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 pb-24">

          {/* Knowledge sub-nav */}
          {(page === "knowledge" || ["books","notes","bucket"].includes(page)) && (
            <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "var(--bg-muted)" }}>
              {KNOWLEDGE_TABS.map((tab) => (
                <button key={tab.id} onClick={() => { setPage(tab.id); }}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: page === tab.id ? "var(--ink)" : "transparent", color: page === tab.id ? "var(--bg)" : "var(--ink)", opacity: page === tab.id ? 1 : 0.55 }}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Render Page */}
          {page === "home" && (
            <HomeDashboard
              tasks={tasks}
              habits={habits}
              streak={streak}
              onTaskToggle={handleTaskToggle}
              onHabitToggle={async (id) => { await fetch(`/api/habits/${id}`, { method: "POST" }); fetchAll(); }}
              onNavigate={(tab) => setPage(tab as Page)}
              onUpdate={fetchAll}
            />
          )}
          {page === "week"    && <WeekView tasks={tasks} habits={habits} onTaskToggle={handleTaskToggle} />}
          {page === "quarter" && <QuarterView />}
          {page === "year"    && <YearView />}
          {page === "journal" && <JournalPanel />}
          {page === "books"   && <BooksPanel />}
          {page === "notes"   && <NotesPanel notes={notes} setNotes={setNotes} onUpdate={fetchAll} />}
          {page === "bucket"  && <BucketListPanel />}
          {page === "knowledge" && <BooksPanel />}

          {/* Hidden but accessible tabs */}
          {page === "tasks"   && <TasksPanel tasks={tasks} setTasks={setTasks} onUpdate={fetchAll} />}
          {page === "habits"  && <HabitsPanel habits={habits} setHabits={setHabits} onUpdate={fetchAll} />}
          {page === "goals"   && <GoalsPanel onUpdate={fetchAll} />}
        </div>
      </main>

      {/* Quick Capture */}
      <QuickCapture onCapture={fetchAll} />
    </div>
  );
}
