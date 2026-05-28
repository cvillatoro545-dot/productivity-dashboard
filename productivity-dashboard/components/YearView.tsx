"use client";

import { useState, useEffect, useRef } from "react";
import { YearReflection, YearBucket, YearGoal } from "@/lib/types";
import { Plus, Trash2, Check, ChevronDown, Pencil, X } from "lucide-react";

const YEAR_COLORS = ["#D4A853","#C4614A","#7A9E7E","#5B7FA6","#9B6B9E","#C4845A","#6B9E9E"];

const GOAL_CATEGORIES = [
  { key: "Finance",       color: "#D4A853" },
  { key: "Health",        color: "#C4614A" },
  { key: "Business",      color: "#5B7FA6" },
  { key: "Personal",      color: "#9B6B9E" },
  { key: "Relationships", color: "#7A9E7E" },
  { key: "Growth",        color: "#C4845A" },
];

type YearGoalCategory = "Finance" | "Health" | "Business" | "Personal" | "Relationships" | "Growth";

// ── Year Dropdown ─────────────────────────────────────────────────────────────

function YearPicker({ year, onChange }: { year: number; onChange: (y: number) => void }) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 font-display text-4xl sm:text-5xl leading-tight group"
        style={{ color: "var(--ink)" }}>
        {year}
        <ChevronDown size={20} className={`opacity-30 group-hover:opacity-70 transition-all mt-2 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 z-20 rounded-xl shadow-xl py-1 min-w-[120px] animate-scale-in"
          style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}>
          {years.map((y) => (
            <button key={y} onClick={() => { onChange(y); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm font-mono transition-all hover:opacity-70 ${y === year ? "font-bold" : ""}`}
              style={{ color: y === year ? "#D4A853" : "var(--ink)", background: y === year ? "#D4A85310" : "transparent" }}>
              {y} {y === currentYear && <span className="text-[10px] opacity-40 ml-1">current</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reflection Questions ──────────────────────────────────────────────────────

const REFLECTION_QUESTIONS = [
  { key: "vision",           label: "Vision",           placeholder: "What does your ideal life look like at the end of this year?", icon: "🔭" },
  { key: "non_negotiables",  label: "Non-Negotiables",  placeholder: "What habits, practices, or principles will you protect no matter what?", icon: "🏔️" },
  { key: "focus",            label: "Main Focus",       placeholder: "If you could only accomplish one thing this year, what would it be?", icon: "🎯" },
  { key: "change",           label: "What Must Change", placeholder: "What patterns or behaviors are holding you back that you commit to changing?", icon: "🔥" },
] as const;

function ReflectionSection({ reflection, year, onSave }: {
  reflection: YearReflection | null;
  year: number;
  onSave: (data: Partial<YearReflection>) => void;
}) {
  const [values, setValues] = useState({
    vision: "", non_negotiables: "", focus: "", change: "",
  });
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (reflection) {
      setValues({
        vision: reflection.vision || "",
        non_negotiables: reflection.non_negotiables || "",
        focus: reflection.focus || "",
        change: reflection.change || "",
      });
    } else {
      setValues({ vision: "", non_negotiables: "", focus: "", change: "" });
    }
  }, [reflection, year]);

  function handleChange(key: string, val: string) {
    const next = { ...values, [key]: val };
    setValues(next);
    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => {
      setSavedKey(key);
      onSave(next);
      setTimeout(() => setSavedKey(null), 1500);
    }, 800);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {REFLECTION_QUESTIONS.map((q) => (
        <div key={q.key} className="card p-5 space-y-3 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{q.icon}</span>
              <span className="text-xs font-mono uppercase tracking-widest opacity-50" style={{ color: "var(--ink)" }}>
                {q.label}
              </span>
            </div>
            {savedKey === q.key && (
              <span className="text-[10px] font-mono text-sage animate-fade-in">saved ✓</span>
            )}
          </div>
          <textarea
            value={values[q.key]}
            onChange={(e) => handleChange(q.key, e.target.value)}
            placeholder={q.placeholder}
            rows={4}
            className="w-full bg-transparent text-sm leading-relaxed focus:outline-none resize-none placeholder-current"
            style={{ color: "var(--ink)", opacity: values[q.key] ? 1 : 0.35 }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Year Buckets (Themes) ─────────────────────────────────────────────────────

function BucketsSection({ buckets, year, onAdd, onUpdate, onDelete }: {
  buckets: YearBucket[];
  year: number;
  onAdd: (data: { title: string; description: string; color: string }) => void;
  onUpdate: (id: number, data: Partial<YearBucket>) => void;
  onDelete: (id: number) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newBucket, setNewBucket] = useState({ title: "", description: "", color: "#D4A853" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDesc, setEditDesc] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl" style={{ color: "var(--ink)" }}>Year Themes</h3>
          <p className="text-xs font-mono opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>The big buckets your year is organized around</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: "var(--ink)", color: "var(--bg)" }}>
          <Plus size={14} /> Add Theme
        </button>
      </div>

      {showAdd && (
        <div className="card p-4 animate-scale-in space-y-3">
          <input placeholder="Theme title (e.g. Build, Invest, Deepen)" value={newBucket.title}
            onChange={(e) => setNewBucket({ ...newBucket, title: e.target.value })}
            className="w-full bg-transparent border-b pb-2 font-display text-lg focus:outline-none focus:border-amber-accent"
            style={{ borderColor: "var(--border)", color: "var(--ink)" }} autoFocus />
          <textarea placeholder="What does this theme mean to you this year?" value={newBucket.description}
            onChange={(e) => setNewBucket({ ...newBucket, description: e.target.value })}
            rows={2} className="w-full text-sm bg-transparent focus:outline-none resize-none opacity-70"
            style={{ color: "var(--ink)" }} />
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {YEAR_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setNewBucket({ ...newBucket, color: c })}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${newBucket.color === c ? "scale-125" : "border-transparent hover:scale-110"}`}
                  style={{ background: c, borderColor: newBucket.color === c ? "var(--ink)" : "transparent" }} />
              ))}
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => setShowAdd(false)} className="text-xs px-3 py-1.5 opacity-50 hover:opacity-100" style={{ color: "var(--ink)" }}>Cancel</button>
              <button onClick={() => { if (newBucket.title.trim()) { onAdd(newBucket); setNewBucket({ title: "", description: "", color: "#D4A853" }); setShowAdd(false); }}}
                className="text-xs px-4 py-1.5 bg-amber-accent text-ink font-medium rounded-lg hover:bg-amber-warm transition-colors">
                Add Theme
              </button>
            </div>
          </div>
        </div>
      )}

      {buckets.length === 0 ? (
        <div className="card p-8 text-center opacity-50">
          <p className="text-sm font-mono" style={{ color: "var(--ink)" }}>No themes yet. What are the big areas of focus this year?</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {buckets.map((bucket) => (
            <div key={bucket.id} className="card p-4 group space-y-2" style={{ borderTop: `3px solid ${bucket.color}` }}>
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-display text-base leading-tight" style={{ color: "var(--ink)" }}>{bucket.title}</h4>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setEditingId(editingId === bucket.id ? null : bucket.id); setEditDesc(bucket.description || ""); }}
                    className="p-1 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--ink)" }}>
                    <Pencil size={11} />
                  </button>
                  <button onClick={() => onDelete(bucket.id)} className="p-1 text-rust opacity-50 hover:opacity-100 transition-opacity">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              {editingId === bucket.id ? (
                <div className="space-y-2">
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3}
                    className="w-full text-xs bg-transparent focus:outline-none resize-none leading-relaxed"
                    style={{ color: "var(--ink)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 8px" }} autoFocus />
                  <div className="flex gap-2">
                    <button onClick={() => { onUpdate(bucket.id, { description: editDesc }); setEditingId(null); }}
                      className="text-[10px] px-2.5 py-1 bg-sage text-white rounded font-medium">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-[10px] px-2.5 py-1 opacity-50 hover:opacity-100" style={{ color: "var(--ink)" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                bucket.description && <p className="text-xs opacity-50 leading-relaxed" style={{ color: "var(--ink)" }}>{bucket.description}</p>
              )}
              <div className="w-full h-1 rounded-full mt-2" style={{ background: bucket.color + "30" }}>
                <div className="h-full rounded-full w-full" style={{ background: bucket.color, opacity: 0.5 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Year Goals ────────────────────────────────────────────────────────────────

function YearGoalsSection({ goals, year, onAdd, onToggle, onDelete }: {
  goals: YearGoal[];
  year: number;
  onAdd: (category: YearGoalCategory, text: string) => void;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const [addingCat, setAddingCat] = useState<string | null>(null);
  const [newText, setNewText] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-xl" style={{ color: "var(--ink)" }}>Year Goals</h3>
        <p className="text-xs font-mono opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>
          {goals.filter((g) => g.completed).length} of {goals.length} complete
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {GOAL_CATEGORIES.map(({ key, color }) => {
          const catGoals = goals.filter((g) => g.category === key);
          const done = catGoals.filter((g) => g.completed).length;
          return (
            <div key={key} className="card p-4 space-y-3" style={{ borderLeft: `3px solid ${color}` }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider" style={{ color }}>
                  {key}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>{done}/{catGoals.length}</span>
                  <button onClick={() => setAddingCat(addingCat === key ? null : key)}
                    className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-all hover:opacity-70"
                    style={{ background: color + "25", color }}>+</button>
                </div>
              </div>

              {addingCat === key && (
                <div className="flex gap-1.5 animate-scale-in">
                  <input autoFocus placeholder="New goal..." value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && newText.trim()) { onAdd(key as YearGoalCategory, newText); setNewText(""); setAddingCat(null); } if (e.key === "Escape") setAddingCat(null); }}
                    className="flex-1 text-xs bg-transparent border-b pb-0.5 focus:outline-none"
                    style={{ borderColor: color, color: "var(--ink)" }} />
                  <button onClick={() => { if (newText.trim()) { onAdd(key as YearGoalCategory, newText); setNewText(""); setAddingCat(null); }}}
                    className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: color, color: "white" }}>+</button>
                </div>
              )}

              <div className="space-y-1.5">
                {catGoals.map((goal) => (
                  <div key={goal.id} className="flex items-start gap-2 group">
                    <button onClick={() => onToggle(goal.id, !goal.completed)}
                      className="mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all"
                      style={{ background: goal.completed ? color : "transparent", borderColor: color }}>
                      {goal.completed && <Check size={9} strokeWidth={3} className="text-white" />}
                    </button>
                    <span className={`text-xs flex-1 leading-snug ${goal.completed ? "line-through opacity-40" : ""}`}
                      style={{ color: "var(--ink)" }}>
                      {goal.text}
                    </span>
                    <button onClick={() => onDelete(goal.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-rust transition-opacity flex-shrink-0">
                      <Trash2 size={9} />
                    </button>
                  </div>
                ))}
                {catGoals.length === 0 && (
                  <p className="text-[10px] font-mono opacity-25 italic" style={{ color: "var(--ink)" }}>No goals yet</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main YearView ─────────────────────────────────────────────────────────────

export default function YearView() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [reflection, setReflection] = useState<YearReflection | null>(null);
  const [buckets, setBuckets] = useState<YearBucket[]>([]);
  const [goals, setGoals] = useState<YearGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/year?year=${year}`);
    if (res.ok) {
      const data = await res.json();
      setReflection(data.reflection);
      setBuckets(data.buckets);
      setGoals(data.goals);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [year]);

  async function saveReflection(data: Partial<YearReflection>) {
    const res = await fetch("/api/year", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "reflection", year, ...data }),
    });
    if (res.ok) setReflection(await res.json());
  }

  async function addBucket(data: { title: string; description: string; color: string }) {
    const res = await fetch("/api/year", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "bucket", year, ...data }) });
    if (res.ok) { const item = await res.json(); setBuckets((prev) => [...prev, item]); }
  }

  async function updateBucket(id: number, data: Partial<YearBucket>) {
    const res = await fetch("/api/year", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "bucket", id, ...data }) });
    if (res.ok) { const updated = await res.json(); setBuckets((prev) => prev.map((b) => b.id === id ? updated : b)); }
  }

  async function deleteBucket(id: number) {
    await fetch(`/api/year?type=bucket&id=${id}`, { method: "DELETE" });
    setBuckets((prev) => prev.filter((b) => b.id !== id));
  }

  async function addGoal(category: YearGoalCategory, text: string) {
    const res = await fetch("/api/year", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "goal", year, category, text }) });
    if (res.ok) { const item = await res.json(); setGoals((prev) => [...prev, item]); }
  }

  async function toggleGoal(id: number, completed: boolean) {
    const res = await fetch("/api/year", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "goal", id, completed }) });
    if (res.ok) setGoals((prev) => prev.map((g) => g.id === id ? { ...g, completed } : g));
  }

  async function deleteGoal(id: number) {
    await fetch(`/api/year?type=goal&id=${id}`, { method: "DELETE" });
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-end gap-3">
          <YearPicker year={year} onChange={setYear} />
          {year !== currentYear && (
            <button onClick={() => setYear(currentYear)}
              className="mb-2 text-xs font-mono px-3 py-1.5 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
              style={{ background: "var(--bg-muted)", color: "var(--ink)" }}>
              Back to {currentYear}
            </button>
          )}
        </div>
        <p className="text-sm font-mono opacity-40" style={{ color: "var(--ink)" }}>
          {year === currentYear ? "Your personal manifesto for this year" : `Looking back at ${year}`}
        </p>
        <div className="ornament-divider mt-4 opacity-20"><span>◆</span></div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Four reflection questions */}
          <div className="space-y-3">
            <h3 className="font-display text-xl" style={{ color: "var(--ink)" }}>Foundations</h3>
            <p className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>
              Return to these when you feel lost. Your compass for the year.
            </p>
            <ReflectionSection reflection={reflection} year={year} onSave={saveReflection} />
          </div>

          {/* Year Themes/Buckets */}
          <BucketsSection buckets={buckets} year={year} onAdd={addBucket} onUpdate={updateBucket} onDelete={deleteBucket} />

          {/* Year Goals */}
          <YearGoalsSection goals={goals} year={year} onAdd={addGoal} onToggle={toggleGoal} onDelete={deleteGoal} />
        </>
      )}
    </div>
  );
}
