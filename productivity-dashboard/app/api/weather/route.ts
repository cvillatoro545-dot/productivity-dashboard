import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json({ error: "lat and lon required" }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      // Return mock data if no API key
      return NextResponse.json({
        temp: 72,
        condition: "Clear",
        icon: "01d",
        city: "Your City",
        humidity: 45,
        feelsLike: 70,
      });
    }

    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
    );
    const data = await res.json();

    return NextResponse.json({
      temp: Math.round(data.main.temp),
      condition: data.weather[0].main,
      icon: data.weather[0].icon,
      city: data.name,
      humidity: data.main.humidity,
      feelsLike: Math.round(data.main.feels_like),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}
