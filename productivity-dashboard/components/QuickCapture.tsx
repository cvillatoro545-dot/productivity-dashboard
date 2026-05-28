"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, CheckSquare, Lightbulb, FileText, BookOpen } from "lucide-react";

type CaptureType = "task" | "idea" | "note" | "journal";

const TYPES: { key: CaptureType; label: string; icon: React.ElementType; placeholder: string; color: string }[] = [
  { key: "task",    label: "Task",    icon: CheckSquare, placeholder: "What needs to be done?",        color: "#D4A853" },
  { key: "idea",    label: "Idea",    icon: Lightbulb,   placeholder: "Capture your idea...",          color: "#7A9E7E" },
  { key: "note",    label: "Note",    icon: FileText,    placeholder: "Quick note...",                  color: "#5B7FA6" },
  { key: "journal", label: "Thought", icon: BookOpen,    placeholder: "What's on your mind?",          color: "#9B6B9E" },
];

interface QuickCaptureProps {
  onCapture: () => void;
}

export default function QuickCapture({ onCapture }: QuickCaptureProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CaptureType>("task");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
    else { setText(""); setSaved(false); }
  }, [open]);

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      if (type === "task") {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: text.trim(), priority: "medium" }),
        });
      } else if (type === "note" || type === "idea") {
        await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: text.trim().slice(0, 60),
            content: text.trim().length > 60 ? text.trim() : undefined,
            tags: [type === "idea" ? "idea" : "quick-note"],
          }),
        });
      } else if (type === "journal") {
        const today = new Date().toLocaleDateString("en-CA");
        await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entry_date: today, content: text.trim() }),
        });
      }

      setSaved(true);
      setText("");
      onCapture();
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 800);
    } finally {
      setSaving(false);
    }
  }

  const currentType = TYPES.find((t) => t.key === type)!;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        style={{ background: "var(--ink)", color: "var(--bg)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
        title="Quick Capture (⌘K)">
        <Plus size={22} className="group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Shortcut hint */}
      <div className="fixed bottom-8 right-24 z-40 hidden sm:flex items-center gap-1 opacity-0 hover:opacity-0 pointer-events-none">
        <span className="text-[10px] font-mono opacity-30" style={{ color: "var(--ink)" }}>⌘K</span>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl p-5 space-y-4 animate-scale-in"
            style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest opacity-40" style={{ color: "var(--ink)" }}>
                Quick Capture
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono opacity-20 hidden sm:block" style={{ color: "var(--ink)" }}>esc to close</span>
                <button onClick={() => setOpen(false)} className="p-1 opacity-40 hover:opacity-100 transition-opacity" style={{ color: "var(--ink)" }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Type Selector */}
            <div className="flex gap-1.5">
              {TYPES.map((t) => (
                <button key={t.key} onClick={() => setType(t.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex-1 justify-center"
                  style={{ background: type === t.key ? t.color + "20" : "var(--bg-muted)", color: type === t.key ? t.color : "var(--ink)", opacity: type === t.key ? 1 : 0.5, border: `1px solid ${type === t.key ? t.color + "40" : "transparent"}` }}>
                  <t.icon size={12} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="relative">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
                }}
                placeholder={currentType.placeholder}
                rows={3}
                className="w-full bg-transparent text-base focus:outline-none leading-relaxed resize-none"
                style={{ color: "var(--ink)", borderBottom: `1px solid var(--border)`, paddingBottom: "12px" }}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-mono opacity-20 hidden sm:block" style={{ color: "var(--ink)" }}>⌘↵ to save</span>
              <button
                onClick={handleSave}
                disabled={saving || !text.trim()}
                className="ml-auto px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                style={{ background: saved ? "#7A9E7E" : currentType.color, color: "white" }}>
                {saved ? "Saved ✓" : saving ? "Saving..." : `Add ${currentType.label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
