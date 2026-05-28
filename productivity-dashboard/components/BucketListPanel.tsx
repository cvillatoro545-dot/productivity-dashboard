"use client";

import { useState, useEffect } from "react";
import { BucketItem, BucketCategory } from "@/lib/types";
import { Plus, Trash2, Check, Circle } from "lucide-react";
import { format, parseISO } from "date-fns";

const CATEGORIES: { key: BucketCategory; color: string; emoji: string }[] = [
  { key: "Travel",     color: "#5B7FA6", emoji: "✈️" },
  { key: "Experience", color: "#D4A853", emoji: "⚡" },
  { key: "Career",     color: "#7A9E7E", emoji: "🎯" },
  { key: "Personal",   color: "#9B6B9E", emoji: "🌱" },
  { key: "Health",     color: "#C4614A", emoji: "💪" },
  { key: "Creative",   color: "#C4845A", emoji: "✍️" },
  { key: "Financial",  color: "#6B9E9E", emoji: "💰" },
];

function getCat(key: BucketCategory) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[3];
}

export default function BucketListPanel() {
  const [items, setItems] = useState<BucketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BucketCategory | "all">("all");
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<BucketCategory>("Personal");
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    const res = await fetch("/api/bucket");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText, category: newCategory }),
      });
      if (res.ok) {
        const item = await res.json();
        setItems((prev) => [item, ...prev]);
        setNewText("");
        setShowAdd(false);
      }
    } finally { setSubmitting(false); }
  }

  async function handleToggle(item: BucketItem) {
    const res = await fetch("/api/bucket", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, completed: !item.completed }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((i) => i.id === item.id ? updated : i));
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/bucket?id=${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);
  const total = items.length;
  const done = items.filter((i) => i.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Group by category for display
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: filtered.filter((i) => i.category === cat.key),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      {/* Progress Header */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl" style={{ color: "var(--ink)" }}>Bucket List</h2>
            <p className="text-xs font-mono opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>
              {done} of {total} completed
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl" style={{ color: pct === 100 ? "#7A9E7E" : pct > 50 ? "#D4A853" : "var(--ink)" }}>
              {pct}<span className="text-xl opacity-50">%</span>
            </div>
          </div>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
          <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
            style={{ width: `${pct}%`, background: pct === 100 ? "#7A9E7E" : "#D4A853" }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
          </div>
        </div>
        {/* Mini category breakdown */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat.key).length;
            if (count === 0) return null;
            const catDone = items.filter((i) => i.category === cat.key && i.completed).length;
            return (
              <div key={cat.key} className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono"
                style={{ background: cat.color + "15", color: cat.color }}>
                <span>{cat.emoji}</span>
                <span>{catDone}/{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => setFilter("all")}
            className="text-xs px-3 py-1.5 rounded-lg font-mono transition-all"
            style={{ background: filter === "all" ? "var(--ink)" : "var(--bg-muted)", color: filter === "all" ? "var(--bg)" : "var(--ink)", opacity: filter === "all" ? 1 : 0.6 }}>
            All ({total})
          </button>
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat.key).length;
            if (count === 0) return null;
            return (
              <button key={cat.key} onClick={() => setFilter(cat.key)}
                className="text-xs px-3 py-1.5 rounded-lg font-mono transition-all flex items-center gap-1"
                style={{ background: filter === cat.key ? cat.color : "var(--bg-muted)", color: filter === cat.key ? "white" : "var(--ink)", opacity: filter === cat.key ? 1 : 0.6 }}>
                {cat.emoji} {cat.key}
              </button>
            );
          })}
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: "var(--ink)", color: "var(--bg)" }}>
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="card p-4 animate-scale-in">
          <form onSubmit={handleAdd} className="space-y-3">
            <input type="text" placeholder="What do you want to do before you die?"
              value={newText} onChange={(e) => setNewText(e.target.value)}
              className="w-full bg-transparent border-b pb-2 font-display text-lg focus:outline-none focus:border-amber-accent transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--ink)" }} autoFocus />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat.key} type="button" onClick={() => setNewCategory(cat.key)}
                  className="px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5"
                  style={{ background: newCategory === cat.key ? cat.color : "var(--bg-muted)", color: newCategory === cat.key ? "white" : "var(--ink)", opacity: newCategory === cat.key ? 1 : 0.6 }}>
                  {cat.emoji} {cat.key}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowAdd(false)}
                className="text-xs px-3 py-1.5 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--ink)" }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting || !newText.trim()}
                className="text-xs px-4 py-1.5 font-medium rounded-lg transition-colors disabled:opacity-40"
                style={{ background: getCat(newCategory).color, color: "white" }}>
                Add to List
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items grouped by category */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-14 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <div className="text-5xl opacity-20">🌍</div>
          <p className="font-display text-lg opacity-40" style={{ color: "var(--ink)" }}>
            {total === 0 ? "Your bucket list is empty" : "No items in this category"}
          </p>
          <p className="text-sm font-mono opacity-30" style={{ color: "var(--ink)" }}>
            {total === 0 ? "Start dreaming big — add your first item" : "Try a different filter"}
          </p>
        </div>
      ) : filter === "all" ? (
        // Grouped view when showing all
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{group.emoji}</span>
                <span className="text-xs font-mono uppercase tracking-widest" style={{ color: group.color }}>
                  {group.key}
                </span>
                <div className="flex-1 h-px" style={{ background: group.color + "30" }} />
                <span className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>
                  {group.items.filter((i) => i.completed).length}/{group.items.length}
                </span>
              </div>
              {group.items.map((item, i) => (
                <BucketItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        // Flat list when filtered
        <div className="space-y-2">
          {filtered.map((item) => (
            <BucketItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function BucketItemRow({ item, onToggle, onDelete }: {
  item: BucketItem;
  onToggle: (item: BucketItem) => void;
  onDelete: (id: number) => void;
}) {
  const cat = getCat(item.category);
  return (
    <div className={`card card-hover p-4 flex items-start gap-3 group transition-all ${item.completed ? "opacity-60" : ""}`}>
      <button onClick={() => onToggle(item)}
        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
        style={{ borderColor: item.completed ? cat.color : "var(--border)", background: item.completed ? cat.color : "transparent" }}>
        {item.completed ? <Check size={10} strokeWidth={3} className="text-white" /> : <Circle size={10} className="opacity-0 group-hover:opacity-30 transition-opacity" style={{ color: cat.color }} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${item.completed ? "line-through" : ""}`} style={{ color: "var(--ink)" }}>
          {item.text}
        </p>
        {item.completed && item.completed_at && (
          <p className="text-[10px] font-mono opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>
            ✓ Completed {format(parseISO(item.completed_at), "MMM d, yyyy")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full opacity-70"
          style={{ background: cat.color + "20", color: cat.color }}>
          {cat.emoji} {item.category}
        </span>
        <button onClick={() => onDelete(item.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-rust transition-all">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
