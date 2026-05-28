"use client";

import { useState } from "react";
import { Note } from "@/lib/types";
import { Plus, Trash2, Pin, PinOff, Tag, X } from "lucide-react";
import { format, parseISO } from "date-fns";

interface NotesPanelProps {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  onUpdate: () => void;
}

export default function NotesPanel({ notes, setNotes, onUpdate }: NotesPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchTag, setSearchTag] = useState("");

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).slice(0, 12);
  const filtered = searchTag ? notes.filter((n) => n.tags.includes(searchTag)) : notes;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.title.trim()) return;
    setSubmitting(true);
    try {
      const tags = newNote.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      const res = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newNote.title, content: newNote.content, tags }) });
      if (res.ok) { await onUpdate(); setNewNote({ title: "", content: "", tags: "" }); setShowForm(false); }
    } finally { setSubmitting(false); }
  }

  async function togglePin(note: Note) {
    const res = await fetch(`/api/notes/${note.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned: !note.pinned }) });
    if (res.ok) setNotes(notes.map((n) => n.id === note.id ? { ...n, pinned: !n.pinned } : n));
  }

  async function deleteNote(id: number) {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) setNotes(notes.filter((n) => n.id !== id));
  }

  const accentColors = ["border-l-amber-accent", "border-l-sage", "border-l-rust/70", "border-l-blue-400/50"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setSearchTag(searchTag === tag ? "" : tag)} className="text-xs px-2.5 py-1 rounded-lg font-mono transition-all"
              style={{ background: searchTag === tag ? "var(--ink)" : "var(--bg-muted)", color: searchTag === tag ? "var(--bg)" : "var(--ink)", opacity: searchTag === tag ? 1 : 0.6 }}>
              #{tag}
            </button>
          ))}
          {searchTag && (
            <button onClick={() => setSearchTag("")} className="text-xs flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity" style={{ color: "var(--ink)" }}>
              <X size={11} /> Clear
            </button>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all group" style={{ background: "var(--ink)", color: "var(--bg)" }}>
          <Plus size={14} className="group-hover:rotate-90 transition-transform duration-200" /> New Note
        </button>
      </div>

      {showForm && (
        <div className="card p-4 animate-scale-in">
          <form onSubmit={handleCreate} className="space-y-3">
            <input type="text" placeholder="Note title..." value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} className="w-full bg-transparent border-b pb-2 font-display text-lg focus:outline-none focus:border-amber-accent transition-colors" style={{ borderColor: "var(--border)", color: "var(--ink)" }} autoFocus />
            <textarea placeholder="Write your note here..." value={newNote.content} onChange={(e) => setNewNote({ ...newNote, content: e.target.value })} rows={4} className="w-full rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-accent/30 leading-relaxed" style={{ background: "var(--bg-muted)", color: "var(--ink)", border: "1px solid var(--border)" }} />
            <div className="flex items-center gap-2">
              <Tag size={13} className="flex-shrink-0 opacity-30" style={{ color: "var(--ink)" }} />
              <input type="text" placeholder="Tags, comma separated..." value={newNote.tags} onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })} className="flex-1 bg-transparent text-xs font-mono focus:outline-none opacity-60" style={{ color: "var(--ink)" }} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--ink)" }}>Cancel</button>
              <button type="submit" disabled={submitting || !newNote.title.trim()} className="text-xs px-4 py-1.5 bg-amber-accent text-ink font-medium rounded-lg hover:bg-amber-warm transition-colors disabled:opacity-40">Save Note</button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3 opacity-30">◈</div>
          <p className="text-sm font-mono opacity-40" style={{ color: "var(--ink)" }}>{searchTag ? `No notes tagged #${searchTag}` : "No notes yet. Capture your thoughts."}</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 space-y-3">
          {filtered.map((note, i) => (
            <div key={note.id} className={`break-inside-avoid card card-hover p-4 border-l-2 group animate-fade-up ${accentColors[i % accentColors.length]}`} style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display text-base leading-tight flex-1" style={{ color: "var(--ink)" }}>
                  {note.pinned && <span className="text-amber-accent mr-1.5 text-sm">✦</span>}
                  {note.title}
                </h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => togglePin(note)} className="p-1 hover:text-amber-accent transition-colors opacity-40 hover:opacity-100" style={{ color: "var(--ink)" }}>{note.pinned ? <PinOff size={12} /> : <Pin size={12} />}</button>
                  <button onClick={() => deleteNote(note.id)} className="p-1 hover:text-rust transition-colors opacity-40 hover:opacity-100" style={{ color: "var(--ink)" }}><Trash2 size={12} /></button>
                </div>
              </div>
              {note.content && <p className="text-sm leading-relaxed mb-3 line-clamp-5 opacity-60" style={{ color: "var(--ink)" }}>{note.content}</p>}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <button key={tag} onClick={() => setSearchTag(tag)} className="text-[10px] font-mono px-1.5 py-0.5 rounded opacity-40 hover:opacity-70 transition-opacity" style={{ background: "var(--bg-muted)", color: "var(--ink)" }}>#{tag}</button>
                  ))}
                </div>
                <span className="text-[10px] font-mono opacity-25 flex-shrink-0 ml-2" style={{ color: "var(--ink)" }}>{format(parseISO(note.updated_at), "MMM d")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
