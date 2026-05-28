"use client";

import { useState } from "react";
import { Task, Priority, TaskStatus } from "@/lib/types";
import { Plus, Trash2, Check, Circle, Clock, ChevronDown } from "lucide-react";
import { format, isToday, isPast, parseISO } from "date-fns";

interface TasksPanelProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  onUpdate: () => void;
}

const priorityConfig = {
  high: { label: "High", color: "text-rust", dot: "bg-rust" },
  medium: { label: "Medium", color: "text-amber-accent", dot: "bg-amber-accent" },
  low: { label: "Low", color: "text-sage", dot: "bg-sage" },
};

const statusConfig = {
  todo: { label: "To Do", icon: Circle },
  in_progress: { label: "In Progress", icon: Clock },
  done: { label: "Done", icon: Check },
};

export default function TasksPanel({ tasks, setTasks, onUpdate }: TasksPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Priority,
    due_date: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        await onUpdate();
        setNewTask({ title: "", description: "", priority: "medium", due_date: "" });
        setShowForm(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: number, status: TaskStatus) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
    }
  }

  async function deleteTask(id: number) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  }

  const nextStatus = (s: TaskStatus): TaskStatus =>
    s === "todo" ? "in_progress" : s === "in_progress" ? "done" : "todo";

  return (
    <div className="space-y-4">
      {/* Header + Add */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["all", "todo", "in_progress", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-mono tracking-wide transition-all ${
                filter === f
                  ? "bg-ink text-cream"
                  : "text-ink/50 hover:text-ink hover:bg-ink/5"
              }`}
            >
              {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f === "todo" ? "To Do" : "Done"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-cream rounded-lg text-sm font-medium hover:bg-ink/80 transition-all group"
        >
          <Plus size={14} className="group-hover:rotate-90 transition-transform duration-200" />
          New Task
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card p-4 animate-scale-in border-amber-accent/30">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Task title..."
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full bg-transparent border-b border-ink/15 pb-2 text-ink placeholder-ink/30 font-display text-lg focus:outline-none focus:border-amber-accent transition-colors"
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full bg-transparent text-sm text-ink/70 placeholder-ink/25 focus:outline-none border-none"
            />
            <div className="flex items-center gap-3 pt-1">
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                className="text-xs font-mono bg-cream-muted border border-ink/10 rounded-lg px-2 py-1.5 text-ink/70 focus:outline-none focus:border-amber-accent"
              >
                <option value="low">↓ Low</option>
                <option value="medium">→ Medium</option>
                <option value="high">↑ High</option>
              </select>
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="text-xs font-mono bg-cream-muted border border-ink/10 rounded-lg px-2 py-1.5 text-ink/70 focus:outline-none focus:border-amber-accent"
              />
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs px-3 py-1.5 text-ink/50 hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTask.title.trim()}
                  className="text-xs px-4 py-1.5 bg-amber-accent text-ink font-medium rounded-lg hover:bg-amber-warm transition-colors disabled:opacity-40"
                >
                  Add Task
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-3 opacity-30">✦</div>
            <p className="text-ink/40 text-sm font-mono">
              {filter === "all" ? "No tasks yet. Add one above." : `No ${filter.replace("_", " ")} tasks.`}
            </p>
          </div>
        ) : (
          filtered.map((task, i) => {
            const isDue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== "done";
            const isDueToday = task.due_date && isToday(parseISO(task.due_date));
            const p = priorityConfig[task.priority];
            const StatusIcon = statusConfig[task.status].icon;

            return (
              <div
                key={task.id}
                className={`card card-hover p-4 priority-${task.priority} group animate-fade-up`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  {/* Status Toggle */}
                  <button
                    onClick={() => updateStatus(task.id, nextStatus(task.status))}
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.status === "done"
                        ? "bg-sage border-sage text-cream"
                        : task.status === "in_progress"
                        ? "bg-amber-accent/20 border-amber-accent text-amber-accent"
                        : "border-ink/20 hover:border-amber-accent text-transparent hover:text-amber-accent"
                    }`}
                    title={`Mark as ${nextStatus(task.status)}`}
                  >
                    <StatusIcon size={10} strokeWidth={3} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`font-display text-base leading-tight ${
                        task.status === "done" ? "line-through text-ink/35" : "text-ink"
                      }`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          p.color
                        } bg-current/10`}>
                          {p.label}
                        </span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-ink/30 hover:text-rust transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-sm text-ink/45 mt-0.5 leading-snug">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-[10px] font-mono ${
                        task.status === "done" ? "text-ink/25" : "text-ink/40"
                      }`}>
                        {statusConfig[task.status].label}
                      </span>
                      {task.due_date && (
                        <span className={`text-[10px] font-mono ${
                          isDue ? "text-rust font-medium" : isDueToday ? "text-amber-accent" : "text-ink/35"
                        }`}>
                          {isDue ? "⚠ Overdue · " : isDueToday ? "Today · " : "Due "}
                          {format(parseISO(task.due_date), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
