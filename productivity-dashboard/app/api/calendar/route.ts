import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const { searchParams } = new URL(req.url);
    const accessToken = searchParams.get("token");

    if (!accessToken) {
      return NextResponse.json({ error: "No access token", events: [] });
    }

    const now = new Date().toISOString();
    const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(now)}&` +
      `timeMax=${encodeURIComponent(weekAhead)}&` +
      `singleEvents=true&orderBy=startTime&maxResults=20`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message || "Calendar fetch failed", events: [] });
    }

    const data = await res.json();
    const events = (data.items || []).map((e: any) => ({
      id: e.id,
      title: e.summary || "Untitled",
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      allDay: !e.start?.dateTime,
      location: e.location || null,
      description: e.description || null,
      color: e.colorId ? GOOGLE_COLORS[e.colorId] || "#D87C4F" : "#D87C4F",
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Calendar error:", error);
    return NextResponse.json({ error: "Failed to fetch calendar", events: [] });
  }
}

const GOOGLE_COLORS: Record<string, string> = {
  "1": "#7986CB", "2": "#33B679", "3": "#8E24AA", "4": "#E67C73",
  "5": "#F6BF26", "6": "#F4511E", "7": "#039BE5", "8": "#616161",
  "9": "#3F51B5", "10": "#0B8043", "11": "#D50000",
};
