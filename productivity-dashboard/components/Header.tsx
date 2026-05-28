"use client";

import { format } from "date-fns";
import { Moon, Sun } from "lucide-react";
import WeatherWidget from "./WeatherWidget";

interface HeaderProps {
  today: Date;
  darkMode: boolean;
  toggleDark: () => void;
}

export default function Header({ today, darkMode, toggleDark }: HeaderProps) {
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="py-8 mb-2">
      <div className="flex items-start justify-between">
        <div className="stagger-child animate-fade-up delay-100">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-amber-accent font-display text-2xl">✦</span>
            <span className="text-xs font-mono tracking-[0.2em] uppercase opacity-40">Focus</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl leading-tight" style={{ color: 'var(--ink)' }}>
            {greeting}.
          </h1>
          <p className="mt-1 text-sm font-mono tracking-wide opacity-40" style={{ color: 'var(--ink)' }}>
            {format(today, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <div className="stagger-child animate-fade-up delay-150 flex items-start gap-4">
          <WeatherWidget />
          <div className="text-right">
            <div className="text-3xl font-mono tabular-nums opacity-20" style={{ color: 'var(--ink)' }}>
              {format(today, "HH:mm")}
            </div>
            <div className="text-xs font-mono mt-1 tracking-widest uppercase opacity-30" style={{ color: 'var(--ink)' }}>
              {Intl.DateTimeFormat().resolvedOptions().timeZone.split("/")[1]?.replace("_", " ") ?? "Local"}
            </div>
          </div>
          <button
            onClick={toggleDark}
            className="mt-1 p-2 rounded-lg border transition-all hover:scale-105"
            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
            title="Toggle dark mode"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
      <div className="ornament-divider mt-6 opacity-20">
        <span>◆</span>
      </div>
    </header>
  );
}
