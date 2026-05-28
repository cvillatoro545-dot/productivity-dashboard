"use client";

import { useState } from "react";
import { Task, Priority, TaskStatus } from "@/lib/types";
import { Plus, Trash2, Check, Circle, Clock, GripVertical } from "lucide-react";
import { format, isToday, isPast, parseISO } from "date-fns";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TasksPanelProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  onUpdate: () => void;
}

const priorityConfig = {
  high: { label: "High", color: "text-rust" },
  medium: { label: "Medium", color: "text-amber-accent" },
  low: { label: "Low", color: "text-sage" },
};

const statusConfig = {
  todo: { label: "To Do", icon: Circle },
  in_progress: { label: "In Progress", icon: Clock },
  done: { label: "Done", icon: Check },
};

function SortableTask({ task, onStatusChange, onDelete }: {
  task: Task; onStatusChange: (id: number, status: TaskStatus) => void; onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isDue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== "done";
  const isDueToday = task.due_date && isToday(parseISO(task.due_date));
  const p = priorityConfig[task.priority];
  const StatusIcon = statusConfig[task.status].icon;
  const nextStatus = (s: TaskStatus): TaskStatus => s === "todo" ? "in_progress" : s === "in_progress" ? "done" : "todo";

  return (
    <div ref={setNodeRef} style={style} className={`card card-hover p-4 priority-${task.priority} group`}>
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-30 hover:opacity-60 transition-opacity flex-shrink-0">
          <GripVertical size={14} style={{ color: "var(--ink)" }} />
        </div>
        <button onClick={() => onStatusChange(task.id, nextStatus(task.status))} className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.status === "done" ? "bg-sage border-sage text-white" : task.status === "in_progress" ? "bg-amber-accent/20 border-amber-accent text-amber-accent" : "text-transparent hover:text-amber-accent"}`} style={{ borderColor: task.status === "todo" ? "var(--border)" : undefined }}>
          <StatusIcon size={10} strokeWidth={3} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className={`font-display text-base leading-tight ${task.status === "done" ? "line-through opacity-35" : ""}`} style={{ color: "var(--ink)" }}>{task.title}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${p.color} bg-current/10`}>{p.label}</span>
              <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-rust transition-all"><Trash2 size={12} /></button>
            </div>
          </div>
          {task.description && <p className="text-sm mt-0.5 leading-snug opacity-45" style={{ color: "var(--ink)" }}>{task.description}</p>}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>{statusConfig[task.status].label}</span>
            {task.due_date && (
              <span className={`text-[10px] font-mono ${isDue ? "text-rust font-medium" : isDueToday ? "text-amber-accent" : "opacity-35"}`} style={{ color: (!isDue && !isDueToday) ? "var(--ink)" : undefined }}>
                {isDue ? "Overdue · " : isDueToday ? "Today · " : "Due "}
                {format(parseISO(task.due_date), "MMM d")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TasksPanel({ tasks, setTasks, onUpdate }: TasksPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium" as Priority, due_date: "" });
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newTask) });
      if (res.ok) { await onUpdate(); setNewTask({ title: "", description: "", priority: "medium", due_date: "" }); setShowForm(false); }
    } finally { setSubmitting(false); }
  }

  async function updateStatus(id: number, status: TaskStatus) {
    const res = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (res.ok) setTasks(tasks.map((t) => t.id === id ? { ...t, status } : t));
  }

  async function deleteTask(id: number) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) setTasks(tasks.filter((t) => t.id !== id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    const newTasks = arrayMove(tasks, oldIndex, newIndex);
    setTasks(newTasks);
    const order = newTasks.map((t, i) => ({ id: t.id, sort_order: i }));
    await fetch("/api/tasks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order }) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          {(["all", "todo", "in_progress", "done"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="text-xs px-3 py-1.5 rounded-lg font-mono tracking-wide transition-all" style={{ background: filter === f ? "var(--ink)" : "transparent", color: filter === f ? "var(--bg)" : "var(--ink)", opacity: filter === f ? 1 : 0.5 }}>
              {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f === "todo" ? "To Do" : "Done"}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all group" style={{ background: "var(--ink)", color: "var(--bg)" }}>
          <Plus size={14} className="group-hover:rotate-90 transition-transform duration-200" /> New Task
        </button>
      </div>

      {showForm && (
        <div className="card p-4 animate-scale-in">
          <form onSubmit={handleCreate} className="space-y-3">
            <input type="text" placeholder="Task title..." value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full bg-transparent border-b pb-2 font-display text-lg focus:outline-none focus:border-amber-accent transition-colors" style={{ borderColor: "var(--border)", color: "var(--ink)" }} autoFocus />
            <input type="text" placeholder="Description (optional)..." value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="w-full bg-transparent text-sm focus:outline-none opacity-70" style={{ color: "var(--ink)" }} />
            <div className="flex items-center gap-3 pt-1">
              <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })} className="text-xs font-mono rounded-lg px-2 py-1.5 focus:outline-none" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
              <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} className="text-xs font-mono rounded-lg px-2 py-1.5 focus:outline-none" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
              <div className="flex gap-2 ml-auto">
                <button type="button" onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--ink)" }}>Cancel</button>
                <button type="submit" disabled={submitting || !newTask.title.trim()} className="text-xs px-4 py-1.5 bg-amber-accent text-ink font-medium rounded-lg hover:bg-amber-warm transition-colors disabled:opacity-40">Add Task</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-10 text-center"><div className="text-4xl mb-3 opacity-30">✦</div><p className="text-sm font-mono opacity-40" style={{ color: "var(--ink)" }}>{filter === "all" ? "No tasks yet. Add one above." : `No ${filter.replace("_", " ")} tasks.`}</p></div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {filtered.map((task) => <SortableTask key={task.id} task={task} onStatusChange={updateStatus} onDelete={deleteTask} />)}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
