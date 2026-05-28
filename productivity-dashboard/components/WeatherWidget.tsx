"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Zap, Wind } from "lucide-react";

interface Weather {
  temp: number;
  condition: string;
  city: string;
  humidity: number;
  feelsLike: number;
  icon: string;
}

function WeatherIcon({ condition }: { condition: string }) {
  const c = condition.toLowerCase();
  const cls = "opacity-60";
  if (c.includes("rain") || c.includes("drizzle")) return <CloudRain size={16} className={cls} />;
  if (c.includes("snow")) return <CloudSnow size={16} className={cls} />;
  if (c.includes("thunder")) return <Zap size={16} className={cls} />;
  if (c.includes("cloud")) return <Cloud size={16} className={cls} />;
  if (c.includes("wind")) return <Wind size={16} className={cls} />;
  return <Sun size={16} className="text-amber-accent opacity-80" />;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        if (res.ok) setWeather(await res.json());
      } catch {}
    });
  }, []);

  if (!weather) return null;

  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono"
      style={{ borderColor: 'var(--border)', color: 'var(--ink-muted)' }}>
      <WeatherIcon condition={weather.condition} />
      <span className="text-base font-display" style={{ color: 'var(--ink)' }}>{weather.temp}°</span>
      <div className="opacity-50">
        <div>{weather.condition}</div>
        <div>Feels {weather.feelsLike}°</div>
      </div>
    </div>
  );
}
