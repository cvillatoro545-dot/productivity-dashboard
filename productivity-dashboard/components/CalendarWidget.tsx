"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Calendar, Clock, MapPin, LogIn, LogOut, RefreshCw } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
  color: string;
}

function EventCard({ event }: { event: CalEvent }) {
  const start = parseISO(event.start);
  const isAllDay = event.allDay;
  
  let dateLabel = format(start, "EEE, MMM d");
  if (isToday(start)) dateLabel = "Today";
  if (isTomorrow(start)) dateLabel = "Tomorrow";

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl group transition-all"
      style={{ background: "var(--bg-muted)", borderLeft: `3px solid ${event.color}` }}>
      <div className="flex-shrink-0 text-center min-w-[40px]">
        <div className="text-[10px] font-mono uppercase opacity-50" style={{ color: "var(--ink)" }}>
          {isToday(start) ? "Today" : isTomorrow(start) ? "Tmrw" : format(start, "EEE")}
        </div>
        <div className="font-display text-lg leading-none" style={{ color: event.color }}>
          {format(start, "d")}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug truncate" style={{ color: "var(--ink)" }}>
          {event.title}
        </p>
        {!isAllDay && (
          <div className="flex items-center gap-1 mt-0.5">
            <Clock size={10} className="opacity-40" style={{ color: "var(--ink)" }} />
            <span className="text-[10px] font-mono opacity-50" style={{ color: "var(--ink)" }}>
              {format(start, "h:mm a")}
            </span>
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={10} className="opacity-40" style={{ color: "var(--ink)" }} />
            <span className="text-[10px] font-mono opacity-40 truncate" style={{ color: "var(--ink)" }}>
              {event.location}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarWidget({ compact = false }: { compact?: boolean }) {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session && (session as any).accessToken) {
      fetchEvents();
    }
  }, [session]);

  async function fetchEvents() {
    setLoading(true);
    setError(null);
    try {
      const token = (session as any)?.accessToken;
      const res = await fetch(`/api/calendar?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.error && data.error !== "No access token") {
        setError(data.error);
      } else {
        setEvents(data.events || []);
      }
    } catch (e) {
      setError("Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 w-32 rounded mb-3" style={{ background: "var(--bg-muted)" }} />
        <div className="h-12 rounded" style={{ background: "var(--bg-muted)" }} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-amber-accent" />
          <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Calendar</h3>
        </div>
        <p className="text-xs font-mono opacity-40 leading-relaxed" style={{ color: "var(--ink)" }}>
          Connect Google Calendar to see your upcoming events here.
        </p>
        <button
          onClick={() => signIn("google")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 w-full justify-center"
          style={{ background: "var(--ink)", color: "var(--bg)" }}>
          <LogIn size={15} />
          Connect Google Calendar
        </button>
      </div>
    );
  }

  const todayEvents = events.filter((e) => isToday(parseISO(e.start)));
  const upcomingEvents = events.filter((e) => !isToday(parseISO(e.start)));
  const displayEvents = compact ? events.slice(0, 3) : events;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-amber-accent" />
          <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Calendar</h3>
          {session?.user?.email && (
            <span className="text-[10px] font-mono opacity-30 hidden sm:block" style={{ color: "var(--ink)" }}>
              {session.user.email}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchEvents} disabled={loading}
            className="p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-opacity"
            style={{ color: "var(--ink)" }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => signOut()}
            className="p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-opacity"
            style={{ color: "var(--ink)" }} title="Disconnect">
            <LogOut size={13} />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs font-mono text-rust p-3 rounded-xl" style={{ background: "rgba(196,97,74,0.1)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--bg-muted)" }} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm font-mono opacity-30 py-3 text-center" style={{ color: "var(--ink)" }}>
          No upcoming events this week
        </p>
      ) : (
        <div className="space-y-2">
          {todayEvents.length > 0 && !compact && (
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest opacity-40" style={{ color: "var(--ink)" }}>Today</p>
              {todayEvents.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
          {upcomingEvents.length > 0 && !compact && (
            <div className="space-y-2">
              {todayEvents.length > 0 && (
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 pt-1" style={{ color: "var(--ink)" }}>Upcoming</p>
              )}
              {upcomingEvents.slice(0, 5).map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
          {compact && displayEvents.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}
