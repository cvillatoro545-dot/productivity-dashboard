"use client";

import { useState, useEffect } from "react";
import { JournalEntry } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { BookOpen, Save, ChevronDown } from "lucide-react";

const MOODS = [
  { value: 1, emoji: "😔", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

export default function JournalPanel() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [today, setToday] = useState<JournalEntry | null>(null);
  const [form, setForm] = useState({ mood: 3, content: "", gratitude: "", intentions: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    const res = await fetch("/api/journal");
    if (res.ok) {
      const data: JournalEntry[] = await res.json();
      setEntries(data);
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const todayEntry = data.find((e) => e.entry_date.split("T")[0] === todayStr);
      if (todayEntry) {
        setToday(todayEntry);
        setForm({
          mood: todayEntry.mood || 3,
          content: todayEntry.content || "",
          gratitude: todayEntry.gratitude || "",
          intentions: todayEntry.intentions || "",
        });
      }
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, entry_date: format(new Date(), "yyyy-MM-dd") }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        fetchEntries();
      }
    } finally {
      setSaving(false);
    }
  }

  const pastEntries = entries.filter((e) => e.entry_date.split("T")[0] !== format(new Date(), "yyyy-MM-dd"));

  return (
    <div className="space-y-4">
      {/* Today's Entry */}
      <div className="card p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-amber-accent" />
            <span className="font-display text-lg" style={{ color: "var(--ink)" }}>Today's Reflection</span>
          </div>
          <span className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>{format(new Date(), "MMMM d, yyyy")}</span>
        </div>

        {/* Mood Selector */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest opacity-40 mb-3" style={{ color: "var(--ink)" }}>How are you feeling?</p>
          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button key={m.value} onClick={() => setForm({ ...form, mood: m.value })} className={`flex-1 py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${form.mood === m.value ? "scale-110" : "opacity-40 hover:opacity-70"}`}
                style={{ background: form.mood === m.value ? "var(--bg-muted)" : "transparent", boxShadow: form.mood === m.value ? "0 4px 12px rgba(0,0,0,0.1)" : undefined }}>
                <span className="text-xl">{m.emoji}</span>
                <span className="text-[10px] font-mono" style={{ color: "var(--ink)" }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Gratitude */}
        <div>
          <label className="text-xs font-mono uppercase tracking-widest opacity-40 block mb-2" style={{ color: "var(--ink)" }}>Grateful for...</label>
          <textarea value={form.gratitude} onChange={(e) => setForm({ ...form, gratitude: e.target.value })} placeholder="What are you grateful for today?" rows={2} className="w-full rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-accent/30 leading-relaxed transition-all" style={{ background: "var(--bg-muted)", color: "var(--ink)", border: "1px solid var(--border)" }} />
        </div>

        {/* Intentions */}
        <div>
          <label className="text-xs font-mono uppercase tracking-widest opacity-40 block mb-2" style={{ color: "var(--ink)" }}>Today's intentions</label>
          <textarea value={form.intentions} onChange={(e) => setForm({ ...form, intentions: e.target.value })} placeholder="What do you intend to focus on today?" rows={2} className="w-full rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-accent/30 leading-relaxed transition-all" style={{ background: "var(--bg-muted)", color: "var(--ink)", border: "1px solid var(--border)" }} />
        </div>

        {/* Reflection */}
        <div>
          <label className="text-xs font-mono uppercase tracking-widest opacity-40 block mb-2" style={{ color: "var(--ink)" }}>Reflection</label>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="How was your day? What's on your mind?" rows={4} className="w-full rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-accent/30 leading-relaxed transition-all" style={{ background: "var(--bg-muted)", color: "var(--ink)", border: "1px solid var(--border)" }} />
        </div>

        <button onClick={handleSave} disabled={saving} className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${saved ? "bg-sage text-white" : "bg-amber-accent text-ink hover:bg-amber-warm"}`}>
          <Save size={14} />
          {saved ? "Saved ✓" : saving ? "Saving..." : "Save Entry"}
        </button>
      </div>

      {/* Past Entries */}
      {pastEntries.length > 0 && (
        <div>
          <button onClick={() => setShowPast(!showPast)} className="flex items-center gap-2 text-sm font-mono opacity-50 hover:opacity-100 transition-opacity mb-3" style={{ color: "var(--ink)" }}>
            <ChevronDown size={14} className={`transition-transform ${showPast ? "rotate-180" : ""}`} />
            Past entries ({pastEntries.length})
          </button>
          {showPast && (
            <div className="space-y-3 animate-fade-in">
              {pastEntries.slice(0, 7).map((entry) => {
                const mood = MOODS.find((m) => m.value === entry.mood);
                return (
                  <div key={entry.id} className="card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-display" style={{ color: "var(--ink)" }}>{format(parseISO(entry.entry_date), "EEEE, MMMM d")}</span>
                      {mood && <span className="text-lg" title={mood.label}>{mood.emoji}</span>}
                    </div>
                    {entry.gratitude && <p className="text-xs opacity-60 leading-relaxed" style={{ color: "var(--ink)" }}><span className="font-mono uppercase tracking-wider opacity-50">Grateful: </span>{entry.gratitude}</p>}
                    {entry.content && <p className="text-xs opacity-60 leading-relaxed line-clamp-3" style={{ color: "var(--ink)" }}>{entry.content}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
