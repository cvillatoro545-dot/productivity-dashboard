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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchTag, setSearchTag] = useState("");

  const allTags = [...new Set(notes.flatMap((n) => n.tags))].slice(0, 12);
  const filtered = searchTag
    ? notes.filter((n) => n.tags.includes(searchTag))
    : notes;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.title.trim()) return;
    setSubmitting(true);
    try {
      const tags = newNote.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newNote.title, content: newNote.content, tags }),
      });
      if (res.ok) {
        await onUpdate();
        setNewNote({ title: "", content: "", tags: "" });
        setShowForm(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePin(note: Note) {
    const res = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    if (res.ok) {
      setNotes(notes.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n)));
    }
  }

  async function deleteNote(id: number) {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) setNotes(notes.filter((n) => n.id !== id));
  }

  const noteColors = [
    "border-l-amber-accent bg-amber-accent/3",
    "border-l-sage bg-sage/3",
    "border-l-rust/70 bg-rust/3",
    "border-l-ink/20 bg-ink/2",
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchTag(searchTag === tag ? "" : tag)}
              className={`text-xs px-2.5 py-1 rounded-lg font-mono transition-all ${
                searchTag === tag
                  ? "bg-ink text-cream"
                  : "bg-cream-muted text-ink/50 hover:text-ink hover:bg-ink/8"
              }`}
            >
              #{tag}
            </button>
          ))}
          {searchTag && (
            <button
              onClick={() => setSearchTag("")}
              className="text-xs text-ink/40 hover:text-ink transition-colors flex items-center gap-1"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-cream rounded-lg text-sm font-medium hover:bg-ink/80 transition-all group"
        >
          <Plus size={14} className="group-hover:rotate-90 transition-transform duration-200" />
          New Note
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card p-4 animate-scale-in border-amber-accent/30">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full bg-transparent border-b border-ink/15 pb-2 text-ink placeholder-ink/30 font-display text-lg focus:outline-none focus:border-amber-accent transition-colors"
              autoFocus
            />
            <textarea
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              rows={4}
              className="w-full bg-cream-muted/50 rounded-lg p-3 text-sm text-ink/80 placeholder-ink/25 focus:outline-none focus:ring-1 focus:ring-amber-accent/30 leading-relaxed"
            />
            <div className="flex items-center gap-2">
              <Tag size={13} className="text-ink/30 flex-shrink-0" />
              <input
                type="text"
                placeholder="Tags, comma separated..."
                value={newNote.tags}
                onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                className="flex-1 bg-transparent text-xs font-mono text-ink/60 placeholder-ink/25 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs px-3 py-1.5 text-ink/50 hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !newNote.title.trim()}
                className="text-xs px-4 py-1.5 bg-amber-accent text-ink font-medium rounded-lg hover:bg-amber-warm transition-colors disabled:opacity-40"
              >
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes Grid */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3 opacity-30">◈</div>
          <p className="text-ink/40 text-sm font-mono">
            {searchTag ? `No notes tagged #${searchTag}` : "No notes yet. Capture your thoughts."}
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 space-y-3">
          {filtered.map((note, i) => (
            <div
              key={note.id}
              className={`break-inside-avoid card card-hover p-4 border-l-2 group animate-fade-up ${noteColors[i % noteColors.length]}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display text-base text-ink leading-tight flex-1">
                  {note.pinned && <span className="text-amber-accent mr-1.5 text-sm">✦</span>}
                  {note.title}
                </h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => togglePin(note)}
                    className="p-1 text-ink/25 hover:text-amber-accent transition-colors"
                    title={note.pinned ? "Unpin" : "Pin"}
                  >
                    {note.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1 text-ink/25 hover:text-rust transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {note.content && (
                <p className="text-sm text-ink/60 leading-relaxed mb-3 line-clamp-5">
                  {note.content}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchTag(tag)}
                      className="text-[10px] font-mono px-1.5 py-0.5 bg-ink/6 text-ink/40 rounded hover:bg-ink/10 hover:text-ink/60 transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-ink/25 flex-shrink-0 ml-2">
                  {format(parseISO(note.updated_at), "MMM d")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
