"use client";

import { useState, useEffect, useRef } from "react";
import { Book } from "@/lib/types";
import { Search, Plus, Trash2, BookOpen, Check, Clock, X, Bookmark } from "lucide-react";

const STATUS_CONFIG = {
  want_to_read: { label: "Want to Read", color: "text-amber-accent", bg: "bg-amber-accent/10", icon: Bookmark },
  reading: { label: "Reading", color: "text-sage", bg: "bg-sage/10", icon: BookOpen },
  read: { label: "Read", color: "text-ink/50", bg: "bg-ink/5", icon: Check },
  dnf: { label: "Did Not Finish", color: "text-rust", bg: "bg-rust/10", icon: X },
};

type BookStatus = keyof typeof STATUS_CONFIG;

interface SearchResult {
  ol_key: string;
  title: string;
  author: string;
  cover_url: string | null;
  year: number | null;
}

function BookCard({ book, onStatusChange, onDelete, isSearch, onAdd }: {
  book: SearchResult | Book;
  onStatusChange?: (id: number, status: BookStatus) => void;
  onDelete?: (id: number) => void;
  isSearch?: boolean;
  onAdd?: (book: SearchResult) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const savedBook = book as Book;
  const searchBook = book as SearchResult;

  return (
    <div className="card card-hover group flex flex-col overflow-hidden animate-fade-up">
      {/* Cover */}
      <div className="relative aspect-[2/3] overflow-hidden flex-shrink-0" style={{ background: "var(--bg-muted)" }}>
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={32} className="opacity-20" style={{ color: "var(--ink)" }} />
          </div>
        )}
        {/* Status badge on saved books */}
        {!isSearch && (
          <div className="absolute top-2 left-2">
            <span className={`text-[10px] font-mono px-2 py-1 rounded-full ${STATUS_CONFIG[savedBook.status].bg} ${STATUS_CONFIG[savedBook.status].color}`}>
              {STATUS_CONFIG[savedBook.status].label}
            </span>
          </div>
        )}
        {/* Add button on search results */}
        {isSearch && onAdd && (
          <button
            onClick={() => onAdd(searchBook)}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-accent text-ink text-sm font-medium">
              <Plus size={14} /> Add
            </div>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <h3 className="font-display text-sm leading-tight line-clamp-2" style={{ color: "var(--ink)" }}>{book.title}</h3>
        <p className="text-xs opacity-50 font-mono truncate" style={{ color: "var(--ink)" }}>{book.author || "Unknown"}</p>
        {book.year && <p className="text-[10px] opacity-30 font-mono" style={{ color: "var(--ink)" }}>{book.year}</p>}

        {/* Status controls for saved books */}
        {!isSearch && onStatusChange && onDelete && (
          <div className="mt-auto pt-2 flex items-center justify-between relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`text-[10px] font-mono px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${STATUS_CONFIG[savedBook.status].bg} ${STATUS_CONFIG[savedBook.status].color}`}
            >
              {STATUS_CONFIG[savedBook.status].label}
              <span className="opacity-50">▾</span>
            </button>
            <button onClick={() => onDelete(savedBook.id)} className="opacity-0 group-hover:opacity-100 p-1 text-rust transition-all">
              <Trash2 size={11} />
            </button>

            {showStatusMenu && (
              <div className="absolute bottom-8 left-0 z-20 card shadow-lg py-1 min-w-[160px] animate-scale-in">
                {(Object.entries(STATUS_CONFIG) as [BookStatus, typeof STATUS_CONFIG[BookStatus]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => { onStatusChange(savedBook.id, key); setShowStatusMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center gap-2 hover:opacity-70 transition-opacity ${cfg.color} ${savedBook.status === key ? "font-bold" : ""}`}
                  >
                    <cfg.icon size={11} /> {cfg.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BooksPanel() {
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<BookStatus | "all">("all");
  const [mode, setMode] = useState<"library" | "search">("library");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSaved();
  }, []);

  async function fetchSaved() {
    const res = await fetch("/api/books?saved=true");
    if (res.ok) setSavedBooks(await res.json());
    setLoading(false);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setMode("search");
    try {
      const res = await fetch(`/api/books?q=${encodeURIComponent(query)}`);
      if (res.ok) setSearchResults(await res.json());
    } finally { setSearching(false); }
  }

  async function handleAdd(book: SearchResult) {
    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(book),
    });
    if (res.ok) {
      await fetchSaved();
      setMode("library");
      setQuery("");
      setSearchResults([]);
    }
  }

  async function handleStatusChange(id: number, status: BookStatus) {
    const res = await fetch(`/api/books/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setSavedBooks(savedBooks.map((b) => b.id === id ? { ...b, status } : b));
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (res.ok) setSavedBooks(savedBooks.filter((b) => b.id !== id));
  }

  const filtered = activeFilter === "all" ? savedBooks : savedBooks.filter((b) => b.status === activeFilter);

  const counts = {
    all: savedBooks.length,
    want_to_read: savedBooks.filter((b) => b.status === "want_to_read").length,
    reading: savedBooks.filter((b) => b.status === "reading").length,
    read: savedBooks.filter((b) => b.status === "read").length,
    dnf: savedBooks.filter((b) => b.status === "dnf").length,
  };

  return (
    <div className="space-y-5">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" style={{ color: "var(--ink)" }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search books by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-accent/30 transition-all"
            style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setSearchResults([]); setMode("library"); }} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-70 transition-opacity">
              <X size={14} style={{ color: "var(--ink)" }} />
            </button>
          )}
        </div>
        <button type="submit" disabled={searching || !query.trim()} className="px-4 py-2.5 bg-amber-accent text-ink font-medium rounded-xl text-sm hover:bg-amber-warm transition-colors disabled:opacity-40 flex items-center gap-2">
          <Search size={14} />
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Mode Toggle + Filters */}
      {mode === "library" && (
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => setActiveFilter("all")} className="text-xs px-3 py-1.5 rounded-lg font-mono transition-all" style={{ background: activeFilter === "all" ? "var(--ink)" : "var(--bg-muted)", color: activeFilter === "all" ? "var(--bg)" : "var(--ink)", opacity: activeFilter === "all" ? 1 : 0.55 }}>
            All {counts.all > 0 && `(${counts.all})`}
          </button>
          {(Object.entries(STATUS_CONFIG) as [BookStatus, typeof STATUS_CONFIG[BookStatus]][]).map(([key, cfg]) => (
            counts[key] > 0 && (
              <button key={key} onClick={() => setActiveFilter(key)} className={`text-xs px-3 py-1.5 rounded-lg font-mono transition-all ${cfg.color}`} style={{ background: activeFilter === key ? "var(--ink)" : "var(--bg-muted)", color: activeFilter === key ? "var(--bg)" : undefined, opacity: activeFilter === key ? 1 : 0.6 }}>
                {cfg.label} ({counts[key]})
              </button>
            )
          ))}
        </div>
      )}

      {mode === "search" && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-mono opacity-50" style={{ color: "var(--ink)" }}>
            {searching ? "Searching Open Library..." : `${searchResults.length} results for "${query}"`}
          </p>
          <button onClick={() => { setMode("library"); setSearchResults([]); setQuery(""); }} className="text-xs font-mono opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1" style={{ color: "var(--ink)" }}>
            <X size={11} /> Back to library
          </button>
        </div>
      )}

      {/* Search Results */}
      {mode === "search" && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {searching ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="aspect-[2/3]" style={{ background: "var(--bg-muted)" }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 rounded" style={{ background: "var(--bg-muted)" }} />
                  <div className="h-2 w-2/3 rounded" style={{ background: "var(--bg-muted)" }} />
                </div>
              </div>
            ))
          ) : searchResults.length === 0 ? (
            <div className="col-span-full card p-10 text-center">
              <p className="text-sm font-mono opacity-40" style={{ color: "var(--ink)" }}>No results found. Try a different title.</p>
            </div>
          ) : (
            searchResults.map((book, i) => (
              <BookCard key={book.ol_key} book={book} isSearch onAdd={handleAdd} />
            ))
          )}
        </div>
      )}

      {/* Library */}
      {mode === "library" && (
        <>
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-[2/3]" style={{ background: "var(--bg-muted)" }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <div className="text-5xl opacity-20">📚</div>
              <p className="font-display text-lg opacity-40" style={{ color: "var(--ink)" }}>
                {savedBooks.length === 0 ? "Your library is empty" : `No ${activeFilter.replace(/_/g, " ")} books`}
              </p>
              <p className="text-sm font-mono opacity-30" style={{ color: "var(--ink)" }}>
                {savedBooks.length === 0 ? "Search for a book above to get started" : "Try a different filter"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {filtered.map((book, i) => (
                <BookCard key={book.id} book={book} onStatusChange={handleStatusChange} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
