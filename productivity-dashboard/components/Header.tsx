"use client";

import { format } from "date-fns";

interface HeaderProps {
  today: Date;
}

export default function Header({ today }: HeaderProps) {
  const hour = today.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="py-8 mb-2">
      <div className="flex items-start justify-between">
        <div className="stagger-child animate-fade-up delay-100">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-amber-accent font-display text-2xl">✦</span>
            <span className="text-xs font-mono tracking-[0.2em] uppercase text-ink/40">
              Focus
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight">
            {greeting}.
          </h1>
          <p className="mt-1 text-ink/40 text-sm font-mono tracking-wide">
            {format(today, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <div className="stagger-child animate-fade-up delay-150 hidden sm:block text-right">
          <div className="text-3xl font-mono text-ink/20 tabular-nums">
            {format(today, "HH:mm")}
          </div>
          <div className="text-xs text-ink/30 font-mono mt-1 tracking-widest uppercase">
            {Intl.DateTimeFormat().resolvedOptions().timeZone.split("/")[1]?.replace("_", " ") ?? "Local Time"}
          </div>
        </div>
      </div>

      <div className="ornament-divider mt-6 text-ink/20">
        <span>◆</span>
      </div>
    </header>
  );
}
